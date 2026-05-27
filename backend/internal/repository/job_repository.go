// Package repository defines the persistence interface for RenderDaemon.
package repository

import (
	"context"

	"render-queue/internal/models"
)

// JobRepository defines the contract for job persistence.
type JobRepository interface {
	Save(ctx context.Context, job *models.Job) error
	Get(ctx context.Context, id string) (*models.Job, error)
	List(ctx context.Context) ([]*models.Job, error)
	ListByStatus(ctx context.Context, status string) ([]*models.Job, error)
	UpdateStatus(ctx context.Context, id, status, result string) (*models.Job, error)
	UpdateProgress(ctx context.Context, id string, progress float64) (*models.Job, error)
}
