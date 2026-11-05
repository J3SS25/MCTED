export class ApiError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code = 'API_ERROR', statusCode = 500, details) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('mcteb_token');
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include HTTP-only cookie
    });
    if (response.status === 204) {
        return {};
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const errorData = data;
        const message = errorData.error?.message || `Request failed with status ${response.status}`;
        const code = errorData.error?.code || 'UNKNOWN_ERROR';
        throw new ApiError(message, code, response.status, errorData.error?.details);
    }
    return data;
}
//# sourceMappingURL=api.js.map