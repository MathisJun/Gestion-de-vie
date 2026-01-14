'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Map = dynamic(() => import('@/components/map/TripMap'), { ssr: false });

interface Trip {
  id: string;
  title: string;
  country: string | null;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

interface TripSpot {
  id: string;
  tripId: string;
  title: string;
  lat: number;
  lng: number;
  description: string | null;
  media?: TripMedia[];
}

interface TripMedia {
  id: string;
  spotId: string;
  storagePath: string;
  mediaType: 'image' | 'video';
}

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);

  const { data: tripData, isLoading: tripLoading, error: tripError } = useQuery<{ trip: Trip & { spots: any[] } }>({
    queryKey: ['trip', id],
    queryFn: async () => {
      const response = await fetch(`/api/trips/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Voyage non trouvé');
        throw new Error('Erreur lors du chargement');
      }
      return response.json();
    },
  });

  const trip = tripData?.trip;
  const spots: TripSpot[] = trip?.spots?.map((spot: any) => ({
    id: spot.id,
    tripId: spot.tripId,
    title: spot.title,
    lat: Number(spot.lat),
    lng: Number(spot.lng),
    description: spot.description,
    media: spot.media?.map((m: any) => ({
      id: m.id,
      spotId: m.spotId,
      storagePath: m.storagePath,
      mediaType: m.mediaType,
    })) || [],
  })) || [];

  if (tripLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (tripError || !trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {tripError?.message || 'Voyage non trouvé'}
          </p>
          <Button onClick={() => router.push('/app/trips')}>
            Retour aux voyages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 mb-2"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-bold">{trip.title}</h1>
          {(trip.city || trip.country) && (
            <p className="text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {[trip.city, trip.country].filter(Boolean).join(', ')}
            </p>
          )}
          {trip.startDate && (
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(trip.startDate), 'd MMMM yyyy', { locale: fr })}
              {trip.endDate &&
                ` - ${format(new Date(trip.endDate), 'd MMMM yyyy', {
                  locale: fr,
                })}`}
            </p>
          )}
        </div>
        <Button onClick={() => setShowAddSpotModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un spot
        </Button>
      </div>

      {trip.description && (
        <p className="text-gray-700">{trip.description}</p>
      )}

      {spots.length > 0 && (
        <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
          <Map spots={spots} />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Spots</h2>
        {spots.length === 0 ? (
          <p className="text-gray-500">Aucun spot ajouté</p>
        ) : (
          spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} tripId={id} />
          ))
        )}
      </div>

      {showAddSpotModal && (
        <SpotForm
          tripId={id}
          onClose={() => setShowAddSpotModal(false)}
        />
      )}
    </div>
  );
}

function SpotCard({ spot, tripId }: { spot: TripSpot; tripId: string }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/trips/spots?id=${spot.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete spot');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-spots', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      showToast('Spot supprimé', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    },
  });

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{spot.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}
          </p>
          {spot.description && (
            <p className="text-sm text-gray-700 mt-2">{spot.description}</p>
          )}
          {spot.media && spot.media.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {spot.media.map((media) => (
                <MediaPreview key={media.id} media={media} />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm('Supprimer ce spot ?')) {
              deleteMutation.mutate();
            }
          }}
          className="text-red-600 hover:text-red-700 p-2"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function MediaPreview({ media }: { media: TripMedia }) {
  // Note: L'upload de médias nécessite un service de stockage (S3, Cloudinary, etc.)
  // Pour l'instant, on affiche juste un placeholder
  return (
    <div className="aspect-square rounded overflow-hidden bg-gray-100 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <p className="text-xs">{media.mediaType === 'image' ? '📷' : '🎥'}</p>
        <p className="text-xs mt-1">Média</p>
      </div>
    </div>
  );
}

function SpotForm({
  tripId,
  onClose,
}: {
  tripId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/trips/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          title,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          description: description || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create spot');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-spots', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      onClose();
      showToast('Spot ajouté', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur', 'error');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">Ajouter un spot</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude *</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude *</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title || !lat || !lng}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
