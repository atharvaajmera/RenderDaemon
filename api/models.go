package api

import (
	"sync"
	"time"
)

// Job status constants.
const (
	StatusPending    = "pending"
	StatusProcessing = "processing"
	StatusCompleted  = "completed"
	StatusFailed     = "failed"
)

// Job represents a video rendering job.
type Job struct {
	ID          string    `json:"id"`
	VideoID     string    `json:"video_id"`
	Template    string    `json:"template"`
	DynamicText string    `json:"dynamic_text"`
	Status      string    `json:"status"`
	Result      string    `json:"result,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateJobRequest is the expected body for POST /jobs.
type CreateJobRequest struct {
	VideoID     string `json:"video_id"`
	Template    string `json:"template"`
	DynamicText string `json:"dynamic_text"`
}

// JobStore is a concurrency-safe in-memory store for jobs.
type JobStore struct {
	mu   sync.RWMutex
	jobs map[string]*Job
}

// NewJobStore returns an initialised JobStore.
func NewJobStore() *JobStore {
	return &JobStore{
		jobs: make(map[string]*Job),
	}
}

// Save persists a job in the store.
func (s *JobStore) Save(job *Job) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
}

// Get retrieves a job by ID. Returns nil if not found.
func (s *JobStore) Get(id string) *Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.jobs[id]
}
