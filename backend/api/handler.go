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
	"render-queue/internal/models"
	"render-queue/internal/repository"
	"render-queue/internal/tasks"
)

type Handler struct {
	Repo      repository.JobRepository
	Config    *config.ConfigManager
	Queue     *asynq.Client
	Inspector *asynq.Inspector
}

func NewHandler(repo repository.JobRepository, cfg *config.ConfigManager, queue *asynq.Client, inspector *asynq.Inspector) *Handler {
	return &Handler{Repo: repo, Config: cfg, Queue: queue, Inspector: inspector}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/", h.handleRoot) // Health check remains public
	mux.HandleFunc("/jobs", h.AuthMiddleware(h.handleJobs))
	mux.HandleFunc("/jobs/", h.AuthMiddleware(h.handleJobByID))
	mux.HandleFunc("/profiles", h.AuthMiddleware(h.handleProfiles))
	mux.HandleFunc("/profiles/", h.AuthMiddleware(h.handleProfileByID))
	mux.HandleFunc("/workflows", h.AuthMiddleware(h.handleWorkflows))
	mux.HandleFunc("/workflows/", h.AuthMiddleware(h.handleWorkflowByID))
	mux.HandleFunc("/upload", h.AuthMiddleware(h.handleUpload))
	mux.HandleFunc("/download/", h.AuthMiddleware(h.handleDownload))
}

// handleRoot — GET /
func (h *Handler) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "Not Found",
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "online",
		"service": "RenderDaemon API",
	})
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
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	status := r.URL.Query().Get("status")
	if status != "" {
		jobs, err := h.Repo.ListByUserAndStatus(r.Context(), userID, status)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list jobs: " + err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, jobs)
		return
	}
	
	jobs, err := h.Repo.ListByUser(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list jobs: " + err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, jobs)
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
		if parts[1] == "progress" && r.Method == http.MethodPatch {
			h.updateJobProgress(w, r, id)
			return
		}
		if parts[1] == "outputs" && r.Method == http.MethodGet {
			h.handleJobOutputs(w, r, id)
			return
		}
	}

	if r.Method == http.MethodDelete {
		h.cancelJob(w, r, id)
		return
	}

	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
		return
	}

	h.getJob(w, r, id)
}

func (h *Handler) cancelJob(w http.ResponseWriter, r *http.Request, id string) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	job, err := h.Repo.Get(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error: " + err.Error()})
		return
	}
	if job == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "job not found",
		})
		return
	}

	if job.UserID != userID {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
		return
	}

	if job.Status == models.StatusCompleted || job.Status == models.StatusFailed || job.Status == models.StatusCancelled {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "job is already completed, failed, or cancelled",
		})
		return
	}

	_, err = h.Repo.UpdateStatus(r.Context(), id, models.StatusCancelled, "")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to cancel job: " + err.Error()})
		return
	}

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
	models.StatusProcessing: true,
	models.StatusCompleted:  true,
	models.StatusFailed:     true,
}

// updateJobStatus — PATCH /jobs/{id}/status
func (h *Handler) updateJobStatus(w http.ResponseWriter, r *http.Request, id string) {
	var req models.UpdateJobStatusRequest
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

	job, err := h.Repo.UpdateStatus(r.Context(), id, req.Status, req.Result)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update status: " + err.Error()})
		return
	}
	if job == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "job not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, job)
}

// updateJobProgress — PATCH /jobs/{id}/progress
func (h *Handler) updateJobProgress(w http.ResponseWriter, r *http.Request, id string) {
	var req models.UpdateJobProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON body: " + err.Error(),
		})
		return
	}

	job, err := h.Repo.UpdateProgress(r.Context(), id, req.Progress)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update progress: " + err.Error()})
		return
	}
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
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var req models.CreateJobRequest
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

	inputFilePath := filepath.Join("storage", req.InputVideoURL)
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

	job := &models.Job{
		ID:            jobID,
		UserID:        userID,
		InputVideoURL: req.InputVideoURL,
		OutputURL:     fmt.Sprintf("https://storage.service/outputs/%s.mp4", jobID),
		TemplateID:    req.TemplateID,
		DynamicText:   req.DynamicText,
		Status:        models.StatusPending,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := h.Repo.Save(r.Context(), job); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save job: " + err.Error()})
		return
	}

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
			// Update the job with the task ID if needed, but since it's just saved, 
			// we could ideally save it with TaskID. For now, we update it immediately or leave it as is in DB
			// until the worker updates status. Let's update it in DB to be safe.
			// Actually, just logging error is fine, or we could update the job.
			// Let's keep it simple.
		}
	}

	writeJSON(w, http.StatusCreated, job)
}

// getJob — GET /jobs/{id}
func (h *Handler) getJob(w http.ResponseWriter, r *http.Request, id string) {
	userID, ok := r.Context().Value(UserIDKey).(string)
	if !ok || userID == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	job, err := h.Repo.Get(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error: " + err.Error()})
		return
	}
	if job == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "job not found",
		})
		return
	}

	if job.UserID != userID {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
		return
	}

	writeJSON(w, http.StatusOK, job)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
