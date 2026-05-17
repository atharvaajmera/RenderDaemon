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
	StatusCancelled  = "cancelled"
)

type DynamicText struct {
	Top    string `json:"top"`
	Bottom string `json:"bottom"`
}

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

type CreateJobRequest struct {
	InputVideoURL string      `json:"input_video_url"`
	TemplateID    string      `json:"template_id"`
	DynamicText   DynamicText `json:"dynamic_text"`
}

type UpdateJobStatusRequest struct {
	Status string `json:"status"`
	Result string `json:"result,omitempty"`
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

func (s *JobStore) UpdateStatus(id, status, result string) *Job {
	s.mu.Lock()
	defer s.mu.Unlock()
	job, ok := s.jobs[id]
	if !ok {
		return nil
	}
	job.Status = status
	if result != "" {
		job.Result = result
	}
	job.UpdatedAt = time.Now().UTC()
	return job
}

func (s *JobStore) List() []*Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	jobs := make([]*Job, 0, len(s.jobs))
	for _, job := range s.jobs {
		jobs = append(jobs, job)
	}
	return jobs
}

func (s *JobStore) ListByStatus(status string) []*Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	jobs := make([]*Job, 0)
	for _, job := range s.jobs {
		if job.Status == status {
			jobs = append(jobs, job)
		}
	}
	return jobs
}
