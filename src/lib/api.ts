/**
 * Career Navigator - Shared API Client with CSRF Double-Submit Protection
 * Centralized API base URL resolution, credentials inclusion, and structured error handling.
 */

// Centralized API Base URL configuration
const API_BASE_URL: string = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  ''
).replace(/\/$/, '');

/**
 * Resolves an endpoint to a fully qualified URL if API_BASE_URL is configured,
 * preserving absolute URLs (http:// or https://) untouched.
 */
export function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;
}

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(init?: RequestInit, isJson: boolean = true): Headers {
  const headers = new Headers(init?.headers);
  if (isJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const csrfToken = getCsrfToken();
  if (csrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  return headers;
}

/**
 * Formats API and network errors into actionable, user-friendly messages
 * while distinguishing connection failures from validation or server errors.
 */
export function formatApiError(err: any, fallback: string = 'An unexpected error occurred'): string {
  if (!err) return fallback;
  if (typeof err === 'string') {
    if (err.toLowerCase().includes('failed to fetch') || err.toLowerCase().includes('networkerror')) {
      return 'Unable to reach the Career Navigator server. Please verify the backend is running on port 3000 and check your network connection.';
    }
    return err;
  }
  if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('NetworkError'))) {
    return 'Unable to reach the Career Navigator server. Please verify the backend is running on port 3000 and check your network connection.';
  }
  return err.message || fallback;
}

/**
 * Safely parses API responses, handling empty or non-JSON payloads gracefully.
 */
export async function parseApiResponse<T = any>(res: Response): Promise<{ ok: boolean; status: number; data: T }> {
  let data: any = {};
  const contentType = res.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text || res.statusText };
      }
    }
  } catch (parseErr) {
    data = { error: res.statusText || 'Unable to parse server response' };
  }
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  /**
   * Safe GET request with automatic header propagation & credentials
   */
  get(url: string, init?: RequestInit): Promise<Response> {
    return fetch(resolveApiUrl(url), {
      credentials: 'include',
      ...init,
      method: 'GET',
      headers: buildHeaders(init, false)
    });
  },

  /**
   * POST request with CSRF token, credentials, and JSON serialization
   */
  post(url: string, body?: any, init?: RequestInit): Promise<Response> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = buildHeaders(init, !isFormData);
    return fetch(resolveApiUrl(url), {
      credentials: 'include',
      ...init,
      method: 'POST',
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  /**
   * PUT request with CSRF token, credentials, and JSON serialization
   */
  put(url: string, body?: any, init?: RequestInit): Promise<Response> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = buildHeaders(init, !isFormData);
    return fetch(resolveApiUrl(url), {
      credentials: 'include',
      ...init,
      method: 'PUT',
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined
    });
  },

  /**
   * DELETE request with CSRF token and credentials
   */
  delete(url: string, init?: RequestInit): Promise<Response> {
    return fetch(resolveApiUrl(url), {
      credentials: 'include',
      ...init,
      method: 'DELETE',
      headers: buildHeaders(init, false)
    });
  }
};
