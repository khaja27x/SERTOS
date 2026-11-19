export type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  phone_number: string;
  badge_or_employee_id: string;
  is_verified: boolean;
  date_joined?: string;
};

export type Incident = {
  id: string;
  incident_number: string;
  severity: string;
  severity_display: string;
  status: string;
  status_display: string;
  description: string;
  hospital: {
    id: string;
    name: string;
    hospital_code: string;
    address: string;
    contact_number: string;
    latitude: string;
    longitude: string;
    is_active: boolean;
  };
  ambulance: {
    id: string;
    vehicle_number: string;
    vehicle_type: string;
    is_available: boolean;
    is_active: boolean;
  };
  patient_count: number;
  created_at: string;
  updated_at: string;
  assigned_at?: string | null;
  in_transit_at?: string | null;
  arrived_at?: string | null;
  closed_at?: string | null;
  cancelled_at?: string | null;
};

export type IncidentDetail = Incident & {
  reporting_driver?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    phone_number: string;
    badge_or_employee_id: string;
    is_verified: boolean;
  };
  patients?: Array<{
    id: string;
    name: string;
    age: number;
    gender: string;
    blood_group: string;
    created_at: string;
    updated_at: string;
  }>;
  route_summary?: {
    distance_km: number;
    duration_formatted: string;
    estimated_arrival: string;
    is_stale: boolean;
    last_calculated_at: string;
  } | null;
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
  event?: {
    event_type: string;
    event_type_display: string;
    description: string;
  };
};
