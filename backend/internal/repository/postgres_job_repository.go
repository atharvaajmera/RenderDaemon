package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"render-queue/internal/models"
)

// PostgresJobRepository implements JobRepository using Neon Postgres.
type PostgresJobRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresJobRepository creates a new Postgres-backed job repository.
func NewPostgresJobRepository(pool *pgxpool.Pool) *PostgresJobRepository {
	return &PostgresJobRepository{pool: pool}
}

// Save inserts a new job into the database.
func (r *PostgresJobRepository) Save(ctx context.Context, job *models.Job) error {
	dtJSON, err := json.Marshal(job.DynamicText)
	if err != nil {
		return fmt.Errorf("failed to marshal dynamic_text: %w", err)
	}

	_, err = r.pool.Exec(ctx, `
		INSERT INTO jobs (id, task_id, input_url, output_url, template_id, dynamic_text, status, progress, error, result, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`,
		job.ID, job.TaskID, job.InputVideoURL, job.OutputURL, job.TemplateID,
		dtJSON, job.Status, job.Progress, job.Error, job.Result,
		job.CreatedAt, job.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert job: %w", err)
	}
	return nil
}

// Get retrieves a single job by ID.
func (r *PostgresJobRepository) Get(ctx context.Context, id string) (*models.Job, error) {
	job := &models.Job{}
	var dtJSON []byte

	err := r.pool.QueryRow(ctx, `
		SELECT id, task_id, input_url, output_url, template_id, dynamic_text,
		       status, progress, error, result, created_at, updated_at
		FROM jobs WHERE id = $1
	`, id).Scan(
		&job.ID, &job.TaskID, &job.InputVideoURL, &job.OutputURL, &job.TemplateID,
		&dtJSON, &job.Status, &job.Progress, &job.Error, &job.Result,
		&job.CreatedAt, &job.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get job %s: %w", id, err)
	}

	if err := json.Unmarshal(dtJSON, &job.DynamicText); err != nil {
		return nil, fmt.Errorf("failed to unmarshal dynamic_text: %w", err)
	}

	return job, nil
}

// List returns all jobs ordered by creation time (newest first).
func (r *PostgresJobRepository) List(ctx context.Context) ([]*models.Job, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, task_id, input_url, output_url, template_id, dynamic_text,
		       status, progress, error, result, created_at, updated_at
		FROM jobs ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list jobs: %w", err)
	}
	defer rows.Close()

	return scanJobs(rows)
}

// ListByStatus returns all jobs with a given status, newest first.
func (r *PostgresJobRepository) ListByStatus(ctx context.Context, status string) ([]*models.Job, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, task_id, input_url, output_url, template_id, dynamic_text,
		       status, progress, error, result, created_at, updated_at
		FROM jobs WHERE status = $1 ORDER BY created_at DESC
	`, status)
	if err != nil {
		return nil, fmt.Errorf("failed to list jobs by status %s: %w", status, err)
	}
	defer rows.Close()

	return scanJobs(rows)
}

// UpdateStatus sets the status and optional result for a job. Returns the updated job.
func (r *PostgresJobRepository) UpdateStatus(ctx context.Context, id, status, result string) (*models.Job, error) {
	job := &models.Job{}
	var dtJSON []byte

	err := r.pool.QueryRow(ctx, `
		UPDATE jobs
		SET status = $1, result = CASE WHEN $2 = '' THEN result ELSE $2 END, updated_at = NOW()
		WHERE id = $3
		RETURNING id, task_id, input_url, output_url, template_id, dynamic_text,
		          status, progress, error, result, created_at, updated_at
	`, status, result, id).Scan(
		&job.ID, &job.TaskID, &job.InputVideoURL, &job.OutputURL, &job.TemplateID,
		&dtJSON, &job.Status, &job.Progress, &job.Error, &job.Result,
		&job.CreatedAt, &job.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update job status %s: %w", id, err)
	}

	if err := json.Unmarshal(dtJSON, &job.DynamicText); err != nil {
		return nil, fmt.Errorf("failed to unmarshal dynamic_text: %w", err)
	}

	return job, nil
}

// UpdateProgress sets the progress percentage for a job. Returns the updated job.
func (r *PostgresJobRepository) UpdateProgress(ctx context.Context, id string, progress float64) (*models.Job, error) {
	job := &models.Job{}
	var dtJSON []byte

	err := r.pool.QueryRow(ctx, `
		UPDATE jobs
		SET progress = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, task_id, input_url, output_url, template_id, dynamic_text,
		          status, progress, error, result, created_at, updated_at
	`, progress, id).Scan(
		&job.ID, &job.TaskID, &job.InputVideoURL, &job.OutputURL, &job.TemplateID,
		&dtJSON, &job.Status, &job.Progress, &job.Error, &job.Result,
		&job.CreatedAt, &job.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update job progress %s: %w", id, err)
	}

	if err := json.Unmarshal(dtJSON, &job.DynamicText); err != nil {
		return nil, fmt.Errorf("failed to unmarshal dynamic_text: %w", err)
	}

	return job, nil
}

// scanJobs is a helper that scans multiple job rows into a slice.
func scanJobs(rows pgx.Rows) ([]*models.Job, error) {
	var jobs []*models.Job
	for rows.Next() {
		job := &models.Job{}
		var dtJSON []byte

		if err := rows.Scan(
			&job.ID, &job.TaskID, &job.InputVideoURL, &job.OutputURL, &job.TemplateID,
			&dtJSON, &job.Status, &job.Progress, &job.Error, &job.Result,
			&job.CreatedAt, &job.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan job row: %w", err)
		}

		if err := json.Unmarshal(dtJSON, &job.DynamicText); err != nil {
			return nil, fmt.Errorf("failed to unmarshal dynamic_text: %w", err)
		}

		jobs = append(jobs, job)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating job rows: %w", err)
	}

	// Return empty slice instead of nil for consistent JSON encoding
	if jobs == nil {
		jobs = []*models.Job{}
	}

	return jobs, nil
}
