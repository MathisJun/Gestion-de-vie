'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Users, Plus } from 'lucide-react';

export default function SetupPage() {
  const [householdName, setHouseholdName] = useState('');
  const [householdCode, setHouseholdCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
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

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/household/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId: householdCode.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la jointure');

      showToast('Foyer rejoint avec succès', 'success');
      router.push('/app');
      router.refresh();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la jointure', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'Créer votre foyer' : 'Rejoindre un foyer'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'create'
              ? 'Donnez un nom à votre foyer pour commencer'
              : 'Entrez l\'ID du foyer pour le rejoindre'}
          </p>
        </div>

        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setHouseholdName('');
              setHouseholdCode('');
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Créer
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join');
              setHouseholdName('');
              setHouseholdCode('');
            }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'join'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Rejoindre
          </button>
        </div>

        {mode === 'create' ? (
          <form className="mt-8 space-y-6" onSubmit={handleCreateHousehold}>
            <div>
              <label htmlFor="household" className="block text-sm font-medium text-gray-700 mb-1">
                Nom du foyer
              </label>
              <input
                id="household"
                name="household"
                type="text"
                required
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Chez nous"
              />
            </div>
            <div>
              <Button type="submit" className="w-full" disabled={loading || !householdName.trim()}>
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création...
                  </span>
                ) : (
                  'Créer le foyer'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleJoinHousehold}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                ID du foyer
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={householdCode}
                onChange={(e) => setHouseholdCode(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Entrez l'ID du foyer"
              />
              <p className="mt-1 text-xs text-gray-500">
                Demandez l'ID du foyer à l'autre personne
              </p>
            </div>
            <div>
              <Button type="submit" className="w-full" disabled={loading || !householdCode.trim()}>
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion...
                  </span>
                ) : (
                  'Rejoindre le foyer'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
