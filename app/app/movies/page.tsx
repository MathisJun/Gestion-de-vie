'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { Plus, Trash2, Share2, Star, Upload } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  year: number | null;
  status: 'TO_WATCH' | 'WATCHED';
  rating: number | null;
  notes: string | null;
}

export default function MoviesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'TO_WATCH' | 'WATCHED'>('all');
  const queryClient = useQueryClient();

  const { data: movies = [], isLoading, error } = useQuery<Movie[]>({
    queryKey: ['movies'],
    queryFn: async () => {
      const response = await fetch('/api/movies');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch movies');
      }
      const data = await response.json();
      return data.movies || [];
    },
    retry: 2,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/movies?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete movie');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      showToast('Film supprimé', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    },
  });

  const filteredMovies = movies.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const handleShare = (movie: Movie) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const subject = encodeURIComponent(`Film: ${movie.title}`);
    const body = encodeURIComponent(
      `Titre: ${movie.title}${movie.year ? ` (${movie.year})` : ''}\n` +
        `Statut: ${movie.status === 'WATCHED' ? 'Vu' : 'À voir'}\n` +
        `${movie.rating ? `Note: ${movie.rating}/5\n` : ''}` +
        `${movie.notes ? `Commentaire: ${movie.notes}\n` : ''}\n` +
        `Lien: ${appUrl}/app/movies`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des films...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['movies'] })}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nos films</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
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
          variant={filter === 'TO_WATCH' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('TO_WATCH')}
        >
          À voir
        </Button>
        <Button
          variant={filter === 'WATCHED' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('WATCHED')}
        >
          Vus
        </Button>
      </div>

      <div className="space-y-4">
        {filteredMovies.length === 0 ? (
          <p className="text-gray-500">Aucun film</p>
        ) : (
          filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {movie.title}
                    {movie.year && (
                      <span className="text-gray-500 font-normal">
                        {' '}
                        ({movie.year})
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        movie.status === 'WATCHED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {movie.status === 'WATCHED' ? 'Vu' : 'À voir'}
                    </span>
                    {movie.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm">{movie.rating}/5</span>
                      </div>
                    )}
                  </div>
                  {movie.notes && (
                    <p className="text-sm text-gray-700 mt-2">{movie.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare(movie)}
                    className="text-primary-600 hover:text-primary-700 p-2"
                    title="Partager par email"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer ce film ?')) {
                        deleteMutation.mutate(movie.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <MovieForm
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showImportModal && (
        <ImportMoviesModal
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}

function MovieForm({
  onClose,
}: {
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState<'TO_WATCH' | 'WATCHED'>('TO_WATCH');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          year: year || null,
          status,
          rating: rating || null,
          notes: notes || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create movie');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      onClose();
      showToast('Film ajouté', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur', 'error');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">Ajouter un film</h2>
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
            <label className="block text-sm font-medium mb-1">Année</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'TO_WATCH' | 'WATCHED')
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="TO_WATCH">À voir</option>
              <option value="WATCHED">Vu</option>
            </select>
          </div>
        </div>
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
          <Button onClick={() => createMutation.mutate()} disabled={!title}>
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImportMoviesModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const movies = lines.map((line) => ({
        title: line,
        status: 'TO_WATCH' as const,
      }));

      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import movies');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      onClose();
      showToast('Films importés', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Erreur', 'error');
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">Importer des films</h2>
        <p className="text-sm text-gray-600">
          Entrez un film par ligne dans le champ ci-dessous.
        </p>
        <div>
          <label className="block text-sm font-medium mb-1">Liste de films</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows={10}
            placeholder="Le Parrain&#10;Inception&#10;Pulp Fiction"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={!text.trim()}
          >
            Importer
          </Button>
        </div>
      </div>
    </div>
  );
}
