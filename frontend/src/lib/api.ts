const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://sertos.onrender.com";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
};

export type LoginData = {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    role: string;
    is_verified: boolean;
  };
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  canRefresh = true,
): Promise<T> {
  const accessToken = localStorage.getItem("sertos_access_token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  let payload: ApiEnvelope<T> | undefined;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(
      "The backend returned an invalid response. Please try again later.",
      response.status,
    );
  }

  if (
    response.status === 401 &&
    canRefresh &&
    path !== "/api/auth/token/refresh/"
  ) {
    const refreshToken = localStorage.getItem("sertos_refresh_token");
    if (refreshToken) {
      try {
        const refreshed = await request<LoginRefresh>(
          "/api/auth/token/refresh/",
          {
            method: "POST",
            body: JSON.stringify({ refresh: refreshToken }),
          },
          false,
        );
        localStorage.setItem("sertos_access_token", refreshed.access);
        if (refreshed.refresh) {
          localStorage.setItem("sertos_refresh_token", refreshed.refresh);
        }
        return request<T>(path, options, false);
      } catch {
        localStorage.removeItem("sertos_access_token");
        localStorage.removeItem("sertos_refresh_token");
      }
    }
  }

  if (!response.ok || payload.success === false) {
    const detail = payload.errors?.detail?.[0];
    throw new ApiError(
      detail ?? payload.message ?? "The request could not be completed.",
      response.status,
    );
  }

  return payload.data;
}

export function login(username: string, password: string) {
  return request<LoginData>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export type LoginRefresh = {
  access: string;
  refresh?: string;
};

export type Incident = {
  id: string;
  incident_number: string;
  severity: string;
  severity_display: string;
  status: string;
  status_display: string;
  description: string;
  patient_count: number;
  hospital?: {
    id: string;
    name: string;
    address: string;
  };
  hospital_name?: string;
  ambulance?: {
    vehicle_number: string;
  };
  ambulance_vehicle_number?: string;
  created_at: string;
  updated_at: string;
};

export type Hospital = {
  id: string;
  name: string;
  hospital_code: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
};

export type RouteSummary = {
  distance_km: number;
  duration_formatted: string;
  estimated_arrival: string;
};

export type HospitalBed = {
  id: string;
  hospital: string;
  bed_number: string;
  category: "GENERAL" | "ICU" | "EMERGENCY";
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  patient_label: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  incident_id: string;
  incident_number: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type NotificationsPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
};

export const api = {
  getProfile: () =>
    request<LoginData["user"]>("/api/auth/profile/"),
  getPoliceIncidents: () =>
    request<Incident[]>("/api/police/incidents/"),
  getHospitalIncidents: () =>
    request<Incident[]>("/api/hospital/incidents/"),
  getDriverIncidents: () =>
    request<Incident[]>("/api/emergencies/"),
  getHospitals: () =>
    request<Hospital[]>("/api/emergencies/hospitals/"),
  createEmergency: (payload: {
    hospital_id: string;
    severity: string;
    description: string;
    patient: { name: string; medical_notes: string };
  }) =>
    request<Incident>("/api/emergencies/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateIncidentStatus: (incidentId: string, status: string) =>
    request<Incident>(`/api/emergencies/${incidentId}/status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  sendLocation: (incidentId: string, latitude: number, longitude: number) =>
    request(`/api/emergencies/${incidentId}/location/`, {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }),
  getRoute: (incidentId: string) =>
    request<RouteSummary>(`/api/emergencies/${incidentId}/route/`),
  getHospitalBeds: () =>
    request<HospitalBed[]>("/api/emergencies/hospital-beds/"),
  updateHospitalBed: (bedId: string, payload: Partial<Pick<HospitalBed, "status" | "patient_label">>) =>
    request<HospitalBed>(`/api/emergencies/hospital-beds/${bedId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  decideHospitalIncident: (incidentId: string, decision: "ACCEPTED" | "REJECTED", reason = "") =>
    request("/api/emergencies/hospital/incidents/" + incidentId + "/decision/", {
      method: "PATCH",
      body: JSON.stringify({ decision, reason }),
    }),
  getNotifications: () =>
    request<NotificationsPage>("/api/notifications/"),
  markAllNotificationsRead: () =>
    request<{ updated_count: number }>("/api/notifications/read-all/", {
      method: "PATCH",
    }),
  getLocation: (incidentId: string) =>
    request<{
      latitude: string;
      longitude: string;
      recorded_at: string;
    } | null>(`/api/emergencies/${incidentId}/location/`),
  logout: (refresh: string) =>
    request("/api/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }),
};
