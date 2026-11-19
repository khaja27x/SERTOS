import { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Ambulance,
  Bell,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Filter,
  Gauge,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  Siren,
  UserRound,
  Users,
} from "lucide-react";
import { api, ApiError } from "./api";
import type { Incident, IncidentDetail, Notification, UserProfile } from "./types";
import {
  ArrowLink,
  EmptyState,
  formatDate,
  formatTime,
  PageHeader,
  SectionTitle,
  StatusBadge,
  TrafficPoliceLayout,
} from "./components/TrafficPoliceLayout";

const demoIncident: Incident = {
  id: "demo",
  incident_number: "AMB-1047",
  severity: "HIGH",
  severity_display: "High Priority",
  status: "REPORTED",
  status_display: "Reported",
  description: "Cardiac emergency",
  hospital: { id: "hospital", name: "City Central Hospital", hospital_code: "HOSP-001", address: "Central Junction", contact_number: "", latitude: "12.9716", longitude: "77.5946", is_active: true },
  ambulance: { id: "ambulance", vehicle_number: "AMB-1047", vehicle_type: "Advanced Life Support", is_available: true, is_active: true },
  patient_count: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const demoNotifications: Notification[] = [
  { id: "1", incident_id: "demo", incident_number: "AMB-1047", title: "New Ambulance Alert", message: "Central Junction · ETA 2 min", is_read: false, created_at: new Date().toISOString(), read_at: null },
  { id: "2", incident_id: "demo", incident_number: "AMB-1045", title: "ETA Updated", message: "Now 1 min", is_read: false, created_at: new Date(Date.now() - 120000).toISOString(), read_at: null },
  { id: "3", incident_id: "demo", incident_number: "AMB-1041", title: "Junction Cleared", message: "West Junction", is_read: true, created_at: new Date(Date.now() - 300000).toISOString(), read_at: new Date().toISOString() },
];

function usePoliceData(enabled = true) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    Promise.all([api.getProfile(), api.getIncidents(), api.getNotifications()])
      .then(([nextProfile, nextIncidents, nextNotifications]) => {
        if (!active) return;
        setProfile(nextProfile);
        setIncidents(nextIncidents);
        setNotifications(nextNotifications.results);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof ApiError ? reason.message : "Unable to load live SERTOS data.");
      });
    return () => { active = false; };
  }, [enabled]);

  return {
    profile,
    incidents: incidents.length ? incidents : [demoIncident],
    notifications: notifications.length ? notifications : demoNotifications,
    error,
  };
}

function App() {
  const location = useLocation();
  const data = usePoliceData(location.pathname !== "/login");
  return (
    <TrafficPoliceLayout profileName={data.profile ? `${data.profile.username}` : undefined}>
      {data.error && <div className="connection-notice"><CircleAlert size={16} /><span>{data.error}</span><span className="notice-muted">Showing interface preview until a verified police session is available.</span></div>}
      <Routes>
        <Route path="/" element={<DashboardPage {...data} />} />
        <Route path="/alerts" element={<AlertsPage incidents={data.incidents} />} />
        <Route path="/tracking" element={<TrackingPage incidents={data.incidents} />} />
        <Route path="/junctions" element={<JunctionsPage incidents={data.incidents} />} />
        <Route path="/history" element={<HistoryPage incidents={data.incidents} />} />
        <Route path="/notifications" element={<NotificationsPage notifications={data.notifications} />} />
        <Route path="/profile" element={<ProfilePage profile={data.profile} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<DashboardPage {...data} />} />
      </Routes>
    </TrafficPoliceLayout>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await api.login(username, password);
      window.localStorage.setItem("sertos_access_token", result.access);
      window.localStorage.setItem("sertos_refresh_token", result.refresh);
      window.location.assign("/");
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : "Unable to sign in to SERTOS.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="login-card card">
      <div className="login-brand"><div className="brand-shield"><ShieldCheck size={24} /></div><div><strong>SERTOS</strong><span>Traffic Operations</span></div></div>
      <span className="eyebrow">Secure officer access</span>
      <h1>Sign in to SERTOS</h1>
      <p>Use your verified police dispatcher account to access live emergency coordination.</p>
      <form onSubmit={submit}>
        <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error && <div className="form-error"><CircleAlert size={15} />{error}</div>}
        <button className="button primary full-width" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in securely"}</button>
      </form>
      <button className="text-button" onClick={() => navigate("/")}>Continue to interface preview</button>
    </section>
  );
}

