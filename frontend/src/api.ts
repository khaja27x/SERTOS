import type { Incident, IncidentDetail, Notification, UserProfile } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type LoginResponse = {
  access: string;
  refresh: string;
  user: UserProfile;
};

async function request<T>(path: string, options: RequestInit = {}, canRefresh = true): Promise<T> {
  const accessToken = window.localStorage.getItem("sertos_access_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; message?: string; errors?: Record<string, string[]> }
    | null;

  if (response.status === 401 && canRefresh && path !== "/api/auth/token/refresh/") {
    const refreshToken = window.localStorage.getItem("sertos_refresh_token");
    if (refreshToken) {
      try {
        const refreshed = await request<{ access: string; refresh?: string }>(
          "/api/auth/token/refresh/",
          { method: "POST", body: JSON.stringify({ refresh: refreshToken }) },
          false,
        );
        window.localStorage.setItem("sertos_access_token", refreshed.access);
        if (refreshed.refresh) window.localStorage.setItem("sertos_refresh_token", refreshed.refresh);
        return request<T>(path, options, false);
      } catch {
        window.localStorage.removeItem("sertos_access_token");
        window.localStorage.removeItem("sertos_refresh_token");
      }
    }
  }

  if (!response.ok) {
    const detail = payload?.message ?? Object.values(payload?.errors ?? {}).flat().join(" ");
    throw new ApiError(detail || `Request failed with status ${response.status}.`, response.status);
  }

  return payload?.data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => {
    const refresh = window.localStorage.getItem("sertos_refresh_token");
    return request("/api/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
  },
  getProfile: () => request<UserProfile>("/api/auth/profile/"),
  getIncidents: () => request<Incident[]>("/api/police/incidents/"),
  getIncident: (id: string) => request<IncidentDetail>(`/api/police/incidents/${id}/`),
  getRoute: (id: string) => request<{
    distance_km: number;
    duration_formatted: string;
    estimated_arrival: string;
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number; hospital_name: string };
    polyline: string;
  }>(`/api/emergencies/${id}/route/`),
  getLocation: (id: string) =>
    request<{ latitude: string; longitude: string; recorded_at: string }>(
      `/api/emergencies/${id}/location/`,
    ),
  getNotifications: () =>
    request<{ count: number; results: Notification[] }>("/api/notifications/"),
  markAllNotificationsRead: () =>
    request<{ updated_count: number }>("/api/notifications/read-all/", { method: "PATCH" }),
  markNotificationRead: (id: string) =>
    request<Notification>(`/api/notifications/${id}/read/`, { method: "PATCH" }),
};
