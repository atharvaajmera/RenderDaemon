package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// jobsTableSQL creates the jobs table and indexes if they don't exist.
const jobsTableSQL = `
CREATE TABLE IF NOT EXISTS jobs (
    id            TEXT PRIMARY KEY,
    task_id       TEXT,
    input_url     TEXT NOT NULL,
    output_url    TEXT,
    template_id   TEXT NOT NULL,
    dynamic_text  JSONB DEFAULT '{}',
    status        TEXT NOT NULL DEFAULT 'pending',
    progress      REAL DEFAULT 0,
    error         TEXT,
    result        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
`

// RunMigrations executes all schema migrations against the database.
// Uses IF NOT EXISTS so it is safe to run on every startup.
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	log.Println("Running database migrations...")

	if _, err := pool.Exec(ctx, jobsTableSQL); err != nil {
		return fmt.Errorf("migration failed (jobs table): %w", err)
	}

	log.Println("✅ Migrations complete")
	return nil
}
