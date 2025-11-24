import axios, { AxiosInstance, AxiosRequestHeaders, AxiosRequestConfig, AxiosResponse, AxiosProgressEvent } from 'axios';
// TODO: actual backend API URL after deploy
const API_BASE_URL = 'http://localhost:3000';

type AuthAxios = AxiosInstance & { __authInterceptorId?: number };

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}) as AuthAxios;

export const initApiClient = (getToken: () => Promise<string | null>) => {
  if (apiClient.__authInterceptorId != null) {
    try {
      apiClient.interceptors.request.eject(apiClient.__authInterceptorId);
    } catch (e) {
      // ignore
    }
  }

  const id = apiClient.interceptors.request.use(
    async (config: AxiosRequestConfig) => {
      try {
        const token = await getToken();
        if (token) {
          if (!config.headers) {
            config.headers = {} as AxiosRequestHeaders;
          }
          (config.headers as AxiosRequestHeaders)['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        // If token fetch fails, continue without auth header
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.__authInterceptorId = id;

  return () => {
    try {
      apiClient.interceptors.request.eject(id);
      delete apiClient.__authInterceptorId;
    } catch (e) {
      // ignore
    }
  };
};

export const jobsApi = {
  getAll: () => apiClient.get('/api/v1/job'),
  getById: (id: string) => apiClient.get(`/api/v1/job/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/api/v1/job', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/api/v1/job/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/v1/job/${id}`),
};

export type UploadResult =
  | { response: AxiosResponse<unknown>; attempts: number }
  | { error: unknown; attempts: number };

export const candidatesApi = {
 
  upload: async (
    jobId: string,
    files: File[],
    onProgress?: (index: number, percent: number) => void,
    onAttempt?: (index: number, attempt: number) => void
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];

    const uploadSingle = async (file: File, index: number): Promise<{ response?: AxiosResponse<unknown>; error?: unknown; attempts: number }> => {
      const maxRetries = 2;
      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
          if (onAttempt) onAttempt(index, attempt);
          const formData = new FormData();
          formData.append('files', file);

          const res = await apiClient.post(`/api/v1/candidate/${jobId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent: AxiosProgressEvent | ProgressEvent) => {
              const loaded = (progressEvent as AxiosProgressEvent | undefined)?.loaded ?? (progressEvent as ProgressEvent | undefined)?.loaded;
              const total = (progressEvent as AxiosProgressEvent | undefined)?.total ?? (progressEvent as ProgressEvent | undefined)?.total;
              if (typeof loaded === 'number' && typeof total === 'number' && total > 0) {
                const percent = Math.round((loaded / total) * 100);
                if (onProgress) onProgress(index, percent);
              }
            },
          });

          return { response: res, attempts: attempt };
        } catch (err) {
          if (attempt >= maxRetries + 1) {
            return { error: err, attempts: attempt };
          }
          const delay = 500 * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, delay));
        }
      }
      return { error: new Error('Upload failed'), attempts: maxRetries + 1 };
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const out = await uploadSingle(file, i);
      if (out.response) {
        results.push({ response: out.response, attempts: out.attempts });
        if (onProgress) onProgress(i, 100);
      } else {
        results.push({ error: out.error, attempts: out.attempts });
        if (onProgress) onProgress(i, -1);
      }
    }

    return results;
  },
  process: (candidateIds: string[]) => apiClient.post('/api/v1/candidate/process', { candidateIds }),
  getByJob: (jobId: string) => apiClient.get(`/api/v1/candidate/${jobId}`),
};

export const matchesApi = {
  run: (jobId: string) => apiClient.post(`/api/v1/match/${jobId}/run`),
  getByJob: (jobId: string) => apiClient.get(`/api/v1/match/${jobId}`),
  shortlist: (matchId: string) => apiClient.post(`/api/v1/match/${matchId}/shortlist`),
  updateNotes: (matchId: string, notes: string) =>
    apiClient.post(`/api/v1/match/${matchId}/notes`, { notes }),
};

export const dashboardApi = {
  getStats: () => apiClient.get('/api/v1/dashboard/stats'),
  getActivity: () => apiClient.get('/api/v1/dashboard/activity'),
  getScoreDistribution: () => apiClient.get('/api/v1/dashboard/score-distribution'),
};
