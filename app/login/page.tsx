'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers l'application
    router.push('/app');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Redirection...</div>
    </div>
  );
}
