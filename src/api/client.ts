import axios, { AxiosHeaders } from "axios";
import { clearAuthSession, getAccessToken } from "@/lib/auth-storage";
import { API_BASE_URL } from "./config";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

/** Per-request override so axios lets the browser set multipart boundary. */
export const multipartPostConfig = {
  headers: {
    "Content-Type": false,
  },
} as const;

function clearJsonContentTypeForMultipart(config: {
  data?: unknown;
  headers?: unknown;
}) {
  if (typeof FormData === "undefined" || !(config.data instanceof FormData)) {
    return;
  }
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : AxiosHeaders.from((config.headers ?? {}) as AxiosHeaders);
  headers.set("Content-Type", false);
  config.headers = headers;
}

apiClient.interceptors.request.use((config) => {
  clearJsonContentTypeForMultipart(config);
  const path = config.url ?? "";
  const isPublicAuth = path.startsWith("/api/auth/");
  const token = getAccessToken();
  if (token && !isPublicAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path: string = error?.config?.url ?? "";
    if (
      status === 401 &&
      !path.startsWith("/api/auth/") &&
      typeof window !== "undefined"
    ) {
      clearAuthSession();
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);
