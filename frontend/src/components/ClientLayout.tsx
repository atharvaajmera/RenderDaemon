'use client';

import { Header } from '@/components/Header';
import React from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
