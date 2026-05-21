'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import React from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/') {
    return <main>{children}</main>;
  }
  
  return (
    <div className="container">
      <Header />
      <main>{children}</main>
    </div>
  );
}
