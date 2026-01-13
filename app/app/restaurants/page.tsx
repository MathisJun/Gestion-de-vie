'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useHousehold } from '@/lib/hooks/use-household';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Plus, Trash2, MapPin, ExternalLink, Star } from 'lucide-react';
import dynamic from 'next/dynamic';

const RestaurantsMap = dynamic(() => import('@/components/map/RestaurantsMap'), {
  ssr: false,
});

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  cuisine: string | null;
  price_level: '€' | '€€' | '€€€' | '€€€€' | null;
  notes: string | null;
  google_maps_url: string | null;
}

export default function RestaurantsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [filterCuisine, setFilterCuisine] = useState<string>('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { data: householdData } = useHousehold();
  const householdId = householdData?.household_id as string | undefined;

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ['restaurants', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!householdId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      showToast('Restaurant supprimé', 'success');
    },
  });

  const cuisines = Array.from(
    new Set(restaurants.map((r) => r.cuisine).filter(Boolean))
  );

  const filteredRestaurants = restaurants.filter((r) => {
    if (filterCuisine && r.cuisine !== filterCuisine) return false;
    if (filterRating && r.rating !== filterRating) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nos restaurants</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowMap(!showMap)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMap ? 'Liste' : 'Carte'}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={filterCuisine}
          onChange={(e) => setFilterCuisine(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Toutes les cuisines</option>
          {cuisines.map((cuisine) => (
            <option key={cuisine} value={cuisine}>
              {cuisine}
            </option>
          ))}
        </select>
        <select
          value={filterRating || ''}
          onChange={(e) =>
            setFilterRating(e.target.value ? parseInt(e.target.value) : null)
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} étoile{rating > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      {showMap ? (
        <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
          <RestaurantsMap restaurants={filteredRestaurants} />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRestaurants.length === 0 ? (
            <p className="text-gray-500">Aucun restaurant</p>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="p-4 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                    {restaurant.address && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {restaurant.address}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {restaurant.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{restaurant.rating}/5</span>
                        </div>
                      )}
                      {restaurant.cuisine && (
                        <span className="text-sm text-gray-600">
                          {restaurant.cuisine}
                        </span>
                      )}
                      {restaurant.price_level && (
                        <span className="text-sm font-medium">
                          {restaurant.price_level}
                        </span>
                      )}
                    </div>
                    {restaurant.notes && (
                      <p className="text-sm text-gray-700 mt-2">
                        {restaurant.notes}
                      </p>
                    )}
                    {restaurant.google_maps_url && (
                      <a
                        href={restaurant.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir dans Google Maps
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer ce restaurant ?')) {
                        deleteMutation.mutate(restaurant.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showAddModal && (
        <RestaurantForm
          householdId={householdId!}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function RestaurantForm({
  householdId,
  onClose,
}: {
  householdId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [rating, setRating] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceLevel, setPriceLevel] = useState<'€' | '€€' | '€€€' | '€€€€' | ''>('');
  const [notes, setNotes] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const queryClient = useQueryClient();
  const supabase = createClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('restaurants').insert({
        household_id: householdId,
        name,
        address: address || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        rating: rating ? parseInt(rating) : null,
        cuisine: cuisine || null,
        price_level: priceLevel || null,
        notes: notes || null,
        google_maps_url: googleMapsUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      onClose();
      showToast('Restaurant ajouté', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur', 'error');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold">Ajouter un restaurant</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Nom *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Note (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prix</label>
            <select
              value={priceLevel}
              onChange={(e) =>
                setPriceLevel(e.target.value as '€' | '€€' | '€€€' | '€€€€' | '')
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Non spécifié</option>
              <option value="€">€</option>
              <option value="€€">€€</option>
              <option value="€€€">€€€</option>
              <option value="€€€€">€€€€</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type de cuisine</label>
          <input
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ex: Italienne"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Lien Google Maps
          </label>
          <input
            type="url"
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="https://maps.google.com/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Commentaire</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={!name}>
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