function DashboardPage({ incidents, notifications }: { incidents: Incident[]; notifications: Notification[] }) {
  const active = incidents.filter((incident) => !["CLOSED", "CANCELLED"].includes(incident.status));
  const first = active[0] ?? incidents[0];
  return (
    <>
      <PageHeader eyebrow="Tablet View · Traffic Police Officer" title="Traffic Police Dashboard" description="Monitor emergency movement and keep routes clear for priority response." action={<button className="button secondary"><RefreshCw size={15} /> Refresh data</button>} />
      <div className="metric-grid">
        <MetricCard icon={<SirenIcon />} label="Active Alerts" value={String(active.length).padStart(2, "0")} tone="red" />
        <MetricCard icon={<MapPin size={19} />} label="Assigned Junctions" value="02" tone="blue" />
        <MetricCard icon={<Check size={19} />} label="Response Rate" value="98%" tone="green" />
        <MetricCard icon={<Clock3 size={19} />} label="Avg Response Time" value="2 min" tone="purple" />
      </div>
      <div className="dashboard-grid">
        <section className="card alert-panel">
          <SectionTitle title="Active Alerts" action={<a href="/alerts"><ArrowLink>View All</ArrowLink></a>} />
          {first ? <AlertSummary incident={first} /> : <EmptyState title="No active alerts" message="All emergency routes are clear." />}
          <div className="system-status"><span className="status-check"><Check size={13} /></span><span>All Systems Operational</span><span className="system-time">Updated just now</span></div>
        </section>
        <section className="card quick-panel">
          <SectionTitle title="Response Overview" />
          <div className="overview-row"><div className="overview-icon blue"><Activity size={18} /></div><div><strong>Live operations</strong><span>Emergency network is connected</span></div><StatusBadge tone="green">Operational</StatusBadge></div>
          <div className="overview-row"><div className="overview-icon amber"><Bell size={18} /></div><div><strong>{notifications.filter((item) => !item.is_read).length} unread notifications</strong><span>Review the latest updates</span></div><a href="/notifications"><ArrowLink>Open</ArrowLink></a></div>
        </section>
      </div>
    </>
  );
}

