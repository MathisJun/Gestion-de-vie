'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Spot {
  id: string;
  lat: number;
  lng: number;
  title: string;
}

export default function TripMap({ spots }: { spots: Spot[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: spots.length > 0 ? [spots[0].lng, spots[0].lat] : [2.3522, 48.8566],
      zoom: spots.length > 0 ? 10 : 2,
    });

    map.current.addControl(new maplibregl.NavigationControl());

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Add markers
    spots.forEach((spot) => {
      new maplibregl.Marker()
        .setLngLat([spot.lng, spot.lat])
        .setPopup(
          new maplibregl.Popup().setHTML(`<strong>${spot.title}</strong>`)
        )
        .addTo(map.current!);
    });

    // Fit bounds if multiple spots
    if (spots.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      spots.forEach((spot) => {
        bounds.extend([spot.lng, spot.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [spots]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
