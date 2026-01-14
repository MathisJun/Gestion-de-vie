import { useQuery } from '@tanstack/react-query';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export function useHousehold() {
  return useQuery({
    queryKey: ['household', 'temp'],
    queryFn: async () => {
      const response = await fetch('/api/household');
      if (!response.ok) throw new Error('Failed to fetch household');
      return response.json();
    },
    // Toujours activé en mode temporaire
    enabled: true,
  });
}
