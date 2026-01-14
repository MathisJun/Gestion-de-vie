'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Plus, Trash2, Download } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FuelEntry {
  id: string;
  date: string;
  odometerKm: number;
  liters: number;
  totalPrice: number;
  station: string | null;
}

interface FuelEntryWithConsumption extends FuelEntry {
  consumption?: number;
  costPer100km?: number;
}

export default function FuelPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery<FuelEntry[]>({
    queryKey: ['fuel-entries'],
    queryFn: async () => {
      const response = await fetch('/api/fuel');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch fuel entries');
      }
      const data = await response.json();
      return data.entries || [];
    },
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/fuel?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete fuel entry');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      showToast('Entrée supprimée', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    },
  });

  // Calculate consumption and cost
  const entriesWithStats: FuelEntryWithConsumption[] = entries.map(
    (entry, index) => {
      if (index === 0) return { ...entry };

      const prevEntry = entries[index - 1];
      const kmDiff = entry.odometerKm - prevEntry.odometerKm;
      const consumption = (entry.liters / kmDiff) * 100;
      const costPer100km = (entry.totalPrice / kmDiff) * 100;

      return {
        ...entry,
        consumption: Number(consumption.toFixed(2)),
        costPer100km: Number(costPer100km.toFixed(2)),
      };
    }
  );

  const chartData = entriesWithStats.map((entry) => ({
    date: format(parseISO(entry.date), 'dd/MM'),
    consommation: entry.consumption || null,
    'coût/100km': entry.costPer100km || null,
  }));

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Kilométrage',
      'Litres',
      'Prix total',
      'Station',
      'Consommation L/100km',
      'Coût/100km',
    ];
    const rows = entriesWithStats.map((entry) => [
      entry.date,
      entry.odometerKm,
      entry.liters,
      entry.totalPrice,
      entry.station || '',
      entry.consumption || '',
      entry.costPer100km || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `consommation-essence-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['fuel-entries'] })}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Consommation essence</h1>
        <div className="flex gap-2">
          {entries.length > 0 && (
            <Button variant="secondary" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un plein
          </Button>
        </div>
      </div>

      {entries.length > 1 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Graphiques</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Consommation (L/100km)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="consommation"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Coût par 100km (€)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="coût/100km"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Historique</h2>
        {entries.length === 0 ? (
          <p className="text-gray-500">Aucune entrée</p>
        ) : (
          <div className="space-y-2">
            {entriesWithStats
              .slice()
              .reverse()
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <p className="font-semibold">
                          {format(parseISO(entry.date), 'd MMMM yyyy', {
                            locale: fr,
                          })}
                        </p>
                        {entry.station && (
                          <p className="text-sm text-gray-600">
                            {entry.station}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-gray-600">Kilométrage</p>
                          <p className="font-medium">
                            {entry.odometerKm.toFixed(0)} km
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Litres</p>
                          <p className="font-medium">{entry.liters} L</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Prix</p>
                          <p className="font-medium">
                            {entry.totalPrice.toFixed(2)} €
                          </p>
                        </div>
                        {entry.consumption && (
                          <div>
                            <p className="text-sm text-gray-600">
                              Consommation
                            </p>
                            <p className="font-medium">
                              {entry.consumption} L/100km
                            </p>
                          </div>
                        )}
                      </div>
                      {entry.costPer100km && (
                        <p className="text-sm text-gray-600 mt-2">
                          Coût/100km: {entry.costPer100km.toFixed(2)} €
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Supprimer cette entrée ?')) {
                          deleteMutation.mutate(entry.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <FuelEntryForm
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function FuelEntryForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [odometerKm, setOdometerKm] = useState('');
  const [liters, setLiters] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [station, setStation] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          odometerKm: parseFloat(odometerKm),
          liters: parseFloat(liters),
          totalPrice: parseFloat(totalPrice),
          station: station || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create fuel entry');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      onClose();
      showToast('Plein enregistré', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur', 'error');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">Ajouter un plein</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Kilométrage (km) *
          </label>
          <input
            type="number"
            step="0.01"
            value={odometerKm}
            onChange={(e) => setOdometerKm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Litres *
            </label>
            <input
              type="number"
              step="0.01"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Prix total (€) *
            </label>
            <input
              type="number"
              step="0.01"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Station</label>
          <input
            type="text"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ex: Total"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!date || !odometerKm || !liters || !totalPrice}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
