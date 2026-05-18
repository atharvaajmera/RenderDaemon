package workflow

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"render-queue/internal/config"
	"render-queue/internal/processor"
)

type Executor struct {
	profiles *config.ProfileStore
}

func NewExecutor(profiles *config.ProfileStore) *Executor {
	return &Executor{
		profiles: profiles,
	}
}

func (e *Executor) Execute(ctx context.Context, wf *config.Workflow, initialReq processor.ProcessRequest) (*processor.ProcessResult, error) {
	currentInput := initialReq.InputPath
	var lastResult *processor.ProcessResult

	totalSteps := 0
	for _, group := range wf.StepGroups {
		totalSteps += len(group.Steps)
	}

	if totalSteps == 0 {
		return nil, fmt.Errorf("workflow %s contains no steps", wf.ID)
	}

	stepsCompleted := 0

	for groupIndex, group := range wf.StepGroups {
		// Step 3 will handle Parallel execution and Conditions
		for stepIndex, step := range group.Steps {
			profile := e.profiles.Get(step.ProfileID)
			if profile == nil {
				return nil, fmt.Errorf("profile %s not found for step %d in group %d", step.ProfileID, stepIndex, groupIndex)
			}

			// Create a subdirectory for intermediate outputs
			stepOutputDir := filepath.Join(initialReq.OutputDir, fmt.Sprintf("group_%d_step_%d", groupIndex, stepIndex))
			if err := os.MkdirAll(stepOutputDir, 0755); err != nil {
				return nil, fmt.Errorf("failed to create step output directory: %v", err)
			}

			// Scale progress for the current step
			baseProgress := (float64(stepsCompleted) / float64(totalSteps)) * 100.0
			stepProgressWeight := 100.0 / float64(totalSteps)

			stepReq := processor.ProcessRequest{
				InputPath:   currentInput,
				OutputDir:   stepOutputDir,
				Profile:     profile,
				DynamicText: initialReq.DynamicText,
				FontPath:    initialReq.FontPath,
				OnProgress: func(p float64) {
					if initialReq.OnProgress != nil {
						scaledProgress := baseProgress + (p * (stepProgressWeight / 100.0))
						initialReq.OnProgress(scaledProgress)
					}
				},
			}

			res, err := processor.Process(ctx, stepReq)
			if err != nil {
				return nil, fmt.Errorf("step %d in group %d failed: %v", stepIndex, groupIndex, err)
			}

			lastResult = res
			currentInput = res.OutputPath
			stepsCompleted++
		}
	}

	// Move final output to the main output directory
	finalName := filepath.Base(lastResult.OutputPath)
	finalDest := filepath.Join(initialReq.OutputDir, finalName)

	if err := os.Rename(lastResult.OutputPath, finalDest); err != nil {
		return lastResult, nil
	}

	lastResult.OutputPath = finalDest
	return lastResult, nil
}
