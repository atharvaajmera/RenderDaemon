package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Handler holds dependencies for the HTTP handlers.
type Handler struct {
	Store *JobStore
}

// NewHandler creates a Handler with the given store.
func NewHandler(store *JobStore) *Handler {
	return &Handler{Store: store}
}

// RegisterRoutes wires up the API endpoints on the provided mux.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/jobs", h.handleJobs)
	mux.HandleFunc("/jobs/", h.handleJobByID)
}

// handleJobs dispatches POST /jobs.
func (h *Handler) handleJobs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed, use POST",
		})
		return
	}

	h.createJob(w, r)
}

// handleJobByID dispatches GET /jobs/{id}.
func (h *Handler) handleJobByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed, use GET",
		})
		return
	}

	// Extract the job ID from the URL path: /jobs/{id}
	id := strings.TrimPrefix(r.URL.Path, "/jobs/")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "missing job id",
		})
		return
	}

	h.getJob(w, id)
}

// createJob handles POST /jobs — accepts a rendering job request.
func (h *Handler) createJob(w http.ResponseWriter, r *http.Request) {
	var req CreateJobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON body: " + err.Error(),
		})
		return
	}

	if req.VideoID == "" || req.Template == "" || req.DynamicText == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "video_id, template, and dynamic_text are required",
		})
		return
	}

	now := time.Now().UTC()
	job := &Job{
		ID:          uuid.New().String(),
		VideoID:     req.VideoID,
		Template:    req.Template,
		DynamicText: req.DynamicText,
		Status:      StatusPending,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	h.Store.Save(job)

	writeJSON(w, http.StatusCreated, job)
}

// getJob handles GET /jobs/{id} — returns job status and results.
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

// writeJSON is a small helper that writes a JSON response.
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
