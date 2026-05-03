// models.go — Job models, status constants, and in-memory JobStore.
package api

import (
	"sync"
	"time"
)

const (
	StatusPending    = "pending"
	StatusProcessing = "processing"
	StatusCompleted  = "completed"
	StatusFailed     = "failed"
)

type DynamicText struct {
	Top    string `json:"top"`
	Bottom string `json:"bottom"`
}

type Job struct {
	ID            string      `json:"id"`
	InputVideoURL string      `json:"input_video_url"`
	OutputURL     string      `json:"output_url"`
	TemplateID    string      `json:"template_id"`
	DynamicText   DynamicText `json:"dynamic_text"`
	Status        string      `json:"status"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
}

type CreateJobRequest struct {
	InputVideoURL string      `json:"input_video_url"`
	TemplateID    string      `json:"template_id"`
	DynamicText   DynamicText `json:"dynamic_text"`
}

type JobStore struct {
	mu   sync.RWMutex
	jobs map[string]*Job
}

func NewJobStore() *JobStore {
	return &JobStore{
		jobs: make(map[string]*Job),
	}
}

func (s *JobStore) Save(job *Job) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
}

func (s *JobStore) Get(id string) *Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.jobs[id]
}
