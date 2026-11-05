export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export declare class ApiError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: unknown;
    constructor(message: string, code?: string, statusCode?: number, details?: unknown);
}
export declare function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T>;
//# sourceMappingURL=api.d.ts.map