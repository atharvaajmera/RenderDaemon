// profile_handler.go — HTTP handlers for profile CRUD operations.
package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"render-queue/internal/config"
)

type CreateProfileRequest struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Operation   string            `json:"operation"`
	Extends     string            `json:"extends,omitempty"`
	Parameters  map[string]string `json:"parameters"`
}

// handleProfiles — GET /profiles, POST /profiles
func (h *Handler) handleProfiles(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listProfiles(w)
	case http.MethodPost:
		h.createProfile(w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
	}
}

// handleProfileByID — GET /profiles/{id}, DELETE /profiles/{id}
func (h *Handler) handleProfileByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/profiles/")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "missing profile id",
		})
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getProfile(w, id)
	case http.MethodDelete:
		h.deleteProfile(w, id)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method not allowed",
		})
	}
}

func (h *Handler) listProfiles(w http.ResponseWriter) {
	writeJSON(w, http.StatusOK, h.Config.Profiles().List())
}

func (h *Handler) getProfile(w http.ResponseWriter, id string) {
	profile := h.Config.Profiles().ResolveProfile(id)
	if profile == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "profile not found",
		})
		return
	}
	writeJSON(w, http.StatusOK, profile)
}

func (h *Handler) createProfile(w http.ResponseWriter, r *http.Request) {
	var req CreateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON body: " + err.Error(),
		})
		return
	}

	if req.Name == "" || req.Operation == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "name and operation are required",
		})
		return
	}

	if !config.ValidOperations[req.Operation] {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid operation, must be one of: transcode, compress, extract_audio, thumbnail, preview_gif, scale, watermark",
		})
		return
	}

	if req.Extends != "" && h.Config.Profiles().Get(req.Extends) == nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "parent profile not found: " + req.Extends,
		})
		return
	}

	now := time.Now().UTC()
	profile := &config.Profile{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Operation:   req.Operation,
		Extends:     req.Extends,
		Parameters:  req.Parameters,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	h.Config.Profiles().Save(profile)
	writeJSON(w, http.StatusCreated, profile)
}

func (h *Handler) deleteProfile(w http.ResponseWriter, id string) {
	if childID, ok := h.Config.Profiles().IsExtendedBy(id); ok {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "profile is extended by: " + childID,
		})
		return
	}

	if wfID, ok := h.Config.Workflows().ReferencesProfile(id); ok {
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "profile is referenced by workflow: " + wfID,
		})
		return
	}

	if !h.Config.Profiles().Delete(id) {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "profile not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "profile deleted",
	})
}
