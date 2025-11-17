'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DisclaimerFooter from '@/components/DisclaimerFooter';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
    return (
      <>
        {children}
        <DisclaimerFooter />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden transition-colors" style={{ backgroundColor: 'var(--surface)' }}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--bg)' }}>{children}</main>
        <DisclaimerFooter />
      </div>
    </div>
  );
}
