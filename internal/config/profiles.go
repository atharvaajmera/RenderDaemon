// profiles.go — Profile definitions, in-memory store, inheritance resolution, and default presets.
package config

import (
	"sync"
	"time"
)

type Profile struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Operation   string            `json:"operation"`
	Extends     string            `json:"extends,omitempty"`
	Parameters  map[string]string `json:"parameters"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

var ValidOperations = map[string]bool{
	"transcode":     true,
	"compress":      true,
	"extract_audio": true,
	"thumbnail":     true,
	"preview_gif":   true,
	"scale":         true,
	"watermark":     true,
}

type ProfileStore struct {
	mu       sync.RWMutex
	profiles map[string]*Profile
}

func NewProfileStore() *ProfileStore {
	return &ProfileStore{
		profiles: make(map[string]*Profile),
	}
}

func (s *ProfileStore) Save(p *Profile) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.profiles[p.ID] = p
}

func (s *ProfileStore) Get(id string) *Profile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.profiles[id]
}

func (s *ProfileStore) List() []*Profile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]*Profile, 0, len(s.profiles))
	for _, p := range s.profiles {
		result = append(result, p)
	}
	return result
}

func (s *ProfileStore) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.profiles[id]; !ok {
		return false
	}
	delete(s.profiles, id)
	return true
}

func (s *ProfileStore) IsExtendedBy(id string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, p := range s.profiles {
		if p.Extends == id {
			return p.ID, true
		}
	}
	return "", false
}

func (s *ProfileStore) ResolveProfile(id string) *Profile {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p := s.profiles[id]
	if p == nil {
		return nil
	}

	if p.Extends == "" {
		return p
	}

	chain := []*Profile{p}
	visited := map[string]bool{id: true}
	current := p

	for current.Extends != "" {
		if visited[current.Extends] {
			break
		}
		parent := s.profiles[current.Extends]
		if parent == nil {
			break
		}
		visited[current.Extends] = true
		chain = append(chain, parent)
		current = parent
	}

	merged := make(map[string]string)
	for i := len(chain) - 1; i >= 0; i-- {
		for k, v := range chain[i].Parameters {
			merged[k] = v
		}
	}

	return &Profile{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Operation:   p.Operation,
		Extends:     p.Extends,
		Parameters:  merged,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

func LoadDefaultProfiles(store *ProfileStore) {
	now := time.Now().UTC()

	defaults := []*Profile{
		{
			ID:          "web_optimized",
			Name:        "Web Optimized",
			Description: "Transcodes to H.264 with medium preset and CRF 23 for web streaming.",
			Operation:   "transcode",
			Parameters: map[string]string{
				"codec":  "libx264",
				"preset": "medium",
				"crf":    "23",
				"format": "mp4",
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "social_media",
			Name:        "Social Media",
			Description: "Compresses to 720p targeting 50 MB for platforms like Instagram or TikTok.",
			Operation:   "compress",
			Parameters: map[string]string{
				"resolution":     "1280x720",
				"target_size_mb": "50",
				"codec":          "libx264",
				"format":         "mp4",
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "mobile_optimized",
			Name:        "Mobile Optimized",
			Description: "Scales to 480p with limited file size for efficient mobile delivery.",
			Operation:   "scale",
			Parameters: map[string]string{
				"resolution":     "854x480",
				"target_size_mb": "25",
				"codec":          "libx264",
				"preset":         "fast",
				"format":         "mp4",
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "audio_mp3",
			Name:        "Audio MP3",
			Description: "Extracts audio track as MP3 at 192k bitrate.",
			Operation:   "extract_audio",
			Parameters: map[string]string{
				"format":  "mp3",
				"bitrate": "192k",
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "audio_aac",
			Name:        "Audio AAC",
			Description: "Extracts audio track as AAC at 128k bitrate.",
			Operation:   "extract_audio",
			Parameters: map[string]string{
				"format":  "aac",
				"bitrate": "128k",
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "thumbnail",
			Name:        "Thumbnail",
			Description: "Generates a JPG thumbnail at a specified timestamp.",
			Operation:   "thumbnail",
			Parameters: map[string]string{
				"time":       "00:00:05",
				"resolution": "320x180",
				"format":     "jpg",
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "preview_gif",
			Name:        "Preview GIF",
			Description: "Creates a short animated GIF preview snippet.",
			Operation:   "preview_gif",
			Parameters: map[string]string{
				"start":    "00:00:02",
				"duration": "4",
				"fps":      "10",
				"width":    "320",
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	for _, p := range defaults {
		store.Save(p)
	}
}
