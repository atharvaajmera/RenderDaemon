// handler.go — HTTP handlers and route registration for the Render Queue API.
package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Handler struct {
	Store *JobStore
}

func NewHandler(store *JobStore) *Handler {
	return &Handler{Store: store}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/jobs", h.handleJobs)
	mux.HandleFunc("/jobs/", h.handleJobByID)
}

// handleJobs — POST /jobs
func (h *Handler) handleJobs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed, use POST",
		})
		return
	}

	h.createJob(w, r)
}

// handleJobByID — GET /jobs/{id}
func (h *Handler) handleJobByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed, use GET",
		})
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/jobs/")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "missing job id",
		})
		return
	}

	h.getJob(w, id)
}

// createJob — POST /jobs: accepts a rendering job request.
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

	if req.DynamicText.Top == "" && req.DynamicText.Bottom == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "dynamic_text must include at least one of top or bottom",
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

	writeJSON(w, http.StatusCreated, job)
}

// getJob — GET /jobs/{id}: returns job status and details.
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
