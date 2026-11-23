
import { useEffect, useRef, useState } from 'react'
import { importLibrary } from '@googlemaps/js-api-loader'
import { api } from '../../lib/api'
import {
    Hospital,
    Navigation,
    MapPin,
    Clock3,
    CarFront,
    LocateFixed,
    Loader2,
} from 'lucide-react'

interface RoutePageProps {
    incidentId?: string
    onStartNavigation: () => void
}

type Coordinates = {
    lat: number
    lng: number
}

const DEFAULT_CENTER: Coordinates = {
    lat: 20.5937,
    lng: 78.9629,
}

function RoutePage({ incidentId, onStartNavigation }: RoutePageProps) {
    const mapElementRef = useRef<HTMLDivElement | null>(null)

    const mapRef = useRef<google.maps.Map | null>(null)

    const ambulanceMarkerRef =
        useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

    const AdvancedMarkerRef =
        useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null)

    const watchIdRef = useRef<number | null>(null)

    const [position, setPosition] = useState<Coordinates | null>(null)
    const [gpsStatus, setGpsStatus] = useState('Waiting for GPS')
    const [mapStatus, setMapStatus] = useState('Loading Google Maps...')
    const [mapReady, setMapReady] = useState(false)
    const [route, setRoute] = useState<{ distance_km: number; duration_formatted: string } | null>(null)

    // =================================
    // INITIALIZE GOOGLE MAP
    // =================================

    useEffect(() => {
        let cancelled = false

        const initializeMap = async () => {
            try {
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

                if (!apiKey) {
                    throw new Error('Google Maps API key is missing in .env')
                }

                // Load Maps and Advanced Marker libraries.
                // setOptions() is already configured once in index.js.

                const [mapsLibrary, markerLibrary] = await Promise.all([
                    importLibrary('maps') as Promise<google.maps.MapsLibrary>,
                    importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
                ])

                if (cancelled || !mapElementRef.current) return

                AdvancedMarkerRef.current =
                    markerLibrary.AdvancedMarkerElement

                const map = new mapsLibrary.Map(mapElementRef.current, {
                    center: DEFAULT_CENTER,
                    zoom: 5,

                    // Required for AdvancedMarkerElement.
                    mapId: 'DEMO_MAP_ID',

                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    clickableIcons: false,
                    gestureHandling: 'greedy',
                })

                mapRef.current = map

                setMapReady(true)
                setMapStatus('Google Maps connected')

            } catch (error) {
                console.error('Google Maps initialization error:', error)

                if (!cancelled) {
                    setMapStatus(
                        error instanceof Error
                            ? error.message
                            : 'Unable to load Google Maps'
                    )
                }
            }
        }

        initializeMap()

        return () => {
            cancelled = true
            mapRef.current = null
            AdvancedMarkerRef.current = null
            setMapReady(false)
        }
    }, [])

    // =================================
    // LIVE AMBULANCE GPS TRACKING
    // =================================

    useEffect(() => {
        if (!mapReady || !mapRef.current) return

        if (!navigator.geolocation) {
            setGpsStatus('GPS not supported by browser')
            return
        }

        setGpsStatus('Requesting GPS permission...')

        const watchId = navigator.geolocation.watchPosition(
            (location) => {
                const currentPosition: Coordinates = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                }

                setPosition(currentPosition)
                setGpsStatus('GPS connected')
                if (incidentId) {
                    api.sendLocation(incidentId, currentPosition.lat, currentPosition.lng)
                        .catch((error: unknown) => console.error('GPS update failed:', error))
                    api.getRoute(incidentId)
                        .then(setRoute)
                        .catch(() => undefined)
                }

                const map = mapRef.current
                const MarkerClass = AdvancedMarkerRef.current

                if (!map || !MarkerClass) return

                // Keep the map centered on the ambulance.
                map.panTo(currentPosition)
                map.setZoom(16)

                if (!ambulanceMarkerRef.current) {
                    // Create ambulance image.
                    const ambulanceImage = document.createElement('img')

                    ambulanceImage.src = '/ambulance.png'
                    ambulanceImage.alt = 'Ambulance'
                    ambulanceImage.style.width = '55px'
                    ambulanceImage.style.height = '55px'
                    ambulanceImage.style.objectFit = 'contain'
                    ambulanceImage.draggable = false

                    // Create modern Advanced Marker.
                    const marker = new MarkerClass({
                        map,
                        position: currentPosition,
                        title: 'Ambulance - Live Location',
                        zIndex: 1000,
                        anchorLeft: '-50%',
                        anchorTop: '-50%',
                    })

                    marker.append(ambulanceImage)

                    ambulanceMarkerRef.current = marker

                } else {
                    // Update existing marker instead of creating
                    // a new marker for every GPS update.
                    ambulanceMarkerRef.current.position = currentPosition
                }
            },

            (error) => {
                console.error('GPS error:', error)

                const messages: Record<number, string> = {
                    1: 'GPS permission denied',
                    2: 'GPS position unavailable',
                    3: 'GPS request timed out',
                }

                setGpsStatus(
                    messages[error.code] || 'Unable to access GPS'
                )
            },

            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 15000,
            }
        )

        watchIdRef.current = watchId

        return () => {
            navigator.geolocation.clearWatch(watchId)
            watchIdRef.current = null
        }
    }, [mapReady, incidentId])

    // =================================
    // CLEANUP AMBULANCE MARKER
    // =================================

    useEffect(() => {
        return () => {
            if (ambulanceMarkerRef.current) {
                ambulanceMarkerRef.current.map = null
                ambulanceMarkerRef.current = null
            }
        }
    }, [])

    // =================================
    // RECENTER MAP
    // =================================

    const recenterMap = () => {
        if (!position || !mapRef.current) {
            setGpsStatus('Waiting for GPS location...')
            return
        }

        mapRef.current.panTo(position)
        mapRef.current.setZoom(17)
    }

    // =================================
    // UI
    // =================================

    return (
        <div className="w-full max-w-lg mx-auto h-[calc(100dvh-164px)] min-h-[360px] max-h-[850px] px-3 pt-2 pb-2 flex flex-col gap-2.5">

            {/* DESTINATION AND ETA */}

            <section className="shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <Hospital size={23} className="text-red-600" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wide font-bold text-slate-500">
                        Emergency Destination
                    </p>

                    <h2 className="text-sm font-bold text-[#10264D] truncate mt-0.5">
                        {route ? 'Emergency destination' : 'Hospital route pending'}
                    </h2>

                    <p className="text-[10px] text-slate-400">
                        {route ? 'Live route connected' : 'Waiting for GPS location'}
                    </p>
                </div>

                <div className="border-l border-slate-200 pl-3 text-center shrink-0">
                    <p className="text-[10px] font-semibold text-slate-500">
                        ETA
                    </p>

                    <p className="text-xl font-extrabold text-red-600">
                        {route?.duration_formatted ?? '-- min'}
                    </p>
                </div>

            </section>

            {/* GOOGLE MAP */}

            <section className="relative flex-1 min-h-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-[#E8F0E8] shadow-sm">

                <div
                    ref={mapElementRef}
                    className="absolute inset-0 w-full h-full"
                />

                {/* MAP STATUS */}

                <div className="absolute top-3 left-3 bg-white/95 rounded-lg px-2.5 py-1.5 shadow-sm pointer-events-none">

                    <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin size={12} className="text-blue-600" />
                        GOOGLE MAPS
                    </p>

                </div>

                {/* GPS STATUS */}

                <div className="absolute bottom-3 left-3 bg-white/95 rounded-lg px-2.5 py-1.5 shadow-md pointer-events-none">

                    <p className="text-[10px] font-semibold text-slate-700 flex items-center gap-1.5">

                        <span
                            className={`w-2 h-2 rounded-full ${position
                                    ? 'bg-green-500'
                                    : 'bg-amber-500 animate-pulse'
                                }`}
                        />

                        {gpsStatus}

                    </p>

                </div>

                {/* RECENTER BUTTON */}

                <button
                    type="button"
                    onClick={recenterMap}
                    className="absolute bottom-3 right-3 bg-white w-10 h-10 rounded-full shadow-md flex items-center justify-center active:scale-95"
                    aria-label="Center on ambulance location"
                >
                    <LocateFixed size={20} className="text-blue-600" />
                </button>

                {/* LOADING INDICATOR */}

                {!mapReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 pointer-events-none">
                        <div className="text-center">
                            <Loader2
                                className="animate-spin mx-auto text-blue-600"
                                size={27}
                            />

                            <p className="text-xs font-semibold text-slate-600 mt-2">
                                {mapStatus}
                            </p>
                        </div>
                    </div>
                )}

            </section>

            {/* DISTANCE AND ETA */}

            <section className="shrink-0 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3">

                <div className="flex items-center justify-around">

                    <div className="flex items-center gap-2.5">
                        <CarFront size={23} className="text-[#10264D]" />

                        <div>
                            <p className="text-[10px] text-slate-500">
                                Distance
                            </p>

                            <p className="text-sm font-bold text-[#10264D]">
                                {route ? `${route.distance_km.toFixed(1)} km` : '--'}
                            </p>
                        </div>
                    </div>

                    <div className="h-9 w-px bg-slate-200" />

                    <div className="flex items-center gap-2.5">
                        <Clock3 size={22} className="text-[#10264D]" />

                        <div>
                            <p className="text-[10px] text-slate-500">
                                ETA
                            </p>

                            <p className="text-sm font-bold text-[#10264D]">
                                {route?.duration_formatted ?? '--'}
                            </p>
                        </div>
                    </div>

                </div>

            </section>

            {/* START NAVIGATION */}

            <button
                type="button"
                onClick={onStartNavigation}
                disabled={!position}
                className="shrink-0 w-full bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-400 active:scale-[0.98] text-white rounded-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all"
            >
                <Navigation size={18} />
                Start Navigation
            </button>

        </div>
    )
}

export default RoutePage
