'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Restaurant {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
}

export default function RestaurantsMap({
  restaurants,
}: {
  restaurants: Restaurant[];
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const validRestaurants = restaurants.filter(
      (r) => r.lat !== null && r.lng !== null
    );

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center:
        validRestaurants.length > 0
          ? [validRestaurants[0].lng!, validRestaurants[0].lat!]
          : [2.3522, 48.8566],
      zoom: validRestaurants.length > 0 ? 10 : 2,
    });

    map.current.addControl(new maplibregl.NavigationControl());

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const validRestaurants = restaurants.filter(
      (r) => r.lat !== null && r.lng !== null
    );

    // Clear existing markers
    const markers: maplibregl.Marker[] = [];

    // Add markers
    validRestaurants.forEach((restaurant) => {
      const marker = new maplibregl.Marker()
        .setLngLat([restaurant.lng!, restaurant.lat!])
        .setPopup(
          new maplibregl.Popup().setHTML(
            `<strong>${restaurant.name}</strong>${
              restaurant.rating
                ? `<br><small>⭐ ${restaurant.rating}/5</small>`
                : ''
            }`
          )
        )
        .addTo(map.current!);
      markers.push(marker);
    });

    // Fit bounds if multiple restaurants
    if (validRestaurants.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      validRestaurants.forEach((restaurant) => {
        bounds.extend([restaurant.lng!, restaurant.lat!]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    } else if (validRestaurants.length === 1) {
      map.current.setCenter([
        validRestaurants[0].lng!,
        validRestaurants[0].lat!,
      ]);
      map.current.setZoom(12);
    }

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [restaurants]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
