'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { format, addMonths, addYears, differenceInDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Subscription {
  id: string;
  name: string;
  provider: string | null;
  billingCycle: 'monthly' | 'yearly';
  price: number;
  startDate: string;
  endDate: string | null;
  nextRenewal: string | null;
  paymentMethod: string | null;
  notes: string | null;
}

export default function SubscriptionsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading, error } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch subscriptions');
      }
      const data = await response.json();
      return data.subscriptions || [];
    },
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/subscriptions?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete subscription');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      showToast('Abonnement supprimé', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    },
  });

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filter === 'active') {
      return !sub.endDate || isBefore(new Date(), new Date(sub.endDate));
    }
    if (filter === 'expired') {
      return sub.endDate && isBefore(new Date(sub.endDate), new Date());
    }
    return true;
  });

  const totalMonthly = subscriptions
    .filter((sub) => !sub.endDate || isBefore(new Date(), new Date(sub.endDate)))
    .reduce((sum, sub) => {
      const monthly = sub.billingCycle === 'monthly' ? sub.price : sub.price / 12;
      return sum + Number(monthly);
    }, 0);

  const isRenewalSoon = (date: string | null) => {
    if (!date) return false;
    const daysUntil = differenceInDays(new Date(date), new Date());
    return daysUntil <= 7 && daysUntil >= 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des abonnements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nos abonnements</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Total mensuel estimé</p>
        <p className="text-2xl font-bold">{totalMonthly.toFixed(2)} €</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tous
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Actifs
        </Button>
        <Button
          variant={filter === 'expired' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('expired')}
        >
          Expirés
        </Button>
      </div>

      <div className="space-y-4">
        {filteredSubscriptions.length === 0 ? (
          <p className="text-gray-500">Aucun abonnement</p>
        ) : (
          filteredSubscriptions.map((sub) => (
            <div
              key={sub.id}
              className={`p-4 bg-white rounded-lg border ${
                isRenewalSoon(sub.nextRenewal)
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{sub.name}</h3>
                    {isRenewalSoon(sub.nextRenewal) && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  {sub.provider && (
                    <p className="text-sm text-gray-600">{sub.provider}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Prix:</span> {sub.price}€ /{' '}
                      {sub.billingCycle === 'monthly' ? 'mois' : 'an'}
                    </p>
                    {sub.nextRenewal && (
                      <p className="text-sm">
                        <span className="font-medium">Prochain renouvellement:</span>{' '}
                        {format(new Date(sub.nextRenewal), 'd MMMM yyyy', {
                          locale: fr,
                        })}
                        {isRenewalSoon(sub.nextRenewal) && (
                          <span className="text-yellow-600 ml-2">
                            (dans {differenceInDays(new Date(sub.nextRenewal), new Date())}{' '}
                            jours)
                          </span>
                        )}
                      </p>
                    )}
                    {sub.paymentMethod && (
                      <p className="text-sm">
                        <span className="font-medium">Moyen de paiement:</span>{' '}
                        {sub.paymentMethod}
                      </p>
                    )}
                    {sub.notes && (
                      <p className="text-sm text-gray-600 mt-2">{sub.notes}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (
                      confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')
                    ) {
                      deleteMutation.mutate(sub.id);
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

      {showAddModal && (
        <SubscriptionForm
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function SubscriptionForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [price, setPrice] = useState('');
  const [startDate, setStartDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          provider: provider || null,
          billingCycle,
          price: parseFloat(price),
          startDate,
          endDate: endDate || null,
          paymentMethod: paymentMethod || null,
          notes: notes || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      onClose();
      showToast('Abonnement ajouté', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur', 'error');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold">Ajouter un abonnement</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Nom *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ex: Netflix"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fournisseur</label>
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ex: Netflix"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cycle *</label>
          <select
            value={billingCycle}
            onChange={(e) =>
              setBillingCycle(e.target.value as 'monthly' | 'yearly')
            }
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="monthly">Mensuel</option>
            <option value="yearly">Annuel</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prix (€) *</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ex: 9.99"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date de début *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date de fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Moyen de paiement</label>
          <input
            type="text"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ex: Carte bancaire"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
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
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || !price}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
