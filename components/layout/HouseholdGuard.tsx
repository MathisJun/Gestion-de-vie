'use client';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export function HouseholdGuard({ children }: { children: React.ReactNode }) {
  // On laisse passer directement sans vérification
  return <>{children}</>;
}
