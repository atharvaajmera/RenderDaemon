// workflows.go — Workflow definitions, step groups, conditional logic, in-memory store, and default pipelines.
package config

import (
	"fmt"
	"sync"
	"time"
)

type StepCondition struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
}

type WorkflowStep struct {
	ProfileID string         `json:"profile_id"`
	Condition *StepCondition `json:"condition,omitempty"`
}

type StepGroup struct {
	Parallel bool           `json:"parallel"`
	Steps    []WorkflowStep `json:"steps"`
}

type Workflow struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	StepGroups  []StepGroup `json:"step_groups"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

type WorkflowStore struct {
	mu        sync.RWMutex
	workflows map[string]*Workflow
}

func NewWorkflowStore() *WorkflowStore {
	return &WorkflowStore{
		workflows: make(map[string]*Workflow),
	}
}

func (s *WorkflowStore) Save(w *Workflow) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.workflows[w.ID] = w
}

func (s *WorkflowStore) Get(id string) *Workflow {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.workflows[id]
}

func (s *WorkflowStore) List() []*Workflow {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]*Workflow, 0, len(s.workflows))
	for _, w := range s.workflows {
		result = append(result, w)
	}
	return result
}

func (s *WorkflowStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.workflows[id]; !ok {
		return false
	}
	delete(s.workflows, id)
	return true
}

func (s *WorkflowStore) ReferencesProfile(profileID string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, wf := range s.workflows {
		for _, sg := range wf.StepGroups {
			for _, step := range sg.Steps {
				if step.ProfileID == profileID {
					return wf.ID, true
				}
			}
		}
	}
	return "", false
}

func ValidateWorkflow(w *Workflow, profiles *ProfileStore) error {
	if len(w.StepGroups) == 0 {
		return fmt.Errorf("workflow must have at least one step group")
	}

	for i, sg := range w.StepGroups {
		if len(sg.Steps) == 0 {
			return fmt.Errorf("step group %d has no steps", i)
		}
		for j, step := range sg.Steps {
			if profiles.Get(step.ProfileID) == nil {
				return fmt.Errorf("step group %d, step %d references unknown profile: %s", i, j, step.ProfileID)
			}
			if step.Condition != nil {
				if err := validateCondition(step.Condition); err != nil {
					return fmt.Errorf("step group %d, step %d: %v", i, j, err)
				}
			}
		}
	}

	return nil
}

var validConditionFields = map[string]bool{
	"min_height": true,
	"min_width":  true,
	"format":     true,
	"platform":   true,
}

var validConditionOperators = map[string]bool{
	"eq":  true,
	"neq": true,
	"gte": true,
	"lte": true,
}

func validateCondition(c *StepCondition) error {
	if !validConditionFields[c.Field] {
		return fmt.Errorf("invalid condition field: %s", c.Field)
	}
	if !validConditionOperators[c.Operator] {
		return fmt.Errorf("invalid condition operator: %s", c.Operator)
	}
	if c.Value == "" {
		return fmt.Errorf("condition value cannot be empty")
	}
	return nil
}

func LoadDefaultWorkflows(store *WorkflowStore) {
	now := time.Now().UTC()

	defaults := []*Workflow{
		{
			ID:          "social_media_package",
			Name:        "Social Media Package",
			Description: "Compresses video for social platforms, then generates thumbnail and preview GIF in parallel.",
			StepGroups: []StepGroup{
				{
					Parallel: false,
					Steps: []WorkflowStep{
						{ProfileID: "social_media"},
					},
				},
				{
					Parallel: true,
					Steps: []WorkflowStep{
						{ProfileID: "thumbnail"},
						{ProfileID: "preview_gif"},
					},
				},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "archive_package",
			Name:        "Archive Package",
			Description: "High quality transcode, then extracts MP3 audio and generates thumbnail in parallel.",
			StepGroups: []StepGroup{
				{
					Parallel: false,
					Steps: []WorkflowStep{
						{ProfileID: "web_optimized"},
					},
				},
				{
					Parallel: true,
					Steps: []WorkflowStep{
						{ProfileID: "audio_mp3"},
						{ProfileID: "thumbnail"},
					},
				},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "creator_distribution",
			Name:        "Creator Distribution",
			Description: "The full creator package. Compresses for web, then generates thumbnail, audio extract, and animated preview — all in parallel.",
			StepGroups: []StepGroup{
				{
					Parallel: false,
					Steps: []WorkflowStep{
						{ProfileID: "social_media"},
					},
				},
				{
					Parallel: true,
					Steps: []WorkflowStep{
						{ProfileID: "thumbnail"},
						{ProfileID: "audio_mp3"},
						{ProfileID: "preview_gif"},
					},
				},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "quick_share",
			Name:        "Quick Share",
			Description: "Fast mobile-optimized export with a thumbnail. Perfect for WhatsApp, Telegram, or quick social sharing.",
			StepGroups: []StepGroup{
				{
					Parallel: true,
					Steps: []WorkflowStep{
						{ProfileID: "mobile_optimized"},
						{ProfileID: "thumbnail"},
					},
				},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "full_production",
			Name:        "Full Production",
			Description: "Maximum output pipeline. High-quality transcode, then generates compressed version, MP3 audio, AAC audio, thumbnail, and preview GIF — all in parallel.",
			StepGroups: []StepGroup{
				{
					Parallel: false,
					Steps: []WorkflowStep{
						{ProfileID: "web_optimized"},
					},
				},
				{
					Parallel: true,
					Steps: []WorkflowStep{
						{ProfileID: "social_media"},
						{ProfileID: "audio_mp3"},
						{ProfileID: "audio_aac"},
						{ProfileID: "thumbnail"},
						{ProfileID: "preview_gif"},
					},
				},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	for _, w := range defaults {
		store.Save(w)
	}
}
