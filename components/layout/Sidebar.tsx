'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { useHousehold } from '@/lib/hooks/use-household';
import { showToast } from '@/components/ui/Toast';
import { MaterialIcon } from '@/components/ui/MaterialIcon';

const navigation = [
  { name: 'Nos courses', href: '/app/groceries', icon: 'shopping_cart' },
  { name: 'Nos abonnements', href: '/app/subscriptions', icon: 'credit_card' },
  { name: 'Nos voyages', href: '/app/trips', icon: 'flight' },
  { name: 'Nos restaurants', href: '/app/restaurants', icon: 'restaurant' },
  { name: 'Nos films', href: '/app/movies', icon: 'movie' },
  { name: 'Consommation essence', href: '/app/fuel', icon: 'local_gas_station' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHouseholdId, setShowHouseholdId] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: householdData } = useHousehold();
  const householdId = householdData?.household_id;

  const handleCopyHouseholdId = async () => {
    if (!householdId) return;
    try {
      await navigator.clipboard.writeText(householdId);
      setCopied(true);
      showToast('ID du foyer copié !', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Erreur lors de la copie', 'error');
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200/80 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          Gestionnaire de Vie
        </h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <MaterialIcon 
            name={mobileMenuOpen ? 'close' : 'menu'} 
            size={24}
            className="text-gray-700"
          />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-full bg-white/95 backdrop-blur-lg border-r border-gray-200/80',
          'transition-transform duration-300 ease-in-out shadow-xl',
          'lg:translate-x-0 lg:static lg:z-auto lg:shadow-none',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col w-72">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/80">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent hidden lg:block">
              Gestionnaire de Vie
            </h1>
            <div className="lg:hidden flex items-center justify-between">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Gestionnaire de Vie
              </h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <MaterialIcon name="close" size={20} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200',
                    'group relative',
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 font-semibold shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <MaterialIcon
                    name={item.icon}
                    size={24}
                    className={clsx(
                      'transition-transform duration-200',
                      isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                    )}
                    filled={isActive}
                  />
                  <span className="text-[15px]">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary-600" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Household ID Section */}
          {householdId && (
            <div className="p-4 border-t border-gray-200/80 bg-gray-50/50">
              <button
                onClick={() => setShowHouseholdId(!showHouseholdId)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <MaterialIcon 
                  name="group" 
                  size={20} 
                  className="text-gray-500"
                />
                <span className="flex-1 text-left font-medium">ID du foyer</span>
                <MaterialIcon
                  name={showHouseholdId ? 'expand_less' : 'expand_more'}
                  size={20}
                  className="text-gray-400 transition-transform duration-200"
                />
              </button>
              {showHouseholdId && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-gray-500 mb-3 font-medium">Partagez cet ID pour inviter</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 break-all text-gray-800">
                      {householdId}
                    </code>
                    <button
                      onClick={handleCopyHouseholdId}
                      className="p-2.5 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                      title="Copier"
                    >
                      <MaterialIcon
                        name={copied ? 'check_circle' : 'content_copy'}
                        size={18}
                        className={copied ? 'text-green-600' : 'text-gray-600'}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Bottom navigation for mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-2xl">
        <div className="grid grid-cols-3 gap-1 p-2">
          {navigation.slice(0, 6).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                <MaterialIcon
                  name={item.icon}
                  size={22}
                  className={isActive ? 'text-primary-600' : 'text-gray-500'}
                  filled={isActive}
                />
                <span className="text-[11px] font-medium">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
