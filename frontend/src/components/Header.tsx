'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PROFILE_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuCKjM7Uw3QCp5T-K_0gOuA3PBnMmhsomzDK7NqMGtT7jiNxHM-_k9KoN6A-YjplvyAQIHFbGhrLji6NrWjRV10gCFQk3xpbYyQ72EyyfP6TDUOLQj9efcOj80yzBQUq-iR3e5lpDcKzv5Du8ArjhxnGNYLgId3TLt7xeYQ6ZBuxBPkJzs9Ch6vgA6pu8yRyjmm9bCR_LwSARFkVi3TfaZxQYexnOXod4J4LLJmSsEavigqkEkINQSRYnPFN6NUvMiv89WEwTU8ZGcg";

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/create', label: 'Create' },
  { href: '/config', label: 'Config' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-surface-glass sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 shadow-sm flex items-center w-full px-5 md:px-10 h-14">
      {/* Left: Logo + Nav links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <h1 className="text-lg font-bold tracking-tight text-on-surface">RenderDaemon</h1>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'text-on-surface font-semibold bg-white/8'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Profile avatar */}
      <div className="ml-auto">
        <div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-white/10 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-container/50 transition-all">
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
