'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Plus, MapPin, Upload, Trash2 } from 'lucide-react';
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
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

interface TripSpot {
  id: string;
  trip_id: string;
  title: string;
  lat: number;
  lng: number;
  description: string | null;
  media?: TripMedia[];
}

interface TripMedia {
  id: string;
  spot_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
}

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);

  const { data: trip } = useQuery<Trip>({
    queryKey: ['trip', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: spots = [] } = useQuery<TripSpot[]>({
    queryKey: ['trip-spots', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('trip_spots')
        .select('*')
        .eq('trip_id', id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: spotsWithMedia = [] } = useQuery<TripSpot[]>({
    queryKey: ['trip-spots-media', spots],
    queryFn: async () => {
      const spotIds = spots.map((s) => s.id);
      if (spotIds.length === 0) return [];

      const { data: media } = await supabase
        .from('trip_media')
        .select('*')
        .in('spot_id', spotIds);

      return spots.map((spot) => ({
        ...spot,
        media: media?.filter((m) => m.spot_id === spot.id) || [],
      }));
    },
    enabled: spots.length > 0,
  });

  if (!trip) {
    return <div>Chargement...</div>;
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
          {trip.start_date && (
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(trip.start_date), 'd MMMM yyyy', { locale: fr })}
              {trip.end_date &&
                ` - ${format(new Date(trip.end_date), 'd MMMM yyyy', {
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

      {spotsWithMedia.length > 0 && (
        <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
          <Map spots={spotsWithMedia} />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Spots</h2>
        {spotsWithMedia.length === 0 ? (
          <p className="text-gray-500">Aucun spot ajouté</p>
        ) : (
          spotsWithMedia.map((spot) => (
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
  const supabase = createClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('trip_spots')
        .delete()
        .eq('id', spot.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-spots'] });
      showToast('Spot supprimé', 'success');
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
  const supabase = createClient();
  const { data: url } = useQuery({
    queryKey: ['media-url', media.storage_path],
    queryFn: async () => {
      const { data } = await supabase.storage
        .from('trip-media')
        .createSignedUrl(media.storage_path, 3600);
      return data?.signedUrl;
    },
  });

  if (!url) return null;

  return (
    <div className="aspect-square rounded overflow-hidden bg-gray-100">
      {media.media_type === 'image' ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <video src={url} className="w-full h-full object-cover" controls />
      )}
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
  const supabase = createClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('trip_spots').insert({
        trip_id: tripId,
        title,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        description: description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-spots'] });
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
