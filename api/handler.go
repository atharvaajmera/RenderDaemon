// handler.go — HTTP handlers and route registration for the Render Queue API.
package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"render-queue/internal/config"
	"render-queue/internal/tasks"
)

type Handler struct {
	Store     *JobStore
	Config    *config.ConfigManager
	Queue     *asynq.Client
	Inspector *asynq.Inspector
}

func NewHandler(store *JobStore, cfg *config.ConfigManager, queue *asynq.Client, inspector *asynq.Inspector) *Handler {
	return &Handler{Store: store, Config: cfg, Queue: queue, Inspector: inspector}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/jobs", h.handleJobs)
	mux.HandleFunc("/jobs/", h.handleJobByID)
	mux.HandleFunc("/profiles", h.handleProfiles)
	mux.HandleFunc("/profiles/", h.handleProfileByID)
	mux.HandleFunc("/workflows", h.handleWorkflows)
	mux.HandleFunc("/workflows/", h.handleWorkflowByID)
	mux.HandleFunc("/upload", h.handleUpload)
	mux.HandleFunc("/download/", h.handleDownload)
}

// handleJobs — GET /jobs, POST /jobs
func (h *Handler) handleJobs(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listJobs(w, r)
	case http.MethodPost:
		h.createJob(w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
	}
}

func (h *Handler) listJobs(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status != "" {
		writeJSON(w, http.StatusOK, h.Store.ListByStatus(status))
		return
	}
	writeJSON(w, http.StatusOK, h.Store.List())
}

// handleJobByID — GET /jobs/{id}, PATCH /jobs/{id}/status
func (h *Handler) handleJobByID(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/jobs/")
	parts := strings.SplitN(path, "/", 2)

	id := parts[0]
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "missing job id",
		})
		return
	}

	if len(parts) == 2 {
		if parts[1] == "status" && r.Method == http.MethodPatch {
			h.updateJobStatus(w, r, id)
			return
		}
		if parts[1] == "outputs" && r.Method == http.MethodGet {
			h.handleJobOutputs(w, r, id)
			return
		}
	}

	if r.Method == http.MethodDelete {
		h.cancelJob(w, id)
		return
	}

	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
		return
	}

	h.getJob(w, id)
}

func (h *Handler) cancelJob(w http.ResponseWriter, id string) {
	job := h.Store.Get(id)
	if job == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "job not found",
		})
		return
	}

	if job.Status == StatusCompleted || job.Status == StatusFailed || job.Status == StatusCancelled {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "job is already completed, failed, or cancelled",
		})
		return
	}

	h.Store.UpdateStatus(id, StatusCancelled, "")

	if job.TaskID != "" && h.Inspector != nil {
		if err := h.Inspector.CancelProcessing(job.TaskID); err != nil {
			log.Printf("failed to cancel task %s via inspector: %v", job.TaskID, err)
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "job cancelled",
	})
}

var validStatuses = map[string]bool{
	StatusProcessing: true,
	StatusCompleted:  true,
	StatusFailed:     true,
}

// updateJobStatus — PATCH /jobs/{id}/status
func (h *Handler) updateJobStatus(w http.ResponseWriter, r *http.Request, id string) {
	var req UpdateJobStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON body: " + err.Error(),
		})
		return
	}

	if !validStatuses[req.Status] {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "status must be one of: processing, completed, failed",
		})
		return
	}

	job := h.Store.UpdateStatus(id, req.Status, req.Result)
	if job == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "job not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, job)
}

// createJob — POST /jobs
func (h *Handler) createJob(w http.ResponseWriter, r *http.Request) {
	var req CreateJobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON body: " + err.Error(),
		})
		return
	}

	if req.InputVideoURL == "" || req.TemplateID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "input_video_url and template_id are required",
		})
		return
	}

	// Prevent path traversal
	if strings.Contains(req.InputVideoURL, "..") {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid input_video_url path",
		})
		return
	}

	inputFilePath := filepath.Join("temp", req.InputVideoURL)
	if info, err := os.Stat(inputFilePath); err != nil || info.IsDir() {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "input file does not exist or is invalid: " + req.InputVideoURL,
		})
		return
	}

	if h.Config.Profiles().Get(req.TemplateID) == nil && h.Config.Workflows().Get(req.TemplateID) == nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "template_id does not match any profile or workflow",
		})
		return
	}

	jobID := uuid.New().String()
	now := time.Now().UTC()

	job := &Job{
		ID:            jobID,
		InputVideoURL: req.InputVideoURL,
		OutputURL:     fmt.Sprintf("https://storage.service/outputs/%s.mp4", jobID),
		TemplateID:    req.TemplateID,
		DynamicText:   req.DynamicText,
		Status:        StatusPending,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	h.Store.Save(job)

	task, err := tasks.NewRenderVideoTask(tasks.RenderVideoPayload{
		JobID:         jobID,
		InputVideoURL: req.InputVideoURL,
		OutputURL:     job.OutputURL,
		TemplateID:    req.TemplateID,
		DynamicText:   tasks.DynamicText{Top: req.DynamicText.Top, Bottom: req.DynamicText.Bottom},
	})
	if err != nil {
		log.Printf("failed to create task for job %s: %v", jobID, err)
	} else {
		if taskInfo, err := h.Queue.Enqueue(task); err != nil {
			log.Printf("failed to enqueue task for job %s: %v", jobID, err)
		} else {
			job.TaskID = taskInfo.ID
		}
	}

	writeJSON(w, http.StatusCreated, job)
}

// getJob — GET /jobs/{id}
func (h *Handler) getJob(w http.ResponseWriter, id string) {
	job := h.Store.Get(id)
	if job == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "job not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, job)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
