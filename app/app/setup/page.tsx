'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';

export default function SetupPage() {
  const [householdName, setHouseholdName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: householdName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la création');

      showToast('Foyer créé avec succès', 'success');
      router.push('/app');
      router.refresh();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Créer votre foyer
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Donnez un nom à votre foyer pour commencer
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleCreateHousehold}>
          <div>
            <label htmlFor="household" className="block text-sm font-medium text-gray-700">
              Nom du foyer
            </label>
            <input
              id="household"
              name="household"
              type="text"
              required
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Chez nous"
            />
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer le foyer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
