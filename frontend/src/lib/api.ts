const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090';

/**
 * Generic API fetch wrapper to handle base URLs and standard error checking
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {};
  
  // If it's a FormData object, let the browser set the Content-Type with the boundary
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
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
// Step 1.2: Job Services
// ---------------------------------------------------------------------------

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface JobProgress {
  id: string;
  status: JobStatus;
  progress: number;
  message?: string;
  createdAt: string;
}

export interface JobRequest {
  id?: string;
  template: string;
  inputs: Record<string, any>;
}

export interface JobResponse {
  jobId: string;
  message?: string;
}

export async function submitJob(req: JobRequest): Promise<JobResponse> {
  return apiFetch<JobResponse>('/jobs', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export async function getJob(id: string): Promise<JobProgress> {
  return apiFetch<JobProgress>(`/jobs/${id}`);
}

export async function getAllJobs(): Promise<Record<string, JobProgress>> {
  return apiFetch<Record<string, JobProgress>>('/jobs');
}

export async function cancelJob(id: string): Promise<void> {
  return apiFetch<void>(`/jobs/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Step 1.3: Configuration & Upload Services
// ---------------------------------------------------------------------------

export interface UploadResponse {
  tempFilePath: string;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<UploadResponse>('/upload', {
    method: 'POST',
    body: formData,
  });
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  operation: string;
  parameters: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  profile_id: string;
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

export async function getProfiles(): Promise<Profile[]> {
  return apiFetch<Profile[]>('/profiles');
}

export async function getWorkflows(): Promise<Workflow[]> {
  return apiFetch<Workflow[]>('/workflows');
}

