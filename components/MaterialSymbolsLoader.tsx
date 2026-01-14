'use client';

import { useEffect } from 'react';

export function MaterialSymbolsLoader() {
  useEffect(() => {
    // Load Material Symbols fonts
    const link1 = document.createElement('link');
    link1.rel = 'stylesheet';
    link1.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    document.head.appendChild(link1);

    const link2 = document.createElement('link');
    link2.rel = 'stylesheet';
    link2.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    document.head.appendChild(link2);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(link1);
      document.head.removeChild(link2);
    };
  }, []);

  return null;
}

