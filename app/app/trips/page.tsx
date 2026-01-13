'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useHousehold } from '@/lib/hooks/use-household';
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
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

export default function TripsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { data: householdData } = useHousehold();
  const householdId = householdData?.household_id as string | undefined;

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ['trips', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('household_id', householdId)
        .order('start_date', { ascending: false });
      return data || [];
    },
    enabled: !!householdId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      showToast('Voyage supprimé', 'success');
    },
  });

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
              {trip.start_date && (
                <p className="text-sm text-gray-600">
                  {format(new Date(trip.start_date), 'd MMM yyyy', {
                    locale: fr,
                  })}
                  {trip.end_date &&
                    ` - ${format(new Date(trip.end_date), 'd MMM yyyy', {
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
          householdId={householdId!}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function TripForm({
  householdId,
  onClose,
}: {
  householdId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const supabase = createClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('trips').insert({
        household_id: householdId,
        title,
        country: country || null,
        city: city || null,
        start_date: startDate || null,
        end_date: endDate || null,
        description: description || null,
      });
      if (error) throw error;
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
