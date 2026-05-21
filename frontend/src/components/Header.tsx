'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FilmStripIcon, ListDashesIcon, GearIcon } from '@phosphor-icons/react';

export function Header() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: ListDashesIcon },
    { href: '/create', label: 'Create Masterpiece', icon: FilmStripIcon },
    { href: '/config', label: 'Configuration', icon: GearIcon },
  ];

  return (
    <header 
      className="glass-card" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FilmStripIcon size={32} weight="duotone" color="var(--color-cyan)" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.05em' }}>
          Render<span style={{ color: 'var(--color-purple)' }}>Daemon</span>
        </h1>
      </div>

      <nav style={{ display: 'flex', gap: '1rem' }}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                backgroundColor: isActive ? 'var(--color-bg-surface)' : 'transparent',
                color: isActive ? 'var(--color-cyan)' : 'var(--color-text-secondary)',
                border: isActive ? '1px solid var(--color-cyan-border)' : '1px solid transparent',
                transition: 'all 0.2s ease',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              <Icon size={20} weight={isActive ? 'bold' : 'regular'} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
