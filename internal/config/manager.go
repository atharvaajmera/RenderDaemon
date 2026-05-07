// manager.go — ConfigManager that owns profile and workflow stores and loads defaults on init.
package config

type ConfigManager struct {
	profiles  *ProfileStore
	workflows *WorkflowStore
}

func NewConfigManager() *ConfigManager {
	ps := NewProfileStore()
	ws := NewWorkflowStore()

	LoadDefaultProfiles(ps)
	LoadDefaultWorkflows(ws)

	return &ConfigManager{
		profiles:  ps,
		workflows: ws,
	}
}

func (m *ConfigManager) Profiles() *ProfileStore {
	return m.profiles
}

func (m *ConfigManager) Workflows() *WorkflowStore {
	return m.workflows
}
