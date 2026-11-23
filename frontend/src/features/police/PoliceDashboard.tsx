
import {
    Activity,
    Ambulance,
    Bell,
    CheckCircle2,
    Clock3,
    MapPin,
    Radio,
    ShieldCheck,
    Siren,
    TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Incident } from "../../lib/api";

const statistics = [
    {
        title: "Active Ambulances",
        value: "08",
        detail: "Currently on emergency routes",
        icon: Ambulance,
        color: "blue",
    },
    {
        title: "Pending Alerts",
        value: "03",
        detail: "Require officer attention",
        icon: Bell,
        color: "orange",
    },
    {
        title: "Junctions Connected",
        value: "12",
        detail: "Connected junctions",
        icon: Radio,
        color: "green",
    },
    {
        title: "Alerts Resolved",
        value: "24",
        detail: "Today’s completed alerts",
        icon: CheckCircle2,
        color: "purple",
    },
];

const recentActivity = [
    {
        title: "Ambulance alert received",
        description: "AMB-1024 · Rajampet Main Road",
        time: "2 minutes ago",
    },
    {
        title: "Junction clearance acknowledged",
        description: "Railway Station Junction",
        time: "8 minutes ago",
    },
    {
        title: "Emergency route completed",
        description: "AMB-1015 · Hospital arrival confirmed",
        time: "18 minutes ago",
    },
];

export default function PoliceDashboard() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.getPoliceIncidents()
            .then((data) => {
                if (active) setIncidents(data);
            })
            .catch((reason: unknown) => {
                if (active) {
                    setError(reason instanceof Error ? reason.message : "Unable to load live incidents.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const activeIncidents = incidents.filter(
        (incident) => !["CLOSED", "CANCELLED"].includes(incident.status),
    );
    const liveAlerts = activeIncidents.map((incident) => ({
        id: incident.incident_number,
        location: incident.hospital?.address || incident.hospital?.name || "Destination pending",
        destination: incident.hospital?.name || "Hospital pending",
        eta: incident.status === "IN_TRANSIT" ? "Live route" : "Calculating",
        priority: incident.severity_display || incident.severity,
        status: incident.status_display || incident.status,
    }));

    return (
        <div className="tp-dashboard">
            {loading && (
                <div className="tp-panel-footer">Loading live incidents...</div>
            )}
            {error && (
                <div className="tp-panel-footer">{error}</div>
            )}
            <header className="tp-page-header">
                <div>
                    <div className="tp-breadcrumb">Traffic Police / Dashboard</div>
                    <h1>Dashboard Overview</h1>
                    <p>Monitor emergency response activities and ambulance movements.</p>
                </div>

                <div className="tp-header-actions">
                    <div className="tp-live-indicator">
                        <span />
                        System Online
                    </div>
                    <button className="tp-icon-button" type="button" aria-label="Notifications">
                        <Bell size={19} />
                        <span className="tp-notification-dot" />
                    </button>
                    <div className="tp-header-officer">
                        <div className="tp-officer-avatar">PO</div>
                        <div>
                            <strong>Police Officer</strong>
                            <span>Traffic Control Unit</span>
                        </div>
                    </div>
                </div>
            </header>

            <section className="tp-welcome-panel">
                <div className="tp-welcome-icon">
                    <ShieldCheck size={25} />
                </div>
                <div>
                    <h2>Welcome, Traffic Officer</h2>
                    <p>
                        Your control center for monitoring ambulances and coordinating
                        emergency traffic response.
                    </p>
                </div>
                <div className="tp-welcome-status">
                    <span />
                    On Duty
                </div>
            </section>

            <section className="tp-stat-grid">
                {statistics.map((item) => {
                    const Icon = item.icon;

                    return (
                        <article className="tp-stat-card" key={item.title}>
                            <div className={`tp-stat-icon tp-stat-${item.color}`}>
                                <Icon size={21} />
                            </div>
                            <div className="tp-stat-content">
                                <span>{item.title}</span>
                                <strong>{item.title === "Active Ambulances" ? String(activeIncidents.length).padStart(2, "0") : item.title === "Pending Alerts" ? String(liveAlerts.length).padStart(2, "0") : item.value}</strong>
                                <small>{item.detail}</small>
                            </div>
                            <TrendingUp className="tp-stat-trend" size={17} />
                        </article>
                    );
                })}
            </section>

            <section className="tp-dashboard-grid">
                <article className="tp-card tp-alerts-panel">
                    <div className="tp-section-header">
                        <div>
                            <h2>
                                <Siren size={19} />
                                Active Ambulance Alerts
                            </h2>
                            <p>Emergency vehicles currently requiring coordination</p>
                        </div>
                        <span className="tp-count-badge">{String(activeIncidents.length).padStart(2, "0")} Active</span>
                    </div>

                    <div className="tp-alert-list">
                        {liveAlerts.map((alert) => (
                            <div className="tp-alert-row" key={alert.id}>
                                <div className="tp-alert-symbol">
                                    <Ambulance size={21} />
                                </div>

                                <div className="tp-alert-main">
                                    <div className="tp-alert-title">
                                        <strong>{alert.id}</strong>
                                        <span
                                            className={
                                                alert.priority === "Critical"
                                                    ? "tp-priority-critical"
                                                    : "tp-priority-high"
                                            }
                                        >
                                            {alert.priority}
                                        </span>
                                    </div>
                                    <p>
                                        <MapPin size={13} />
                                        {alert.location}
                                    </p>
                                    <small>Destination: {alert.destination}</small>
                                </div>

                                <div className="tp-alert-meta">
                                    <strong>
                                        <Clock3 size={14} />
                                        {alert.eta}
                                    </strong>
                                    <span>{alert.status}</span>
                                    <button type="button" className="tp-view-button">
                                        View details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="tp-panel-footer">
                        <span>Showing 3 of 8 active ambulances</span>
                        <button type="button">View all alerts →</button>
                    </div>
                </article>

                <article className="tp-card tp-activity-panel">
                    <div className="tp-section-header">
                        <div>
                            <h2>
                                <Activity size={19} />
                                Recent Activity
                            </h2>
                            <p>Latest emergency response updates</p>
                        </div>
                    </div>

                    <div className="tp-activity-list">
                        {recentActivity.map((activity, index) => (
                            <div className="tp-activity-item" key={activity.title}>
                                <div className="tp-activity-marker">
                                    <span />
                                    {index !== recentActivity.length - 1 && (
                                        <div className="tp-activity-line" />
                                    )}
                                </div>
                                <div className="tp-activity-content">
                                    <strong>{activity.title}</strong>
                                    <p>{activity.description}</p>
                                    <small>{activity.time}</small>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="tp-panel-footer">
                        <span>Recent system events</span>
                        <button type="button">View history →</button>
                    </div>
                </article>
            </section>

            <footer className="tp-dashboard-footer">
                <span>SERTOS Emergency Response System</span>
                <span>Traffic Police Control Center</span>
            </footer>
        </div>
    );
}
