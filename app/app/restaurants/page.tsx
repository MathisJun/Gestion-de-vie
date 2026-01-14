'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/lib/hooks/use-household';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { showToast } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';
import { priceLevelToSymbol, symbolToPriceLevel, type PriceLevel } from '@/lib/utils/price-level';

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
  priceLevel: PriceLevel | null;
  notes: string | null;
  googleMapsUrl: string | null;
}

export default function RestaurantsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [filterCuisine, setFilterCuisine] = useState<string>('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { data: householdData } = useHousehold();

  const { data: restaurants = [], isLoading, error } = useQuery<Restaurant[]>({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const response = await fetch('/api/restaurants');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch restaurants');
      }
      const data = await response.json();
      return data.restaurants || [];
    },
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/restaurants?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete restaurant');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      showToast('Restaurant supprimé', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des restaurants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <MaterialIcon name="error" size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4 font-medium">Erreur lors du chargement</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['restaurants'] })}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Nos restaurants</h1>
          <p className="text-gray-500">Découvrez vos restaurants favoris</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            startIcon={<MaterialIcon name={showMap ? 'list' : 'map'} size={20} />}
          >
            {showMap ? 'Liste' : 'Carte'}
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            startIcon={<MaterialIcon name="add" size={20} />}
          >
            Ajouter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterCuisine || ''}
          onChange={(e) => setFilterCuisine(e.target.value)}
          startIcon={<MaterialIcon name="restaurant_menu" size={20} />}
          className="min-w-[200px]"
        >
          <option value="">Toutes les cuisines</option>
          {cuisines.map((cuisine) => (
            <option key={cuisine || 'unknown'} value={cuisine || ''}>
              {cuisine}
            </option>
          ))}
        </Select>
        <Select
          value={filterRating || ''}
          onChange={(e) =>
            setFilterRating(e.target.value ? parseInt(e.target.value) : null)
          }
          startIcon={<MaterialIcon name="star" size={20} />}
          className="min-w-[180px]"
        >
          <option value="">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} étoile{rating > 1 ? 's' : ''}
            </option>
          ))}
        </Select>
      </div>

      {/* Content */}
      {showMap ? (
        <Card>
          <CardContent className="p-0">
            <div className="h-[600px] rounded-2xl overflow-hidden">
              <RestaurantsMap restaurants={filteredRestaurants} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRestaurants.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MaterialIcon name="restaurant" size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg">Aucun restaurant</p>
                <p className="text-gray-400 text-sm mt-2">Commencez par ajouter votre premier restaurant</p>
              </CardContent>
            </Card>
          ) : (
            filteredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-gray-900 mb-2">{restaurant.name}</h3>
                      {restaurant.address && (
                        <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                          <MaterialIcon name="location_on" size={18} className="text-gray-400 flex-shrink-0" />
                          <span>{restaurant.address}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        {restaurant.rating && (
                          <div className="flex items-center gap-1.5">
                            <MaterialIcon name="star" size={18} className="text-yellow-500" filled />
                            <span className="text-sm font-medium text-gray-700">{restaurant.rating}/5</span>
                          </div>
                        )}
                        {restaurant.cuisine && (
                          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            {restaurant.cuisine}
                          </span>
                        )}
                        {restaurant.priceLevel && (
                          <span className="text-sm font-semibold text-gray-900">
                            {priceLevelToSymbol(restaurant.priceLevel)}
                          </span>
                        )}
                      </div>
                      {restaurant.notes && (
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                          {restaurant.notes}
                        </p>
                      )}
                      {restaurant.googleMapsUrl && (
                        <a
                          href={restaurant.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-2"
                        >
                          <MaterialIcon name="open_in_new" size={18} />
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
                      className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 flex-shrink-0"
                      title="Supprimer"
                    >
                      <MaterialIcon name="delete" size={20} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <RestaurantForm onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function RestaurantForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [rating, setRating] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceLevel, setPriceLevel] = useState<PriceLevel | ''>('');
  const [notes, setNotes] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address: address || null,
          lat: lat || null,
          lng: lng || null,
          rating: rating || null,
          cuisine: cuisine || null,
          priceLevel: priceLevel || null,
          notes: notes || null,
          googleMapsUrl: googleMapsUrl || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create restaurant');
      }
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MaterialIcon name="restaurant" size={24} className="text-primary-600" />
            Ajouter un restaurant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nom *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            startIcon={<MaterialIcon name="label" size={20} />}
          />
          <Input
            label="Adresse"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            startIcon={<MaterialIcon name="location_on" size={20} />}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              startIcon={<MaterialIcon name="my_location" size={20} />}
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              startIcon={<MaterialIcon name="my_location" size={20} />}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Note (1-5)"
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              startIcon={<MaterialIcon name="star" size={20} />}
            />
            <Select
              label="Prix"
              value={priceLevel}
              onChange={(e) => setPriceLevel(e.target.value as PriceLevel | '')}
              startIcon={<MaterialIcon name="attach_money" size={20} />}
            >
              <option value="">Non spécifié</option>
              <option value="ONE_EURO">€</option>
              <option value="TWO_EURO">€€</option>
              <option value="THREE_EURO">€€€</option>
              <option value="FOUR_EURO">€€€€</option>
            </Select>
          </div>
          <Input
            label="Type de cuisine"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="Ex: Italienne"
            startIcon={<MaterialIcon name="restaurant_menu" size={20} />}
          />
          <Input
            label="Lien Google Maps"
            type="url"
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            startIcon={<MaterialIcon name="link" size={20} />}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 resize-none"
              rows={3}
              placeholder="Ajoutez vos notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={onClose}>
              Annuler
            </Button>
            <Button
              fullWidth
              onClick={() => createMutation.mutate()}
              disabled={!name || createMutation.isPending}
              startIcon={<MaterialIcon name="add" size={20} />}
            >
              {createMutation.isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
