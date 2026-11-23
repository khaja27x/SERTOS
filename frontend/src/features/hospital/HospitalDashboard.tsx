
import {
    AlertTriangle,
    BedDouble,
    Ambulance,
    Clock3,
    ArrowUpRight,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Activity,
    MapPin,
    HeartPulse,
    Users,
    Navigation,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Incident, type HospitalBed } from "../../lib/api";

import "./hospital.css";

const activityData = [
    {
        time: "14:32",
        title: "New emergency alert received",
        detail: "Patient PAT-78452 · Cardiac emergency",
        type: "danger",
    },
    {
        time: "14:20",
        title: "Bed availability updated",
        detail: "ICU bed availability confirmed",
        type: "success",
    },
    {
        time: "13:55",
        title: "Ambulance assigned",
        detail: "AMB-247 assigned to this hospital",
        type: "info",
    },
];

export default function HospitalDashboard() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [beds, setBeds] = useState<HospitalBed[]>([]);

    useEffect(() => {
        let active = true;
        api.getHospitalIncidents()
            .then((data) => {
                if (active) setIncidents(data);
            })
            .catch((reason: unknown) => {
                if (active) {
                    setError(reason instanceof Error ? reason.message : "Unable to load hospital incidents.");
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        api.getHospitalBeds()
            .then(setBeds)
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load beds."));
    }, []);

    const activeIncidents = incidents.filter(
        (incident) => !["CLOSED", "CANCELLED"].includes(incident.status),
    );
    const latestIncident = activeIncidents[0];
    const availableBeds = beds.filter((bed) => bed.status === "AVAILABLE").length;
    const totalBeds = beds.length;

    return (
        <div className="hd-dashboard">

            {/* PAGE HEADER */}
            <div className="hd-page-header">
                <div>
                    <div className="hd-breadcrumb">
                        Hospital Management <span>/</span> Dashboard
                    </div>

                    <h1>Hospital Dashboard</h1>

                    <p>
                        Monitor incoming emergencies, bed availability and
                        ambulance operations.
                    </p>
                </div>

                <div className="hd-date">
                    <Activity size={17} />
                    Emergency Operations Center
                </div>
            </div>

            {/* STATISTICS */}
            <section className="hd-stats-grid">

                <div className="hd-stat-card">
                    <div className="hd-stat-icon red">
                        <AlertTriangle size={23} />
                    </div>

                    <div>
                        <p>Active Emergencies</p>
                        <h2>{String(activeIncidents.length).padStart(2, "0")}</h2>
                        <span className="hd-stat-note red-text">
                            Requires attention
                        </span>
                    </div>

                    <ArrowUpRight className="hd-stat-arrow" size={19} />
                </div>

                <div className="hd-stat-card">
                    <div className="hd-stat-icon green">
                        <BedDouble size={23} />
                    </div>

                    <div>
                        <p>Available Beds</p>
                        <h2>{availableBeds} <small>/ {totalBeds}</small></h2>
                        <span className="hd-stat-note green-text">
                            80% available
                        </span>
                    </div>

                    <ArrowUpRight className="hd-stat-arrow" size={19} />
                </div>

                <div className="hd-stat-card">
                    <div className="hd-stat-icon blue">
                        <Ambulance size={23} />
                    </div>

                    <div>
                        <p>Assigned Ambulances</p>
                        <h2>01</h2>
                        <span className="hd-stat-note blue-text">
                            Currently responding
                        </span>
                    </div>

                    <ArrowUpRight className="hd-stat-arrow" size={19} />
                </div>

                <div className="hd-stat-card">
                    <div className="hd-stat-icon purple">
                        <Clock3 size={23} />
                    </div>

                    <div>
                        <p>Average Response Time</p>
                        <h2>06 <small>min</small></h2>
                        <span className="hd-stat-note purple-text">
                            Average arrival time
                        </span>
                    </div>

                    <ArrowUpRight className="hd-stat-arrow" size={19} />
                </div>

            </section>

            {/* MAIN DASHBOARD GRID */}
            <section className="hd-main-grid">

                {/* EMERGENCY ALERT */}
                <div className="hd-panel hd-emergency-panel">

                    <div className="hd-panel-header emergency-header">
                        <div>
                            <AlertTriangle size={20} />
                            <h3>Latest Emergency Alert</h3>
                        </div>

                        <span className="hd-priority-badge">
                            <span /> High Priority
                        </span>
                    </div>

                    <div className="hd-emergency-body">

                        <div className="hd-patient-row">
                            <div className="hd-patient-avatar">
                                <Users size={35} />
                            </div>

                            <div className="hd-patient-details">
                                <h3>Patient Details</h3>

                                <p>
                                    Patient ID:
                                    <strong> {latestIncident?.incident_number || "No active incident"}</strong>
                                </p>

                                <p>
                                    Age / Gender:
                                    <strong> Emergency triage</strong>
                                </p>

                                <p>
                                    Condition:
                                    <strong className="hd-condition">
                                        {" "}{latestIncident?.description || "No active emergency"}
                                    </strong>
                                </p>
                            </div>

                            <div className="hd-ambulance-info">
                                <span>Ambulance ID</span>
                                <strong>{latestIncident?.ambulance_vehicle_number || "Unassigned"}</strong>

                                <span className="hd-eta-label">Estimated Arrival</span>
                                <strong>
                                    <Clock3 size={15} />
                                    Live route
                                </strong>
                            </div>
                        </div>

                        {/* AI RECOMMENDATION */}
                        <div className="hd-ai-recommendation">
                            <div className="hd-ai-icon">
                                <HeartPulse size={20} />
                            </div>

                            <div>
                                <strong>SERTOS AI Recommendation</strong>
                                <p>
                                    {latestIncident?.hospital_name || "The assigned hospital"} was selected based
                                    on cardiac care facilities and emergency resources.
                                </p>
                            </div>
                        </div>

                        {/* REQUIRED RESOURCES */}
                        <div className="hd-resources">
                            <span>Required Resources</span>

                            <div>
                                <small>Cardiology Specialist</small>
                                <small>ICU Bed</small>
                                <small>Oxygen Support</small>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="hd-emergency-actions">
                            <button className="hd-confirm-button">
                                <CheckCircle2 size={18} />
                                Confirm Bed
                            </button>

                            <button className="hd-reject-button">
                                <XCircle size={18} />
                                Reject Request
                            </button>
                        </div>

                    </div>
                </div>

                {/* AMBULANCE TRACKING */}
                <div className="hd-panel hd-tracking-panel">

                    <div className="hd-panel-header">
                        <div>
                            <Navigation size={20} />
                            <h3>Assigned Ambulance Tracking</h3>
                        </div>

                        <span className="hd-live-badge">
                            <span /> Live
                        </span>
                    </div>

                    <div className="hd-map-placeholder">

                        <div className="hd-map-roads" />

                        <div className="hd-map-route">
                            <div className="hd-route-line" />
                            <div className="hd-route-point point-one" />
                            <div className="hd-route-point point-two" />
                            <div className="hd-route-point point-three" />
                        </div>

                        <div className="hd-map-ambulance">
                            <Ambulance size={30} />
                        </div>

                        <div className="hd-map-hospital">
                            <HeartPulse size={23} />
                        </div>

                        <div className="hd-map-info">
                            <strong>{latestIncident?.ambulance_vehicle_number || "Unassigned"}</strong>
                            <span>ETA: Live route</span>
                            <span>Distance: Tracking available</span>
                        </div>

                        <div className="hd-map-caption">
                            <MapPin size={15} />
                            Assigned ambulance route
                        </div>

                    </div>

                    <div className="hd-tracking-footer">
                        <span>Ambulance ID <strong>{latestIncident?.ambulance_vehicle_number || "Unassigned"}</strong></span>
                        <span>ETA <strong>Live</strong></span>
                        <button>
                            View Tracking <ArrowRight size={15} />
                        </button>
                    </div>
                </div>

            </section>

            {/* BOTTOM DASHBOARD GRID */}
            <section className="hd-bottom-grid">

                {/* BED AVAILABILITY */}
                <div className="hd-panel hd-bed-panel">

                    <div className="hd-panel-header">
                        <div>
                            <BedDouble size={20} />
                            <h3>Bed Availability</h3>
                        </div>

                        <button className="hd-view-all">
                            View All <ArrowRight size={15} />
                        </button>
                    </div>

                    <div className="hd-bed-content">

                        <div className="hd-bed-chart">
                            <div className="hd-donut">
                                <div>
                                    <strong>80%</strong>
                                    <span>Available</span>
                                </div>
                            </div>
                        </div>

                        <div className="hd-bed-legend">
                            <div>
                                <span className="green-dot" />
                                Available
                                <strong>{availableBeds}</strong>
                            </div>

                            <div>
                                <span className="blue-dot" />
                                Occupied
                                <strong>{Math.max(totalBeds - availableBeds, 0)}</strong>
                            </div>

                            <div>
                                <span className="orange-dot" />
                                Reserved
                                <strong>{beds.filter((bed) => bed.status === "RESERVED").length}</strong>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="hd-panel hd-activity-panel">

                    <div className="hd-panel-header">
                        <div>
                            <Activity size={20} />
                            <h3>Recent Emergency Activity</h3>
                        </div>

                        <button className="hd-view-all">
                            View All <ArrowRight size={15} />
                        </button>
                    </div>

                    <div className="hd-activity-list">

                        {activityData.map((activity, index) => (
                            <div className="hd-activity-item" key={index}>
                                <div className={`hd-activity-dot ${activity.type}`} />

                                <span className="hd-activity-time">
                                    {activity.time}
                                </span>

                                <div>
                                    <strong>{activity.title}</strong>
                                    <p>{activity.detail}</p>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

            </section>

            <div className="hd-demo-notice">
                <Activity size={15} />
                {loading
                    ? "Loading live hospital emergency data..."
                    : error
                        ? error
                        : `Live hospital data: ${incidents.length} incident${incidents.length === 1 ? "" : "s"} received.`}
            </div>

        </div>
    );
}
