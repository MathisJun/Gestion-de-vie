import { AppLayout } from '@/components/layout/AppLayout';
import { ToastContainer } from '@/components/ui/Toast';
import { HouseholdGuard } from '@/components/layout/HouseholdGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HouseholdGuard>
      <AppLayout>
        {children}
        <ToastContainer />
      </AppLayout>
    </HouseholdGuard>
  );
}
