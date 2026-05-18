package workflow

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"sync"

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

func (e *Executor) Execute(ctx context.Context, wf *config.Workflow, initialReq processor.ProcessRequest, onStep func(string)) (*processor.ProcessResult, error) {
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
		if group.Parallel {
			var wg sync.WaitGroup
			var mu sync.Mutex
			errCh := make(chan error, len(group.Steps))
			
			// For parallel groups, we use the same currentInput for all steps.
			// The output of the parallel group won't cleanly chain to a single next input,
			// so we maintain the currentInput for the next group (e.g., parallel thumbnails/previews).
			
			for stepIndex, step := range group.Steps {
				wg.Add(1)
				
				baseProgress := (float64(stepsCompleted) / float64(totalSteps)) * 100.0
				stepProgressWeight := 100.0 / float64(totalSteps)
				stepsCompleted++
				
				go func(sIndex int, stp config.WorkflowStep, bp, weight float64) {
					defer wg.Done()
					res, err := e.executeStep(ctx, stp, currentInput, initialReq, groupIndex, sIndex, bp, weight, onStep, stepsCompleted, totalSteps)
					if err != nil {
						errCh <- err
						return
					}
					if res != nil {
						mu.Lock()
						lastResult = res
						mu.Unlock()
					}
				}(stepIndex, step, baseProgress, stepProgressWeight)
			}
			
			wg.Wait()
			close(errCh)
			
			// Check for any errors in the parallel execution
			for err := range errCh {
				if err != nil {
					return nil, err
				}
			}
			
		} else {
			// Sequential execution
			for stepIndex, step := range group.Steps {
				baseProgress := (float64(stepsCompleted) / float64(totalSteps)) * 100.0
				stepProgressWeight := 100.0 / float64(totalSteps)
				
				res, err := e.executeStep(ctx, step, currentInput, initialReq, groupIndex, stepIndex, baseProgress, stepProgressWeight, onStep, stepsCompleted, totalSteps)
				if err != nil {
					return nil, err
				}
				if res != nil {
					lastResult = res
					currentInput = res.OutputPath
				}
				stepsCompleted++
			}
		}
	}
// Move final output to the main output directory
	if lastResult != nil {
		finalName := filepath.Base(lastResult.OutputPath)
		finalDest := filepath.Join(initialReq.OutputDir, finalName)

		if err := os.Rename(lastResult.OutputPath, finalDest); err == nil {
			lastResult.OutputPath = finalDest
		}
	}

	return lastResult, nil
}

func (e *Executor) executeStep(ctx context.Context, step config.WorkflowStep, currentInput string, initialReq processor.ProcessRequest, groupIndex, stepIndex int, baseProgress, stepProgressWeight float64, onStep func(string), stepsCompleted, totalSteps int) (*processor.ProcessResult, error) {
	// Evaluate condition
	if step.Condition != nil {
		info, err := processor.GetVideoInfo(ctx, currentInput)
		if err != nil {
			return nil, fmt.Errorf("failed to get video info for condition evaluation: %v", err)
		}
		
		shouldRun, err := evaluateCondition(step.Condition, info)
		if err != nil {
			return nil, fmt.Errorf("condition evaluation failed: %v", err)
		}
		if !shouldRun {
			// Skip step
			return nil, nil
		}
	}

	profile := e.profiles.Get(step.ProfileID)
	if profile == nil {
		return nil, fmt.Errorf("profile %s not found for step %d in group %d", step.ProfileID, stepIndex, groupIndex)
	}

	stepOutputDir := filepath.Join(initialReq.OutputDir, fmt.Sprintf("group_%d_step_%d", groupIndex, stepIndex))
	if err := os.MkdirAll(stepOutputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create step output directory: %v", err)
	}

	if onStep != nil {
		onStep(fmt.Sprintf("Executing step %d/%d (%s)", stepsCompleted+1, totalSteps, profile.Operation))
	}

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
	
	return res, nil
}

func evaluateCondition(cond *config.StepCondition, info *processor.VideoInfo) (bool, error) {
	valFloat, err := strconv.ParseFloat(cond.Value, 64)
	if err != nil {
		return false, fmt.Errorf("invalid condition value: %s", cond.Value)
	}

	var fieldFloat float64
	switch cond.Field {
	case "width":
		fieldFloat = float64(info.Width)
	case "height":
		fieldFloat = float64(info.Height)
	case "fps":
		fieldFloat = info.FPS
	case "duration":
		fieldFloat = info.Duration
	default:
		return true, nil // Ignore unknown fields
	}

	switch cond.Operator {
	case ">":
		return fieldFloat > valFloat, nil
	case ">=":
		return fieldFloat >= valFloat, nil
	case "<":
		return fieldFloat < valFloat, nil
	case "<=":
		return fieldFloat <= valFloat, nil
	case "==":
		return fieldFloat == valFloat, nil
	case "!=":
		return fieldFloat != valFloat, nil
	default:
		return true, nil
	}
}


