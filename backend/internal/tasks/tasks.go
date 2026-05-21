package tasks

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeRenderVideo = "video:render"
)

// DynamicText holds the text overlays for the video render.
type DynamicText struct {
	Top    string `json:"top"`
	Bottom string `json:"bottom"`
}

// RenderVideoPayload is the contract between the API and the worker.
type RenderVideoPayload struct {
	JobID         string      `json:"job_id"`
	InputVideoURL string      `json:"input_video_url"`
	OutputURL     string      `json:"output_url"`
	TemplateID    string      `json:"template_id"`
	DynamicText   DynamicText `json:"dynamic_text"`
}

func NewRenderVideoTask(payload RenderVideoPayload) (*asynq.Task, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode render task payload: %v", err)
	}

	return asynq.NewTask(TypeRenderVideo, payloadBytes), nil
}