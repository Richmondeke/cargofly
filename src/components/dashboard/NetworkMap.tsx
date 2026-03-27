'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location, Route } from '@/lib/dashboard-service';

// Fix for default Leaflet icon issues in Next.js
const getIcon = () => {
    const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

    return L.icon({
        iconUrl,
        iconRetinaUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
};

// Helper to get coordinates for a location (mocking if missing)
const getCoordinates = (loc: Location): [number, number] => {
    if (loc.coordinates) return [loc.coordinates.lat, loc.coordinates.lng];

    // Fallback coordinates for known cities if not in DB
    const cityCoords: Record<string, [number, number]> = {
        'Lagos': [6.5244, 3.3792],
        'London': [51.5074, -0.1278],
        'Dubai': [25.2048, 55.2708],
        'New York': [40.7128, -74.0060],
        'Shanghai': [31.2304, 121.4737],
        'Beijing': [39.9042, 116.4074],
        'Tokyo': [35.6762, 139.6503],
    };

    return cityCoords[loc.city] || [0, 0];
};

// Component to auto-fit map bounds
const MapBounds = ({ locations }: { locations: Location[] }) => {
    const map = useMap();

    useEffect(() => {
        if (typeof window !== 'undefined' && L.Marker.prototype.options.icon !== getIcon()) {
            L.Marker.prototype.options.icon = getIcon();
        }

        if (locations.length > 0) {
            const bounds = L.latLngBounds(locations.map(l => getCoordinates(l)));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [locations, map]);

    return null;
};

interface NetworkMapProps {
    locations: Location[];
    routes: Route[];
}

const NetworkMap = ({ locations, routes }: NetworkMapProps) => {
    return (
        <MapContainer
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapBounds locations={locations} />

            {/* Render Locations */}
            {locations.map((loc) => (
                <Marker key={loc.id} position={getCoordinates(loc)}>
                    <Popup>
                        <div className="p-1">
                            <h3 className="font-medium text-sm">{loc.name}</h3>
                            <p className="text-xs text-slate-500 m-0">{loc.city}, {loc.country}</p>
                            <span className="text-[10px] uppercase font-medium tracking-wider text-primary mt-1 block">{loc.type}</span>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Render Routes */}
            {routes.map((route) => {
                const originLoc = locations.find(l => l.city.includes(route.origin) || route.origin.includes(l.city));
                const destLoc = locations.find(l => l.city.includes(route.destination) || route.destination.includes(l.city));

                if (originLoc && destLoc) {
                    return (
                        <Polyline
                            key={route.id}
                            positions={[getCoordinates(originLoc), getCoordinates(destLoc)]}
                            pathOptions={{ color: '#4196FF', weight: 2, opacity: 0.8, dashArray: '8, 12' }}
                        />
                    );
                }
                return null;
            })}
        </MapContainer>
    );
};

export default NetworkMap;