function SirenIcon() {
  return <Siren size={19} />;
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function AlertSummary({ incident }: { incident: Incident }) {
  const high = incident.severity === "CRITICAL" || incident.severity === "HIGH";
  return (
    <div className="alert-summary">
      <div className="alert-vehicle"><Ambulance size={27} /></div>
      <div className="alert-summary-main"><div className="alert-title-row"><strong>{incident.ambulance.vehicle_number}</strong><StatusBadge tone={high ? "red" : "amber"}>{incident.severity_display || incident.severity}</StatusBadge></div><span>{incident.hospital.name} · {incident.description || "Emergency response"}</span><small>{incident.patient_count} patient{incident.patient_count === 1 ? "" : "s"} · Active response</small></div>
      <div className="alert-meta"><strong>ETA 2 min</strong><span>Priority route</span></div>
    </div>
  );
}

function AlertsPage({ incidents }: { incidents: Incident[] }) {
  const [selected, setSelected] = useState<Incident | null>(incidents[0] ?? null);
  return (
    <>
      <PageHeader eyebrow="Emergency response" title="Ambulance Alerts" description="Review incoming emergencies and coordinate safe passage through city junctions." action={<button className="button primary"><Check size={16} /> Acknowledge alert</button>} />
      <div className="split-layout">
        <section className="card list-card"><SectionTitle title="Incoming alerts" action={<StatusBadge tone="red">{incidents.length} active</StatusBadge>} /><div className="incident-list">{incidents.map((incident) => <button className={`incident-list-item ${selected?.id === incident.id ? "selected" : ""}`} onClick={() => setSelected(incident)} key={incident.id}><div className="alert-vehicle small"><Ambulance size={20} /></div><div><strong>{incident.ambulance.vehicle_number}</strong><span>{incident.hospital.name}</span></div><StatusBadge tone={incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "red" : "amber"}>{incident.severity_display || incident.severity}</StatusBadge></button>)}</div></section>
        <AlertDetail incident={selected} />
      </div>
    </>
  );
}

function AlertDetail({ incident }: { incident: Incident | null }) {
  if (!incident) return <section className="card"><EmptyState title="Select an alert" message="Choose an alert to see its operational details." /></section>;
  return <section className="card detail-card"><div className="detail-hero"><div className="alert-vehicle"><Ambulance size={30} /></div><div><span className="eyebrow">Emergency alert</span><h2>{incident.ambulance.vehicle_number}</h2><p>{incident.description || "Emergency response required"}</p></div><StatusBadge tone="red">{incident.severity_display || "High Priority"}</StatusBadge></div><div className="route-callout"><Navigation size={17} /><span>Route: <strong>{incident.hospital.address || incident.hospital.name}</strong></span></div><SectionTitle title="Alert details" /><div className="detail-list"><DetailRow icon={<Clock3 size={16} />} label="Reported" value={formatTime(incident.created_at)} /><DetailRow icon={<CircleAlert size={16} />} label="Priority" value={incident.severity_display || incident.severity} /><DetailRow icon={<Gauge size={16} />} label="Current Speed" value="60 km/h" /><DetailRow icon={<MapPin size={16} />} label="Distance" value="2.1 km" /></div><button className="button primary full-width"><Check size={17} /> Acknowledge Alert</button></section>;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="detail-row"><span className="detail-row-label">{icon}{label}</span><strong>{value}</strong></div>;
}

function TrackingPage({ incidents }: { incidents: Incident[] }) {
  const [selected, setSelected] = useState(incidents[0]);
  return <><PageHeader eyebrow="Live operations" title="Live Ambulance Tracking" description="Follow active ambulance routes and clear the destination junction before arrival." action={<div className="live-pill large"><span className="live-dot" /> Live tracking</div>} /><section className="card map-card"><div className="map-toolbar"><div><strong>{selected.ambulance.vehicle_number}</strong><span>{selected.hospital.name}</span></div><select value={selected.id} onChange={(event) => setSelected(incidents.find((item) => item.id === event.target.value) ?? selected)}>{incidents.map((item) => <option key={item.id} value={item.id}>{item.ambulance.vehicle_number}</option>)}</select></div><MapVisual /><div className="map-info"><div><span>Destination</span><strong>{selected.hospital.address || selected.hospital.name}</strong></div><div><span>ETA</span><strong>2 min</strong></div><div><span>Distance</span><strong>2.1 km</strong></div><StatusBadge tone="green">On Route</StatusBadge></div></section></>;
}

function MapVisual() {
  return <div className="map-visual"><div className="map-grid-lines" /><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" /><div className="map-marker ambulance-marker"><Ambulance size={20} /></div><div className="map-marker destination-marker"><MapPin size={25} fill="currentColor" /></div><span className="map-label destination-label">Central Junction</span><div className="map-controls"><button>+</button><button>−</button><button><MapPin size={16} /></button></div></div>;
}

function JunctionsPage({ incidents }: { incidents: Incident[] }) {
  return <><PageHeader eyebrow="Traffic coordination" title="Junction Management" description="Keep priority corridors clear for approaching emergency vehicles." action={<StatusBadge tone="green">2 junctions monitored</StatusBadge>} /><div className="junction-layout"><section className="card junction-info"><div className="junction-image"><MapPin size={30} /></div><div className="junction-heading"><div><span className="eyebrow">Active junction</span><h2>Central Junction</h2></div><StatusBadge tone="green">Active</StatusBadge></div><div className="junction-details"><DetailRow icon={<Ambulance size={16} />} label="Approaching Ambulance" value={incidents[0]?.ambulance.vehicle_number ?? "No vehicle"} /><DetailRow icon={<Clock3 size={16} />} label="ETA" value="2 min" /><DetailRow icon={<Activity size={16} />} label="Traffic Status" value="Normal" /></div></section><section className="card signal-card"><SectionTitle title="Signal Control" action={<StatusBadge tone="green">Connected</StatusBadge>} /><div className="signal-layout"><div className="traffic-light"><span className="red-light" /><span className="amber-light" /><span className="green-light active" /></div><div><span className="eyebrow">Current signal phase</span><h2>Green</h2><p>38 seconds remaining</p></div></div><button className="button success full-width"><Check size={17} /> Clear Route</button></section></div></>;
}

function HistoryPage({ incidents }: { incidents: Incident[] }) {
  const rows = [...incidents, demoIncident, { ...demoIncident, id: "history-2", incident_number: "AMB-1045", status_display: "Acknowledged", created_at: new Date(Date.now() - 600000).toISOString() }].slice(0, 5);
  return <><PageHeader eyebrow="Operations log" title="Alert History" description="Review response activity and acknowledge completion times." action={<button className="button secondary"><Filter size={15} /> Filter <ChevronDown size={14} /></button>} /><section className="card table-card"><div className="table-toolbar"><div><strong>Recent alerts</strong><span>Last 24 hours</span></div><select defaultValue="all"><option value="all">All statuses</option><option value="completed">Completed</option><option value="acknowledged">Acknowledged</option></select></div><div className="table-scroll"><table><thead><tr><th>Date & Time</th><th>Ambulance ID</th><th>Status</th><th>Response Time</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.id}-${index}`}><td>{formatDate(row.created_at)}</td><td><strong>{row.ambulance.vehicle_number}</strong></td><td><StatusBadge tone={index === 1 ? "blue" : "green"}>{index === 1 ? "Acknowledged" : "Completed"}</StatusBadge></td><td>{index === 1 ? "38 sec" : `${45 + index * 7} sec`}</td></tr>)}</tbody></table></div></section></>;
}

function NotificationsPage({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications);
  const markAll = async () => { await api.markAllNotificationsRead().catch(() => undefined); setItems((current) => current.map((item) => ({ ...item, is_read: true }))); };
  return <><PageHeader eyebrow="Communication center" title="Notifications" description="Stay informed about ambulance movement and junction activity." action={<button className="button secondary" onClick={markAll}><Check size={15} /> Mark All Read</button>} /><section className="card notifications-card"><SectionTitle title="Recent notifications" action={<span className="unread-count">{items.filter((item) => !item.is_read).length} unread</span>} />{items.map((item) => <NotificationRow key={item.id} item={item} onRead={() => { api.markNotificationRead(item.id).catch(() => undefined); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry)); }} />)}</section></>;
}

function NotificationRow({ item, onRead }: { item: Notification; onRead: () => void }) {
  const tone = item.title.toLowerCase().includes("alert") ? "red" : item.title.toLowerCase().includes("eta") ? "blue" : "green";
  return <button className={`notification-row ${item.is_read ? "read" : ""}`} onClick={onRead}><span className={`notification-dot ${tone}`} /><span className="notification-copy"><strong>{item.title} — {item.incident_number}</strong><span>{item.message}</span></span><time>{formatTime(item.created_at)}</time>{!item.is_read && <span className="unread-dot" />}</button>;
}

function ProfilePage({ profile }: { profile: UserProfile | null }) {
  return <><PageHeader eyebrow="Officer account" title="Officer Profile" description="Manage your operational identity and contact preferences." action={<StatusBadge tone="green">Online</StatusBadge>} /><div className="profile-layout"><section className="card profile-card"><div className="profile-hero"><div className="avatar avatar-large">{profile?.username?.slice(0, 2).toUpperCase() ?? "RK"}</div><div><h2>{profile?.username ?? "Constable Raju Kumar"}</h2><p>Traffic Police Officer</p><StatusBadge tone="green">Verified account</StatusBadge></div></div><div className="profile-fields"><ProfileField label="Badge / Employee ID" value={profile?.badge_or_employee_id ?? "POL-CPS-014"} /><ProfileField label="Police Station" value="Central Police Station" /><ProfileField label="Contact information" value={profile?.phone_number ?? "+91 98765 43210"} icon={<Phone size={15} />} /><ProfileField label="Email" value={profile?.email ?? "raju.kumar@sertos.local"} /></div></section><section className="card profile-card"><SectionTitle title="Account preferences" /><div className="preference-row"><div className="overview-icon blue"><Bell size={17} /></div><div><strong>Operational notifications</strong><span>Receive live emergency alerts</span></div><span className="toggle on"><span /></span></div><div className="preference-row"><div className="overview-icon green"><ShieldCheck size={17} /></div><div><strong>Secure session</strong><span>JWT authentication is enabled</span></div><StatusBadge tone="green">Active</StatusBadge></div><div className="preference-row"><div className="overview-icon purple"><Users size={17} /></div><div><strong>Assigned junctions</strong><span>Central Junction · West Junction</span></div></div></section></div></>;
}

function ProfileField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="profile-field"><span>{label}</span><strong>{icon}{value}</strong></div>;
}

export default App;
