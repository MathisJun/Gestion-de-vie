'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Plus, Trash2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Trip {
  id: string;
  title: string;
  country: string | null;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export default function TripsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading, error } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await fetch('/api/trips');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch trips');
      }
      const data = await response.json();
      return data.trips || [];
    },
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/trips?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete trip');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      showToast('Voyage supprimé', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des voyages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['trips'] })}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nos voyages</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trips.length === 0 ? (
          <p className="text-gray-500 col-span-full">Aucun voyage</p>
        ) : (
          trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/app/trips/${trip.id}`}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold text-lg mb-2">{trip.title}</h3>
              {(trip.city || trip.country) && (
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {[trip.city, trip.country].filter(Boolean).join(', ')}
                </p>
              )}
              {trip.startDate && (
                <p className="text-sm text-gray-600">
                  {format(new Date(trip.startDate), 'd MMM yyyy', {
                    locale: fr,
                  })}
                  {trip.endDate &&
                    ` - ${format(new Date(trip.endDate), 'd MMM yyyy', {
                      locale: fr,
                    })}`}
                </p>
              )}
              {trip.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {trip.description}
                </p>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm('Supprimer ce voyage ?')) {
                    deleteMutation.mutate(trip.id);
                  }
                }}
                className="mt-4 text-red-600 hover:text-red-700 text-sm"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Supprimer
              </button>
            </Link>
          ))
        )}
      </div>

      {showAddModal && (
        <TripForm
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function TripForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          country: country || null,
          city: city || null,
          startDate: startDate || null,
          endDate: endDate || null,
          description: description || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create trip');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      onClose();
      showToast('Voyage ajouté', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur', 'error');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold">Ajouter un voyage</h2>
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
            <label className="block text-sm font-medium mb-1">Ville</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pays</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
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
          <Button onClick={() => createMutation.mutate()} disabled={!title}>
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
