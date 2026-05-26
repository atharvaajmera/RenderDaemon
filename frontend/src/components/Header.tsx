'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, House, FilmStrip, ListDashes, Gear, SignOut, X } from '@phosphor-icons/react';

const PROFILE_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuCKjM7Uw3QCp5T-K_0gOuA3PBnMmhsomzDK7NqMGtT7jiNxHM-_k9KoN6A-YjplvyAQIHFbGhrLji6NrWjRV10gCFQk3xpbYyQ72EyyfP6TDUOLQj9efcOj80yzBQUq-iR3e5lpDcKzv5Du8ArjhxnGNYLgId3TLt7xeYQ6ZBuxBPkJzs9Ch6vgA6pu8yRyjmm9bCR_LwSARFkVi3TfaZxQYexnOXod4J4LLJmSsEavigqkEkINQSRYnPFN6NUvMiv89WEwTU8ZGcg";

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: House },
  { href: '/dashboard', label: 'Dashboard', icon: ListDashes },
  { href: '/create', label: 'Create Masterpiece', icon: FilmStrip },
  { href: '/config', label: 'Configuration', icon: Gear },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="bg-surface-glass sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 shadow-sm flex justify-between items-center w-full px-5 md:px-10 h-16">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <h1 className="text-xl font-bold tracking-tight text-on-surface">RenderDaemon</h1>
      </Link>

      {/* Right side: menu dropdown + profile */}
      <div className="flex items-center gap-3">
        {/* Navigation dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all text-on-surface-variant hover:text-on-surface hover:bg-white/5"
            aria-label="Navigation menu"
          >
            {menuOpen ? (
              <X size={20} weight="bold" />
            ) : (
              <List size={20} weight="bold" />
            )}
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-12 w-60 rounded-xl overflow-hidden border border-white/10 shadow-2xl z-50"
              style={{
                background: 'rgba(20, 20, 28, 0.95)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <div className="py-1">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? 'text-secondary-container bg-secondary-container/10'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="py-1 border-t border-white/10">
                <button className="flex items-center gap-3 px-4 py-3 text-sm text-status-error hover:bg-status-error/10 w-full transition-colors">
                  <SignOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile avatar */}
        <div className="w-9 h-9 rounded-full bg-surface-variant overflow-hidden border border-white/10 shrink-0">
          <img
            alt="Creator Profile"
            className="w-full h-full object-cover"
            src={PROFILE_IMG}
          />
        </div>
      </div>
    </header>
  );
}
