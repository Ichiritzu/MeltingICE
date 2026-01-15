'use client';

import { useEffect, useRef, useState } from 'react';
import type { PublicReport } from '@/lib/api';
import { Locate, List, X, MapPin, Clock, Camera, Lock, Unlock } from 'lucide-react';

const tagLabels: Record<string, string> = {
    vehicle: 'Vehicle',
    checkpoint: 'Checkpoint',
    detention: 'Detention',
    raid: 'Raid',
    unknown: 'Activity',
};

// Vibrant, distinct colors for map markers and legend
const tagColors: Record<string, string> = {
    vehicle: '#f97316',      // Vibrant orange
    checkpoint: '#eab308',   // Bright yellow
    detention: '#8b5cf6',    // Purple
    raid: '#ef4444',         // Red
    unknown: '#06b6d4',      // Cyan
};

interface LeafletMapProps {
    reports: PublicReport[];
    center?: [number, number];
    zoom?: number;
    height?: string;
    onReportClick?: (report: PublicReport) => void;
}

export default function LeafletMap({
    reports,
    center = [39.8283, -98.5795],
    zoom = 4,
    height = '100%',
    onReportClick,
}: LeafletMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [locating, setLocating] = useState(false);
    const [showHud, setShowHud] = useState(false);
    const [isLocked, setIsLocked] = useState(true); // Default to locked (no drag) on mobile logic
    const [isMobile, setIsMobile] = useState(false); // Track if we're on mobile

    // Create a stable key from report IDs to prevent unnecessary reinitializations
    const reportsKey = reports.map(r => r.id).join(',');

    const markersRef = useRef<{ [key: string]: any }>({});

    // Fly to specific coordinates
    const flyTo = (coords: [number, number], zoomLevel: number = 14) => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(coords, zoomLevel, {
                animate: true,
                duration: 1.5,
            });
        }
    };

    // Locate user function with flyTo
    const locateUser = async () => {
        if (!navigator.geolocation || !mapInstanceRef.current) return;
        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];

                // Add user marker dynamically
                const L = (await import('leaflet')).default;

                // Remove old marker if exists
                if (userMarkerRef.current) {
                    userMarkerRef.current.remove();
                }

                const userIcon = L.divIcon({
                    className: 'custom-marker',
                    html: '<div class="user-location-marker" style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                });
                userMarkerRef.current = L.marker(coords, { icon: userIcon }).addTo(mapInstanceRef.current);

                flyTo(coords, 12);
                setLocating(false);
            },
            (err) => {
                console.error('Geolocation error:', err);
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Fly to report and open popup
    const flyToReport = (report: PublicReport) => {
        flyTo([report.lat_approx, report.lng_approx], 14);
        setShowHud(false);

        // Open the popup for this marker
        const marker = markersRef.current[report.id];
        if (marker) {
            marker.openPopup();
        }
    };

    // Helper for relative time
    const getTimeAgo = (dateString: string): string => {
        const isoString = dateString.replace(' ', 'T') + 'Z';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        if (isNaN(date.getTime())) return '';
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 5) return 'now';
        if (diffMins < 60) return `${diffMins} m`;
        if (diffHours < 24) return `${diffHours} h`;
        if (diffDays === 1) return '1d';
        return `${diffDays} d`;
    };

    // Track what reports key was last initialized
    const initializedKeyRef = useRef<string>('');



    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current) return;

        // Skip reinitialization if map already exists and data hasn't changed
        if (mapInstanceRef.current && initializedKeyRef.current === reportsKey) {
            return;
        }

        const initMap = async () => {
            try {
                const L = (await import('leaflet')).default;
                // css moved to layout

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                }

                // Clear markers ref
                markersRef.current = {};

                const map = L.map(mapRef.current!, {
                    center: center,
                    zoom: zoom,
                    scrollWheelZoom: true,
                    zoomControl: false,
                    preferCanvas: true,          // Use canvas for better performance
                    fadeAnimation: false,        // Disable fade for snappier feel
                    markerZoomAnimation: true,   // Keep marker animation smooth
                    zoomAnimation: true,
                });

                mapInstanceRef.current = map;

                L.control.zoom({ position: 'bottomright' }).addTo(map);

                // MapLibre GL Vector Tiles - allows customizable text size
                const maplibregl = await import('maplibre-gl');
                const { default: maplibreGLLeaflet } = await import('@maplibre/maplibre-gl-leaflet');

                // Import MapLibre CSS
                if (!document.getElementById('maplibre-css')) {
                    const link = document.createElement('link');
                    link.id = 'maplibre-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css';
                    document.head.appendChild(link);
                }

                // Use Stadia Maps Alidade Smooth (free, vibrant colors with open vector tiles)
                try {
                    // Use OSM Bright style - colorful with all icons included
                    const styleUrl = 'https://tiles.stadiamaps.com/styles/osm_bright.json';

                    // Add the MapLibre GL layer to Leaflet
                    const glLayer = (L as any).maplibreGL({
                        style: styleUrl,
                        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
                    });
                    glLayer.addTo(map);

                    // After style loads, increase text sizes
                    const glMap = glLayer.getMaplibreMap();
                    glMap.on('style.load', () => {
                        const style = glMap.getStyle();
                        if (style && style.layers) {
                            style.layers.forEach((layer: any) => {
                                if (layer.type === 'symbol' && layer.layout) {
                                    try {
                                        const currentSize = glMap.getLayoutProperty(layer.id, 'text-size');
                                        if (typeof currentSize === 'number') {
                                            glMap.setLayoutProperty(layer.id, 'text-size', Math.round(currentSize * 1.4));
                                        }
                                    } catch (e) {
                                        // Some layers may not support this, ignore
                                    }
                                }
                            });
                        }
                    });
                } catch (error) {
                    console.warn('Vector tiles failed to load, falling back to raster tiles:', error);
                    // Fallback to OSM raster tiles
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19,
                    }).addTo(map);
                }

                // Disable drag/scroll on mobile initially
                if (L.Browser.mobile) {
                    map.dragging.disable();
                    map.scrollWheelZoom.disable();
                    if ((map as any).tap) (map as any).tap.disable(); // Ensure tap interaction is disabled
                    setIsLocked(true);
                    setIsMobile(true);
                } else {
                    // Start unlocked on desktop
                    setIsLocked(false);
                    setIsMobile(false);
                }

                // Custom popup styles
                if (!document.getElementById('map-popup-styles')) {
                    const style = document.createElement('style');
                    style.id = 'map-popup-styles';
                    style.textContent = `
    .leaflet - popup - content - wrapper {
    background: rgba(24, 24, 27, 0.95)!important;
    color: #fff!important;
    border - radius: 12px!important;
    border: 1px solid rgba(255, 255, 255, 0.1)!important;
    box - shadow: 0 10px 40px rgba(0, 0, 0, 0.5)!important;
    font - size: 14px; /* Adjusted font size */
}
                        .leaflet - popup - tip {
    background: rgba(24, 24, 27, 0.95)!important;
}
                        .leaflet - popup - close - button {
    color: #fff!important;
    font - size: 18px; /* Adjusted font size */
}
                        .custom - marker { background: none; border: none; }
                        .marker - pulse { animation: pulse 2s ease - out infinite; }
@keyframes pulse {
    0 % { box- shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
}
70 % { box- shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
100 % { box- shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                        }
                        .user - location - marker {
    background: #3b82f6;
    border: 3px solid white;
    border - radius: 50 %;
    box - shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
}
`;
                    document.head.appendChild(style);
                }

                // Add markers
                reports.forEach((report) => {
                    const color = tagColors[report.tag] || tagColors.unknown;
                    const label = tagLabels[report.tag] || 'Activity';

                    // Flattened HTML string to prevent text rendering issues
                    const markerHtml = `<div class="marker-pulse" style="width: 24px; height: 24px; background: ${color}; border: 3px solid rgba(255,255,255,0.9); border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer;"></div>`;

                    const icon = L.divIcon({
                        className: 'custom-marker',
                        html: markerHtml,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                    });

                    const marker = L.marker([report.lat_approx, report.lng_approx], { icon });

                    const isoTime = report.event_time_bucket.replace(' ', 'T') + 'Z';
                    const eventDate = new Date(isoTime);

                    const popupContent = `
                        <div style="min-width: 220px; max-width: 300px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                <span style="padding: 4px 10px; background: ${color}; color: white; border-radius: 6px; font-size: 13px; font-weight: 700; text-transform: uppercase;">${label}</span>
                                ${report.image_url ? '<span style="font-size: 18px;">📷</span>' : ''}
                            </div>
                            ${report.image_url ? `<img src="${report.image_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" />` : ''}
                            <p style="font-size: 15px; line-height: 1.4; margin: 0 0 12px 0; color: #fff; font-weight: 500;">${report.summary}</p>
                            <div style="font-size: 13px; color: #a1a1aa;">
                                <div style="margin-bottom: 2px;">📍 ${report.city || 'Unknown'}, ${report.state || ''}</div>
                                <div>🕐 ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                    `;

                    marker.bindPopup(popupContent, { closeButton: true });
                    if (onReportClick) marker.on('click', () => onReportClick(report));
                    marker.addTo(map);

                    // Store marker reference
                    markersRef.current[report.id] = marker;
                });

                // Fit bounds
                if (reports.length > 0) {
                    const bounds = L.latLngBounds(reports.map(r => [r.lat_approx, r.lng_approx] as [number, number]));
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                }

                setIsLoaded(true);
                initializedKeyRef.current = reportsKey; // Mark as initialized with this key
            } catch (error) {
                console.error('Failed to load map:', error);
            }
        };

        initMap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportsKey, center, zoom]); // Use reportsKey instead of reports to prevent reinit

    const toggleLock = (e?: React.MouseEvent | React.TouchEvent) => {
        if (e) e.stopPropagation();
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        if (isLocked) {
            // Unlock - Enable everything
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            if ((map as any).tap) (map as any).tap.enable();
            setIsLocked(false);
        } else {
            // Lock - Disable everything
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            if ((map as any).tap) (map as any).tap.disable();
            setIsLocked(true);
        }
    };

    // Enable drag on click/interaction for mobile if needed, but respect lock
    const enableInteraction = () => {
        // If locked, do NOTHING. User must explicitly unlock.
        if (isLocked) return;

        if (mapInstanceRef.current && !mapInstanceRef.current.dragging.enabled()) {
            mapInstanceRef.current.dragging.enable();
        }
    };

    return (
        <div className="relative" style={{ height }} onClick={enableInteraction} onTouchStart={enableInteraction}>
            <div
                ref={mapRef}
                style={{ height: '100%', width: '100%', background: '#aad3df' }}
                className="rounded-xl overflow-hidden border border-white/10"
            >
                {!isLoaded && (
                    <div className="h-full w-full flex items-center justify-center text-zinc-500">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-zinc-600 border-t-red-500 rounded-full animate-spin"></div>
                            <span>Loading map...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Control buttons - top right - Hidden on mobile when HUD is open */}
            {isLoaded && (
                <div className={`absolute top-4 right-3 z-[2000] flex flex-col gap-2 pointer-events-none ${showHud ? 'hidden sm:flex' : ''}`}> {/* Container ignores clicks */}
                    {/* Locate Me Button */}
                    <button
                        onClick={locateUser}
                        disabled={locating}
                        className="pointer-events-auto bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 rounded-lg p-2.5 text-white shadow-lg backdrop-blur-sm transition-colors disabled:opacity-50"
                        title="Find my location"
                    >
                        {locating ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Locate className="w-5 h-5" />
                        )}
                    </button>

                    {/* Scroll Lock Toggle - Mobile Only */}
                    {isMobile && (
                        <div className="relative pointer-events-auto">
                            <button
                                onClick={toggleLock}
                                className={`border rounded-lg p-2.5 shadow-lg backdrop-blur-sm transition-colors ${isLocked
                                    ? 'bg-red-500/90 hover:bg-red-600 border-red-500 text-white'
                                    : 'bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-white'
                                    }`}
                            >
                                {isLocked ? (
                                    <Lock className="w-5 h-5" />
                                ) : (
                                    <Unlock className="w-5 h-5" />
                                )}
                            </button>
                            {/* Tooltip - Only visible when locked */}
                            {isLocked && (
                                <div className="absolute right-[120%] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-black/90 text-white text-xs font-medium rounded-md whitespace-nowrap pointer-events-none border border-white/10 shadow-xl z-50 animate-pulse">
                                    Tap to Unlock
                                    {/* Arrow pointing to button */}
                                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-black/90"></div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Toggle Report List HUD */}
                    {reports.length > 0 && (
                        <button
                            onClick={() => setShowHud(!showHud)}
                            className={`pointer-events-auto bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 rounded-lg p-2.5 text-white shadow-lg backdrop-blur-sm transition-colors ${showHud ? 'bg-[#5ecfcf]/20 border-[#5ecfcf]/30' : ''}`}
                            title="Show report list"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Help Overlay */}
            <div
                id="map-help-dialog"
                style={{ display: 'none' }}
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 text-center animate-in fade-in duration-200"
                onClick={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            >
                <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-white mb-4">Map Controls</h3>
                    <div className="space-y-4 text-left text-sm text-zinc-300">
                        <div className="flex items-start gap-3">
                            <div className="bg-zinc-800 p-2 rounded-lg">👆</div>
                            <div>
                                <strong className="text-white block mb-0.5">Move Map</strong>
                                Tap the map once to enable dragging.
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-zinc-800 p-2 rounded-lg">✌️</div>
                            <div>
                                <strong className="text-white block mb-0.5">Zoom</strong>
                                Use two fingers to zoom in and out.
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-zinc-800 p-2 rounded-lg">📍</div>
                            <div>
                                <strong className="text-white block mb-0.5">Details</strong>
                                Tap any marker to see incident details.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const helpDialog = document.getElementById('map-help-dialog');
                            if (helpDialog) helpDialog.style.display = 'none';
                        }}
                        className="mt-6 w-full bg-white text-black font-bold py-2.5 rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>

            {/* Report List HUD - Desktop left, Mobile bottom sheet style */}
            {isLoaded && showHud && reports.length > 0 && (
                <div className="absolute inset-x-3 bottom-20 sm:bottom-auto sm:inset-x-auto sm:top-4 sm:left-4 sm:w-80 z-10 bg-zinc-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-sm max-h-[50vh] sm:max-h-[calc(100%-2rem)] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0">
                        <span className="text-sm font-semibold text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-400" />
                            Reports ({reports.length})
                        </span>
                        <button onClick={() => setShowHud(false)} className="text-zinc-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {reports.map((report) => (
                            <button
                                key={report.id}
                                onClick={() => flyToReport(report)}
                                className="w-full text-left px-3 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Image thumbnail or colored dot - Smaller on mobile */}
                                    {report.image_url ? (
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                                            <img
                                                src={report.image_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                                            style={{ background: `${tagColors[report.tag] || tagColors.unknown}20` }}
                                        >
                                            <div
                                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                                                style={{ background: tagColors[report.tag] || tagColors.unknown }}
                                            />
                                        </div>
                                    )}
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="text-sm font-medium text-white truncate max-w-[120px] sm:max-w-none">
                                                {report.city || 'Unknown'}, {report.state || '??'}
                                            </p>
                                            <span className="text-[10px] text-zinc-500 flex-shrink-0">
                                                {getTimeAgo(report.event_time_bucket)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                                                style={{ background: tagColors[report.tag] || tagColors.unknown }}
                                            >
                                                {tagLabels[report.tag] || 'Activity'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 line-clamp-2">
                                            {report.summary}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Legend - Responsive */}
            {isLoaded && reports.length > 0 && !showHud && (
                <div className="absolute bottom-6 left-3 z-10 bg-zinc-900/90 border border-white/10 rounded-lg px-3 py-2 backdrop-blur-sm max-w-[calc(100%-80px)] sm:max-w-[280px]">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] sm:text-xs">
                        {Object.entries(tagColors).map(([tag, color]) => (
                            <div key={tag} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ background: color }}></div>
                                <span className="text-zinc-300 truncate">{tagLabels[tag] || 'Activity'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
