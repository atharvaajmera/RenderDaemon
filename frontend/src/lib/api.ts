function getSessionToken(): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  // Better Auth cookie names
  const parts = value.split(`; better-auth.session_token=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  
  // Try secure cookie for production
  const secureParts = value.split(`; __Secure-better-auth.session_token=`);
  if (secureParts.length === 2) return secureParts.pop()?.split(';').shift() || null;
  
  return null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090';

/**
 * Generic API fetch wrapper to handle base URLs and standard error checking
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  
  // If it's a FormData object, let the browser set the Content-Type with the boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Body might not be JSON, fallback to status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Parse based on content type
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    // If not JSON, return as text
    return response.text() as unknown as T;
  }
}

// ---------------------------------------------------------------------------
// Job Types — matches backend api/models.go exactly
// ---------------------------------------------------------------------------

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface DynamicText {
  top: string;
  bottom: string;
}

export interface Job {
  id: string;
  task_id?: string;
  input_video_url: string;
  output_url: string;
  template_id: string;
  dynamic_text: DynamicText;
  status: JobStatus;
  progress: number;
  error?: string;
  result?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobRequest {
  input_video_url: string;
  template_id: string;
  dynamic_text?: DynamicText;
}

// ---------------------------------------------------------------------------
// Job Services
// ---------------------------------------------------------------------------

export async function submitJob(req: CreateJobRequest): Promise<Job> {
  return apiFetch<Job>('/jobs', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function getJob(id: string): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}`);
}

export async function getAllJobs(): Promise<Job[]> {
  return apiFetch<Job[]>('/jobs');
}

export async function cancelJob(id: string): Promise<void> {
  return apiFetch<void>(`/jobs/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Job Outputs — GET /jobs/{id}/outputs
// ---------------------------------------------------------------------------

export interface JobOutput {
  filename: string;
  size: number;
  download_url: string;
}

export async function getJobOutputs(id: string): Promise<JobOutput[]> {
  return apiFetch<JobOutput[]>(`/jobs/${id}/outputs`);
}

// ---------------------------------------------------------------------------
// File Upload — matches backend api/file_handler.go response
// ---------------------------------------------------------------------------

export interface UploadResponse {
  file_id: string;
  filename: string;
  size: number;
  path: string;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<UploadResponse>('/upload', {
    method: 'POST',
    body: formData,
  });
}

// ---------------------------------------------------------------------------
// Profiles — matches backend internal/config/profiles.go
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  name: string;
  description: string;
  operation: string;
  extends?: string;
  parameters: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export async function getProfiles(): Promise<Profile[]> {
  return apiFetch<Profile[]>('/profiles');
}

export async function getProfile(id: string): Promise<Profile> {
  return apiFetch<Profile>(`/profiles/${id}`);
}

export async function createProfile(profile: {
  name: string;
  description: string;
  operation: string;
  extends?: string;
  parameters: Record<string, string>;
}): Promise<Profile> {
  return apiFetch<Profile>('/profiles', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export async function deleteProfile(id: string): Promise<void> {
  return apiFetch<void>(`/profiles/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Workflows — matches backend internal/config/workflows.go
// ---------------------------------------------------------------------------

export interface StepCondition {
  field: string;
  operator: string;
  value: string;
}

export interface WorkflowStep {
  profile_id: string;
  condition?: StepCondition;
}

export interface WorkflowStepGroup {
  parallel: boolean;
  steps: WorkflowStep[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  step_groups: WorkflowStepGroup[];
  created_at: string;
  updated_at: string;
}

export async function getWorkflows(): Promise<Workflow[]> {
  return apiFetch<Workflow[]>('/workflows');
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return apiFetch<Workflow>(`/workflows/${id}`);
}

export async function createWorkflow(workflow: {
  name: string;
  description: string;
  step_groups: WorkflowStepGroup[];
}): Promise<Workflow> {
  return apiFetch<Workflow>('/workflows', {
    method: 'POST',
    body: JSON.stringify(workflow),
  });
}

export async function deleteWorkflow(id: string): Promise<void> {
  return apiFetch<void>(`/workflows/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Utility: Map profile operations to human-readable output descriptions
// ---------------------------------------------------------------------------

export const OPERATION_META: Record<string, { label: string; icon: string; outputType: string }> = {
  transcode:     { label: 'Video Export',    icon: '🎬', outputType: 'video' },
  compress:      { label: 'Compressed Video', icon: '📦', outputType: 'video' },
  scale:         { label: 'Scaled Video',    icon: '📐', outputType: 'video' },
  extract_audio: { label: 'Audio Track',     icon: '🎵', outputType: 'audio' },
  thumbnail:     { label: 'Thumbnail',       icon: '🖼️', outputType: 'image' },
  preview_gif:   { label: 'Preview GIF',     icon: '✨', outputType: 'gif' },
  watermark:     { label: 'Watermarked Video', icon: '💧', outputType: 'video' },
};
