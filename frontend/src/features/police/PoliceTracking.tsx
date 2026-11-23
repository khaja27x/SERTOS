
import { useEffect, useRef, useState } from "react";
import { importLibrary } from "@googlemaps/js-api-loader";
import {
    Ambulance,
    Clock3,
    MapPin,
    Navigation,
    Radio,
    RefreshCw,
    ShieldAlert,
    X,
} from "lucide-react";
import "./traffic-police.css";
import { api } from "../../lib/api";

type AmbulanceData = {
    id: string;
    driver: string;
    condition: string;
    lat: number;
    lng: number;
    eta: string;
    speed: number;
    priority: "High" | "Normal";
    destination: string;
};

export default function PoliceTracking() {
    const mapElementRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const markersRef = useRef<
        google.maps.marker.AdvancedMarkerElement[]
    >([]);

    const [mapReady, setMapReady] = useState(false);
    const [mapStatus, setMapStatus] = useState("Loading map...");
    const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
    const [selected, setSelected] = useState<AmbulanceData | null>(null);

    useEffect(() => {
        api.getPoliceIncidents()
            .then(async (incidents) => {
                const active = incidents.filter((incident) => !["CLOSED", "CANCELLED"].includes(incident.status));
                const records = (await Promise.all(active.map(async (incident) => {
                    const location = await api.getLocation(incident.id).catch(() => null);
                    if (!location) return null;
                    return {
                        id: incident.ambulance_vehicle_number || incident.incident_number,
                        driver: "Assigned driver",
                        condition: incident.description || "Emergency response",
                        lat: Number(location.latitude),
                        lng: Number(location.longitude),
                        eta: "Live route",
                        speed: 0,
                        priority: incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "High" : "Normal",
                        destination: incident.hospital_name || "Hospital",
                    } satisfies AmbulanceData;
                }))).filter((record): record is AmbulanceData => record !== null);
                setAmbulances(records);
                setSelected(records[0] ?? null);
            })
            .catch((error: unknown) => console.error("Unable to load police tracking:", error));
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function initializeMap() {
            try {
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

                if (!apiKey) {
                    throw new Error("Google Maps API key missing");
                }

                const [mapsLibrary, markerLibrary] = await Promise.all([
                    importLibrary("maps") as Promise<google.maps.MapsLibrary>,
                    importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
                ]);

                if (cancelled || !mapElementRef.current) return;

                const map = new mapsLibrary.Map(mapElementRef.current, {
                    center: { lat: 14.1920, lng: 79.1650 },
                    zoom: 14,
                    mapId: "DEMO_MAP_ID",
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    clickableIcons: false,
                    gestureHandling: "greedy",
                });

                mapRef.current = map;

                const bounds = new google.maps.LatLngBounds();

                ambulances.forEach((ambulance) => {
                    const markerElement = document.createElement("div");

                    markerElement.className =
                        ambulance.priority === "High"
                            ? "police-ambulance-marker high"
                            : "police-ambulance-marker normal";

                    markerElement.textContent = "🚑";
                    markerElement.title = ambulance.id;

                    const marker = new markerLibrary.AdvancedMarkerElement({
                        map,
                        position: {
                            lat: ambulance.lat,
                            lng: ambulance.lng,
                        },
                        title: ambulance.id,
                        content: markerElement,
                    });

                    marker.addListener("click", () => {
                        setSelected(ambulance);
                    });

                    markersRef.current.push(marker);

                    bounds.extend({
                        lat: ambulance.lat,
                        lng: ambulance.lng,
                    });
                });

                map.fitBounds(bounds, 65);

                if (!cancelled) {
                    setMapReady(true);
                    setMapStatus("Fleet map connected");
                }
            } catch (error) {
                console.error("Police tracking map error:", error);

                if (!cancelled) {
                    setMapStatus(
                        error instanceof Error
                            ? error.message
                            : "Unable to load map"
                    );
                }
            }
        }

        initializeMap();

        return () => {
            cancelled = true;

            markersRef.current.forEach((marker) => {
                marker.map = null;
            });

            markersRef.current = [];
            mapRef.current = null;
        };
    }, [ambulances]);

    const focusAmbulance = (ambulance: AmbulanceData) => {
        setSelected(ambulance);

        mapRef.current?.panTo({
            lat: ambulance.lat,
            lng: ambulance.lng,
        });

        mapRef.current?.setZoom(16);
    };

    const showAllAmbulances = () => {
        if (!mapRef.current) return;

        const bounds = new google.maps.LatLngBounds();

        ambulances.forEach((ambulance) => {
            bounds.extend({
                lat: ambulance.lat,
                lng: ambulance.lng,
            });
        });

        mapRef.current.fitBounds(bounds, 65);
    };

    return (
        <div className="police-tracking-page">

            {/* MAP HEADER */}

            <div className="police-tracking-header">
                <div>
                    <h1>Live Ambulance Tracking</h1>
                    <p>Monitor all active emergency vehicles.</p>
                </div>

                <div className="police-fleet-status">
                    <span className="police-live-dot" />
                    LIVE MONITORING
                </div>
            </div>

            {/* MAP AREA */}

            <section className="police-tracking-map">

                <div
                    ref={mapElementRef}
                    className="police-google-map"
                />

                {!mapReady && (
                    <div className="police-map-loading">
                        {mapStatus}
                    </div>
                )}

                {/* MAP TOP CONTROLS */}

                <div className="police-map-topbar">
                    <div className="police-map-count">
                        <Ambulance size={17} />
                        <strong>{ambulances.length} Active Ambulances</strong>
                    </div>

                    <button
                        type="button"
                        onClick={showAllAmbulances}
                        className="police-map-control"
                    >
                        <RefreshCw size={15} />
                        Show All
                    </button>
                </div>

                {/* SELECTED AMBULANCE PANEL */}

                {selected && (
                    <div className="police-selected-panel">

                        <div className="police-selected-header">
                            <div>
                                <span className="police-selected-label">
                                    SELECTED AMBULANCE
                                </span>

                                <h2>{selected.id}</h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                aria-label="Close ambulance details"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="police-selected-condition">
                            <ShieldAlert size={16} />
                            {selected.condition}
                        </div>

                        <div className="police-selected-details">
                            <div>
                                <span>Driver</span>
                                <strong>{selected.driver}</strong>
                            </div>

                            <div>
                                <span>ETA</span>
                                <strong>{selected.eta}</strong>
                            </div>

                            <div>
                                <span>Speed</span>
                                <strong>{selected.speed} km/h</strong>
                            </div>

                            <div>
                                <span>Priority</span>
                                <strong
                                    className={
                                        selected.priority === "High"
                                            ? "police-high-text"
                                            : "police-normal-text"
                                    }
                                >
                                    {selected.priority}
                                </strong>
                            </div>
                        </div>

                        <div className="police-selected-destination">
                            <MapPin size={15} />
                            {selected.destination}
                        </div>

                        <button
                            type="button"
                            className="police-focus-button"
                            onClick={() => focusAmbulance(selected)}
                        >
                            <Navigation size={15} />
                            Focus on Ambulance
                        </button>
                    </div>
                )}

                {/* MAP BOTTOM STATUS */}

                <div className="police-map-footer">
                    <span>
                        <Radio size={14} />
                        {mapReady ? "Map connected" : mapStatus}
                    </span>

                    <span>
                        <Clock3 size={14} />
                        Live GPS data
                    </span>
                </div>
            </section>

            {/* AMBULANCE LIST */}

            <section className="police-fleet-panel">

                <div className="police-fleet-heading">
                    <div>
                        <h2>Active Ambulances</h2>
                        <p>Select an ambulance to locate it on the map.</p>
                    </div>

                    <span>{ambulances.length} Vehicles</span>
                </div>

                <div className="police-fleet-list">
                    {ambulances.map((ambulance) => (
                        <button
                            type="button"
                            key={ambulance.id}
                            className={`police-fleet-item ${selected?.id === ambulance.id ? "selected" : ""
                                }`}
                            onClick={() => focusAmbulance(ambulance)}
                        >
                            <div className="police-fleet-icon">
                                <Ambulance size={21} />
                            </div>

                            <div className="police-fleet-info">
                                <strong>{ambulance.id}</strong>
                                <span>{ambulance.condition}</span>
                            </div>

                            <div className="police-fleet-meta">
                                <strong>{ambulance.eta}</strong>
                                <span>{ambulance.priority}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
