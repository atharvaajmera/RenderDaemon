// workflow_handler.go — HTTP handlers for workflow CRUD operations.
package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"render-queue/internal/config"
)

type CreateWorkflowRequest struct {
	Name        string             `json:"name"`
	Description string             `json:"description"`
	StepGroups  []config.StepGroup `json:"step_groups"`
}

// handleWorkflows — GET /workflows, POST /workflows
func (h *Handler) handleWorkflows(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listWorkflows(w)
	case http.MethodPost:
		h.createWorkflow(w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
	}
}

// handleWorkflowByID — GET /workflows/{id}, DELETE /workflows/{id}
func (h *Handler) handleWorkflowByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/workflows/")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "missing workflow id",
		})
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getWorkflow(w, id)
	case http.MethodDelete:
		h.deleteWorkflow(w, id)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
	}
}

func (h *Handler) listWorkflows(w http.ResponseWriter) {
	writeJSON(w, http.StatusOK, h.Config.Workflows().List())
}

func (h *Handler) getWorkflow(w http.ResponseWriter, id string) {
	wf := h.Config.Workflows().Get(id)
	if wf == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "workflow not found",
		})
		return
	}
	writeJSON(w, http.StatusOK, wf)
}

func (h *Handler) createWorkflow(w http.ResponseWriter, r *http.Request) {
	var req CreateWorkflowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON body: " + err.Error(),
		})
		return
	}

	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "name is required",
		})
		return
	}

	now := time.Now().UTC()
	wf := &config.Workflow{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		StepGroups:  req.StepGroups,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := config.ValidateWorkflow(wf, h.Config.Profiles()); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
		return
	}

	h.Config.Workflows().Save(wf)
	writeJSON(w, http.StatusCreated, wf)
}

func (h *Handler) deleteWorkflow(w http.ResponseWriter, id string) {
	if !h.Config.Workflows().Delete(id) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "workflow not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "workflow deleted",
	})
}
