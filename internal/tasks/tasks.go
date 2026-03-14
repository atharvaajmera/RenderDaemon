package tasks

import (
	"encoding/json"
	"fmt"
	"github.com/hibiken/asynq"
)

const (
	TypeRenderVideo = "video:render"
)

type RenderVideoPayload struct {
	VideoID    string `json:"video_id"`
	Template   string `json:"template"`
	DynamicText string `json:"dynamic_text"`
}

func NewRenderVideoTask(videoID, template, text string) (*asynq.Task, error) {
	payload := RenderVideoPayload{
		VideoID:     videoID,
		Template:    template,
		DynamicText: text,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode render task payload: %v", err)
	}

	return asynq.NewTask(TypeRenderVideo, payloadBytes), nil
}