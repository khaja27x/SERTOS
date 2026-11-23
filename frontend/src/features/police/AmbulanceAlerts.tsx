
import { useEffect, useState } from "react";
import {
    Ambulance,
    Bell,
    Check,
    Clock3,
    Gauge,
    MapPin,
    Navigation,
    Route,
    ShieldAlert,
} from "lucide-react";
import "./traffic-police.css";
import { api, type Incident } from "../../lib/api";

export default function AmbulanceAlerts() {
    const [acknowledged, setAcknowledged] = useState(false);

    const [alert, setAlert] = useState<{
        ambulanceId: string; patientCondition: string; eta: string; distance: string;
        route: string; reported: string; priority: string; speed: string;
    } | null>(null);

    useEffect(() => {
        api.getPoliceIncidents()
            .then((incidents: Incident[]) => {
                const incident = incidents.find((item) => !["CLOSED", "CANCELLED"].includes(item.status));
                if (incident) {
                    setAlert({
                        ambulanceId: incident.ambulance_vehicle_number || incident.incident_number,
                        patientCondition: incident.description || "Emergency response",
                        eta: "Live route",
                        distance: "Tracking available",
                        route: `${incident.ambulance_vehicle_number || incident.incident_number} → ${incident.hospital_name || "Hospital"}`,
                        reported: new Date(incident.created_at).toLocaleTimeString(),
                        priority: incident.severity_display || incident.severity,
                        speed: "Live GPS",
                    });
                }
            })
            .catch((error: unknown) => console.error("Unable to load ambulance alerts:", error));
    }, []);

    if (!alert) {
        return <div className="tp-ambulance-alerts"><h1>Ambulance Alerts</h1><p>No active ambulance alerts.</p></div>;
    }

    return (
        <div className="tp-ambulance-alerts">
            <header className="tp-alerts-page-header">
                <div>
                    <div className="tp-alerts-breadcrumb">
                        Dashboard / Alerts
                    </div>
                    <h1>Ambulance Alerts</h1>
                    <p>Manage incoming ambulance emergency requests.</p>
                </div>

                <button className="tp-alerts-notification" type="button">
                    <Bell size={19} />
                    <span />
                </button>
            </header>

            <section className="tp-emergency-card">
                <div className="tp-emergency-top">
                    <div className="tp-emergency-vehicle">
                        <Ambulance size={48} strokeWidth={1.5} />
                    </div>

                    <div className="tp-emergency-information">
                        <h2>{alert.ambulanceId}</h2>
                        <p>Patient: {alert.patientCondition}</p>

                        <div className="tp-emergency-metrics">
                            <span>ETA: <strong>{alert.eta}</strong></span>
                            <span className="tp-metric-divider" />
                            <span>Distance: <strong>{alert.distance}</strong></span>
                        </div>
                    </div>

                    <span className="tp-emergency-priority">
                        <ShieldAlert size={12} />
                        High Priority
                    </span>
                </div>

                <button
                    type="button"
                    className={`tp-acknowledge-button ${acknowledged ? "is-acknowledged" : ""
                        }`}
                    onClick={() => setAcknowledged(true)}
                    disabled={acknowledged}
                >
                    <Check size={17} />
                    {acknowledged ? "Alert Acknowledged" : "Acknowledge Alert"}
                </button>

                <div className="tp-emergency-route">
                    <Route size={13} />
                    <span>Route: {alert.route}</span>
                </div>
            </section>

            <section className="tp-alert-details-card">
                <h3>Alert Details</h3>

                <div className="tp-alert-detail-row">
                    <Clock3 size={14} />
                    <span>Reported:</span>
                    <strong>{alert.reported}</strong>
                </div>

                <div className="tp-alert-detail-row">
                    <ShieldAlert size={14} />
                    <span>Priority:</span>
                    <strong className="tp-detail-priority">{alert.priority}</strong>
                </div>

                <div className="tp-alert-detail-row">
                    <Gauge size={14} />
                    <span>Current Speed:</span>
                    <strong>{alert.speed}</strong>
                </div>

                <div className="tp-alert-detail-row">
                    <MapPin size={14} />
                    <span>Current Location:</span>
                    <strong>Central Junction</strong>
                </div>
            </section>

            <div className="tp-alerts-footer">
                <span>
                    <Navigation size={13} />
                    SERTOS Emergency Response System
                </span>
                <span>Live API data</span>
            </div>
        </div>
    );
}
