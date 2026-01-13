import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useHousehold() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['household', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const response = await fetch('/api/household');
      if (!response.ok) throw new Error('Failed to fetch household');
      return response.json();
    },
    enabled: !!session?.user?.id,
  });
}
