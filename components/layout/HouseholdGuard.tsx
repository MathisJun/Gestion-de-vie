'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useHousehold } from '@/lib/hooks/use-household';

export function HouseholdGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: householdData, isLoading } = useHousehold();

  useEffect(() => {
    if (isLoading) return;
    
    // Don't redirect if already on setup page
    if (pathname?.includes('/setup')) return;

    // Redirect to setup if no household
    if (!householdData?.household_id) {
      router.push('/app/setup');
    }
  }, [householdData, isLoading, pathname, router]);

  // Show loading or nothing while checking
  if (isLoading || (!householdData?.household_id && !pathname?.includes('/setup'))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return <>{children}</>;
}
