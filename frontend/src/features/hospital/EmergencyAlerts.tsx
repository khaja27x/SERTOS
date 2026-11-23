
import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Ambulance,
    BedDouble,
    CheckCircle2,
    Clock3,
    MapPin,
    Phone,
    UserRound,
    X,
    XCircle,
    HeartPulse,
    Activity,
    ShieldAlert,
} from "lucide-react";
import "./hospital.css";
import { api, type Incident } from "../../lib/api";

type EmergencyStatus = "Awaiting Response" | "Accepted" | "Rejected";

type EmergencyCase = {
    id: string;
    patientName: string;
    patientId: string;
    age: number;
    gender: string;
    condition: string;
    severity: "Critical" | "High" | "Moderate";
    symptoms: string[];
    medicalSummary: string;
    ambulanceId: string;
    driverName: string;
    driverPhone: string;
    eta: string;
    distance: string;
    bedType: string;
    assignedAt: string;
    status: EmergencyStatus;
    rejectionReason?: string;
};

function EmergencyAlerts() {
    const [cases, setCases] = useState<EmergencyCase[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState("");
    const [rejectingCaseId, setRejectingCaseId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        api.getHospitalIncidents()
            .then((incidents) => {
                const mapped = incidents.map((incident: Incident): EmergencyCase => ({
                    id: incident.id,
                    patientName: "Emergency patient",
                    patientId: incident.incident_number,
                    age: 0,
                    gender: "Unknown",
                    condition: incident.description || "Emergency response required",
                    severity: incident.severity === "CRITICAL" ? "Critical" : incident.severity === "HIGH" ? "High" : "Moderate",
                    symptoms: [incident.status_display || incident.status],
                    medicalSummary: incident.description || "No clinical summary provided.",
                    ambulanceId: incident.ambulance_vehicle_number || "Unassigned",
                    driverName: "Assigned driver",
                    driverPhone: "",
                    eta: "Live route",
                    distance: "Tracking available",
                    bedType: "Hospital triage",
                    assignedAt: incident.created_at,
                    status: "Awaiting Response",
                }));
                setCases(mapped);
                if (mapped[0]) setSelectedCaseId(mapped[0].id);
            })
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load hospital alerts."));
    }, []);

    const selectedCase =
        cases.find((item) => item.id === selectedCaseId) ?? cases[0];

    const pendingCount = cases.filter(
        (item) => item.status === "Awaiting Response"
    ).length;

    const acceptedCount = cases.filter(
        (item) => item.status === "Accepted"
    ).length;

    const acceptCase = async (caseId: string) => {
        await api.decideHospitalIncident(caseId, "ACCEPTED");
        setCases((current) =>
            current.map((item) =>
                item.id === caseId
                    ? { ...item, status: "Accepted" }
                    : item
            )
        );
    };

    const rejectCase = async (caseId: string) => {
        if (!rejectionReason.trim()) return;
        await api.decideHospitalIncident(caseId, "REJECTED", rejectionReason);

        setCases((current) =>
            current.map((item) =>
                item.id === caseId
                    ? {
                        ...item,
                        status: "Rejected",
                        rejectionReason: rejectionReason.trim(),
                    }
                    : item
            )
        );

        setRejectingCaseId(null);
        setRejectionReason("");
    };

    if (!selectedCase) {
        return (
            <div className="hd-dashboard">
                <h1>Emergency Alerts</h1>
                <p>{error || "No emergency cases are currently assigned to this hospital."}</p>
            </div>
        );
    }

    return (
        <div className="hd-dashboard hea-page">
            <div className="hd-page-heading">
                <div>
                    <div className="hd-breadcrumb">Hospital / Emergency Alerts</div>
                    <h1>Emergency Alerts</h1>
                    <p>Review AI-assigned emergency cases and respond to incoming patients.</p>
                </div>

                <div className="hea-live-indicator">
                    <span />
                    Assigned cases only
                </div>
            </div>

            <div className="hea-summary-grid">
                <div className="hea-summary-card">
                    <div className="hea-summary-icon pending"><AlertTriangle size={21} /></div>
                    <div>
                        <span>Awaiting Response</span>
                        <strong>{pendingCount.toString().padStart(2, "0")}</strong>
                    </div>
                </div>
                <div className="hea-summary-card">
                    <div className="hea-summary-icon accepted"><CheckCircle2 size={21} /></div>
                    <div>
                        <span>Accepted Cases</span>
                        <strong>{acceptedCount.toString().padStart(2, "0")}</strong>
                    </div>
                </div>
                <div className="hea-summary-card">
                    <div className="hea-summary-icon critical"><ShieldAlert size={21} /></div>
                    <div>
                        <span>Critical Cases</span>
                        <strong>
                            {cases.filter((item) => item.severity === "Critical" && item.status === "Awaiting Response").length
                                .toString().padStart(2, "0")}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="hea-layout">
                <section className="hea-list-panel">
                    <div className="hea-section-heading">
                        <div>
                            <h2>Incoming Cases</h2>
                            <p>AI-selected for City Care Hospital</p>
                        </div>
                        <span className="hea-count">{cases.length} cases</span>
                    </div>

                    <div className="hea-case-list">
                        {cases.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                className={`hea-case-item ${selectedCaseId === item.id ? "selected" : ""}`}
                                onClick={() => setSelectedCaseId(item.id)}
                            >
                                <div className="hea-case-top">
                                    <span className="hea-case-id">{item.id}</span>
                                    <span className={`hea-severity ${item.severity.toLowerCase()}`}>
                                        {item.severity}
                                    </span>
                                </div>
                                <strong>{item.patientName}</strong>
                                <span className="hea-condition">{item.condition}</span>
                                <div className="hea-case-bottom">
                                    <span><Ambulance size={14} /> {item.ambulanceId}</span>
                                    <span><Clock3 size={14} /> ETA {item.eta}</span>
                                </div>
                                <div className={`hea-case-status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>
                                    {item.status}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="hea-details-panel">
                    <div className="hea-detail-header">
                        <div>
                            <span className="hea-overline">EMERGENCY CASE DETAILS</span>
                            <h2>{selectedCase.id}</h2>
                        </div>
                        <span className={`hea-severity ${selectedCase.severity.toLowerCase()}`}>
                            {selectedCase.severity} Priority
                        </span>
                    </div>

                    <div className="hea-patient-banner">
                        <div className="hea-patient-avatar"><UserRound size={26} /></div>
                        <div>
                            <h3>{selectedCase.patientName}</h3>
                            <p>{selectedCase.patientId} · {selectedCase.age} years · {selectedCase.gender}</p>
                        </div>
                        <span className={`hea-case-status ${selectedCase.status.toLowerCase().replaceAll(" ", "-")}`}>
                            {selectedCase.status}
                        </span>
                    </div>

                    <div className="hea-condition-box">
                        <div className="hea-condition-icon"><HeartPulse size={21} /></div>
                        <div>
                            <span>Reported Medical Condition</span>
                            <strong>{selectedCase.condition}</strong>
                        </div>
                    </div>

                    <div className="hea-detail-section">
                        <h3><Activity size={17} /> Reported Symptoms</h3>
                        <div className="hea-symptoms">
                            {selectedCase.symptoms.map((symptom) => (
                                <span key={symptom}>{symptom}</span>
                            ))}
                        </div>
                    </div>

                    <div className="hea-detail-section">
                        <h3>AI Clinical Summary</h3>
                        <p className="hea-medical-summary">{selectedCase.medicalSummary}</p>
                        <p className="hea-ai-disclaimer">
                            AI-generated support summary. Hospital clinicians must independently assess the patient.
                        </p>
                    </div>

                    <div className="hea-detail-section">
                        <h3><BedDouble size={17} /> Required Hospital Resources</h3>
                        <div className="hea-resource-row">
                            <span>Recommended care</span>
                            <strong>{selectedCase.bedType}</strong>
                        </div>
                        <div className="hea-resource-row">
                            <span>Hospital assignment</span>
                            <strong>City Care Hospital</strong>
                        </div>
                    </div>

                    <div className="hea-ambulance-box">
                        <div className="hea-ambulance-heading">
                            <h3><Ambulance size={18} /> Assigned Ambulance</h3>
                            <span>AI assigned</span>
                        </div>
                        <div className="hea-ambulance-details">
                            <div>
                                <span>Vehicle</span>
                                <strong>{selectedCase.ambulanceId}</strong>
                            </div>
                            <div>
                                <span>Driver</span>
                                <strong>{selectedCase.driverName}</strong>
                            </div>
                            <div>
                                <span>Distance</span>
                                <strong>{selectedCase.distance}</strong>
                            </div>
                            <div>
                                <span>Estimated arrival</span>
                                <strong className="hea-eta">{selectedCase.eta}</strong>
                            </div>
                        </div>
                        <div className="hea-location-row">
                            <MapPin size={15} />
                            Ambulance location and route are available in Ambulance Tracking after acceptance.
                        </div>
                        <a className="hea-call-driver" href={`tel:${selectedCase.driverPhone.replaceAll(" ", "")}`}>
                            <Phone size={15} /> Contact Driver
                        </a>
                    </div>

                    {selectedCase.rejectionReason && (
                        <div className="hea-rejection-note">
                            <strong>Rejection reason:</strong> {selectedCase.rejectionReason}
                        </div>
                    )}

                    {selectedCase.status === "Awaiting Response" ? (
                        <div className="hea-action-area">
                            <p>Confirm that your hospital can receive this patient and arrange the required bed.</p>
                            <div className="hea-action-buttons">
                                <button
                                    type="button"
                                    className="hea-accept-button"
                                    onClick={() => acceptCase(selectedCase.id)}
                                >
                                    <CheckCircle2 size={17} /> Accept & Confirm Bed
                                </button>
                                <button
                                    type="button"
                                    className="hea-reject-button"
                                    onClick={() => {
                                        setRejectingCaseId(selectedCase.id);
                                        setRejectionReason("");
                                    }}
                                >
                                    <XCircle size={17} /> Reject Case
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`hea-response-message ${selectedCase.status.toLowerCase()}`}>
                            {selectedCase.status === "Accepted" ? (
                                <><CheckCircle2 size={19} /> Case accepted in this prototype. Bed confirmation still needs backend integration.</>
                            ) : (
                                <><XCircle size={19} /> Case rejected. Hospital operations have been notified.</>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {rejectingCaseId && (
                <div className="hea-modal-overlay" role="presentation">
                    <div className="hea-reject-modal" role="dialog" aria-modal="true" aria-labelledby="hea-reject-title">
                        <button
                            type="button"
                            className="hea-modal-close"
                            onClick={() => setRejectingCaseId(null)}
                            aria-label="Close rejection dialog"
                        >
                            <X size={19} />
                        </button>
                        <div className="hea-modal-icon"><AlertTriangle size={23} /></div>
                        <h2 id="hea-reject-title">Reject Emergency Case?</h2>
                        <p>Please provide a reason so SERTOS can seek another suitable hospital.</p>
                        <label htmlFor="hea-rejection-reason">Reason for rejection</label>
                        <select
                            id="hea-rejection-reason"
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.target.value)}
                        >
                            <option value="">Select a reason</option>
                            <option value="No suitable bed available">No suitable bed available</option>
                            <option value="Required specialist unavailable">Required specialist unavailable</option>
                            <option value="Emergency department at capacity">Emergency department at capacity</option>
                            <option value="Required medical equipment unavailable">Required medical equipment unavailable</option>
                            <option value="Other operational reason">Other operational reason</option>
                        </select>
                        <div className="hea-modal-actions">
                            <button type="button" onClick={() => setRejectingCaseId(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!rejectionReason}
                                onClick={() => rejectCase(rejectingCaseId)}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="hb-demo-note">{error}</div>}
        </div>
    );
}

export default EmergencyAlerts;
