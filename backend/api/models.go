// models.go — In-memory JobStore (to be replaced by Postgres repository in Step 1.5).
package api

import (
	"sync"
	"time"

	"render-queue/internal/models"
)

// JobStore is the legacy in-memory store. Will be removed in Step 1.5.
type JobStore struct {
	mu   sync.RWMutex
	jobs map[string]*models.Job
}

func NewJobStore() *JobStore {
	return &JobStore{
		jobs: make(map[string]*models.Job),
	}
}

func (s *JobStore) Save(job *models.Job) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
}

func (s *JobStore) Get(id string) *models.Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.jobs[id]
}

func (s *JobStore) UpdateStatus(id, status, result string) *models.Job {
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

func (s *JobStore) UpdateProgress(id string, progress float64) *models.Job {
	s.mu.Lock()
	defer s.mu.Unlock()
	job, ok := s.jobs[id]
	if !ok {
		return nil
	}
	job.Progress = progress
	job.UpdatedAt = time.Now().UTC()
	return job
}

func (s *JobStore) List() []*models.Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	jobs := make([]*models.Job, 0, len(s.jobs))
	for _, job := range s.jobs {
		jobs = append(jobs, job)
	}
	return jobs
}

func (s *JobStore) ListByStatus(status string) []*models.Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	jobs := make([]*models.Job, 0)
	for _, job := range s.jobs {
		if job.Status == status {
			jobs = append(jobs, job)
		}
	}
	return jobs
}
