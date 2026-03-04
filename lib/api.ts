import axios from "axios";
import { useAppStore } from "./store";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3001";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const factoryId = useAppStore.getState().factoryId;

  config.withCredentials = true;
  config.headers = config.headers ?? {};

  if (factoryId) {
    config.headers["x-factory-id"] = factoryId;
  }

  return config;
});

export async function apiGet<T>(path: string, params?: Record<string, unknown>) {
  const response = await api.get<T>(path, { params });
  return response.data;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  params?: Record<string, unknown>,
) {
  const response = await api.post<T>(path, body, { params });
  return response.data;
}
