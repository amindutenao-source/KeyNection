export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const API_BASE = '/api';

const buildQuery = (params: Record<string, string | number | boolean | null | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || data.success === false) {
    const message = data.message || 'Une erreur est survenue';
    throw new Error(message);
  }

  return data;
}

export async function apiGet<T>(
  path: string,
  params: Record<string, string | number | boolean | null | undefined> = {}
): Promise<ApiResponse<T>> {
  const query = buildQuery(params);
  return apiRequest<T>(`${path}${query}`);
}
