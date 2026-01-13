'use client';

import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
