// Package models contains shared domain types used across api, repository, and worker packages.
package models

import "time"

// Job status constants.
const (
	StatusPending    = "pending"
	StatusProcessing = "processing"
	StatusCompleted  = "completed"
	StatusFailed     = "failed"
	StatusCancelled  = "cancelled"
)

// DynamicText holds text overlays for video renders.
type DynamicText struct {
	Top    string `json:"top"`
	Bottom string `json:"bottom"`
}

// Job represents a render job in the system.
type Job struct {
	ID            string      `json:"id"`
	TaskID        string      `json:"task_id,omitempty"`
	InputVideoURL string      `json:"input_video_url"`
	OutputURL     string      `json:"output_url"`
	TemplateID    string      `json:"template_id"`
	DynamicText   DynamicText `json:"dynamic_text"`
	Status        string      `json:"status"`
	Progress      float64     `json:"progress"`
	Error         string      `json:"error,omitempty"`
	Result        string      `json:"result,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
}

// CreateJobRequest is the payload for POST /jobs.
type CreateJobRequest struct {
	InputVideoURL string      `json:"input_video_url"`
	TemplateID    string      `json:"template_id"`
	DynamicText   DynamicText `json:"dynamic_text"`
}

// UpdateJobStatusRequest is the payload for PATCH /jobs/{id}/status.
type UpdateJobStatusRequest struct {
	Status string `json:"status"`
	Result string `json:"result,omitempty"`
}

// UpdateJobProgressRequest is the payload for PATCH /jobs/{id}/progress.
type UpdateJobProgressRequest struct {
	Progress float64 `json:"progress"`
}
