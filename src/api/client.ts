import axios from "axios";
import { getAccessToken } from "@/lib/auth-storage";
import { API_BASE_URL } from "./config";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, unknown>)["Content-Type"];
  }
  const path = config.url ?? "";
  const isPublicAuth = path.startsWith("/api/auth/");
  const token = getAccessToken();
  if (token && !isPublicAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
