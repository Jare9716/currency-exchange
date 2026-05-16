import { useAuthStore } from "@/presentation/stores/auth.store";
import { ApiError, apiErrorSchema } from "@/domain/Errors";
import { API_BASE_URL } from "@/config";
import { to } from "@/utils/async";

const BASE_URL = API_BASE_URL;

type FetchOptions = RequestInit & {
  requireAuth?: boolean;
};

async function handleResponse(
  response: Response,
  url: string,
  options: FetchOptions,
  headers: Headers
): Promise<Response> {
  if (response.ok) {
    return response;
  }

  const [jsonErr, parsedJson] = await to(response.json());
  const errorData = jsonErr ? {} : parsedJson;
  const parsedError = apiErrorSchema.safeParse(errorData);

  if (parsedError.success) {
    const apiErr = parsedError.data;

    // Refresh Token Interceptor
    if (apiErr.error_code === "TOKEN_INVALID" && options.requireAuth) {
      const state = useAuthStore.getState();

      if (state.refreshToken) {
        const refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify({ refresh_token: state.refreshToken }),
        });

        if (refreshResponse.ok) {
          const newTokens = await refreshResponse.json();
          state.setTokens(newTokens.access_token, newTokens.refresh_token);

          // Retry original request with new token
          headers.set("Authorization", `Bearer ${newTokens.access_token}`);
          const retriedResponse = await fetch(url, { ...options, headers });

          if (retriedResponse.ok) {
            return retriedResponse;
          }

          const [retryJsonErr, retryParsedJson] = await to(retriedResponse.json());
          const retriedErrorData = retryJsonErr ? {} : retryParsedJson;
          const retriedParsedError = apiErrorSchema.safeParse(retriedErrorData);

          if (retriedParsedError.success) {
            throw new ApiError(
              retriedParsedError.data.status_code,
              retriedParsedError.data.error_code,
              retriedParsedError.data.detail,
              retriedParsedError.data.hint
            );
          }
        }
      }

      // Refresh failed or no refresh token
      useAuthStore.getState().clearTokens();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session:expired"));
      }
    }

    // Other standardized API errors
    throw new ApiError(
      apiErr.status_code,
      apiErr.error_code,
      apiErr.detail,
      apiErr.hint
    );
  }

  // Unknown error structure
  throw new Error(errorData.message || "An unknown error occurred");
}

async function request(url: string, options: FetchOptions = {}): Promise<Response> {
  const { requireAuth = true, ...init } = options;
  const headers = new Headers(init.headers);

  if (requireAuth) {
    const state = useAuthStore.getState();
    if (state.accessToken) {
      headers.set("Authorization", `Bearer ${state.accessToken}`);
    }
  }

  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  headers.set("ngrok-skip-browser-warning", "true");

  const requestUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  const response = await fetch(requestUrl, { ...init, headers });

  return handleResponse(response, requestUrl, { ...options, requireAuth }, headers);
}

const prepareBody = (body?: unknown) => {
  if (body === undefined || body === null) return undefined;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
};

export const HttpClient = {
  get: (url: string, options?: FetchOptions) =>
    request(url, { ...options, method: "GET" }),
  post: (url: string, body?: unknown, options?: FetchOptions) =>
    request(url, {
      ...options,
      method: "POST",
      body: prepareBody(body),
    }),
  put: (url: string, body?: unknown, options?: FetchOptions) =>
    request(url, {
      ...options,
      method: "PUT",
      body: prepareBody(body),
    }),
  patch: (url: string, body?: unknown, options?: FetchOptions) =>
    request(url, {
      ...options,
      method: "PATCH",
      body: prepareBody(body),
    }),
  delete: (url: string, options?: FetchOptions) =>
    request(url, { ...options, method: "DELETE" }),
};
