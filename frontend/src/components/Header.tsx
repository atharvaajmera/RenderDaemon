'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { SignOut, User } from '@phosphor-icons/react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/create', label: 'Create' },
  { href: '/config', label: 'Config' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-surface-glass sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 shadow-sm flex items-center w-full px-5 md:px-10 h-14">
      {/* Left: Logo + Nav links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <h1 className="text-lg font-bold tracking-tight text-white">RenderDaemon</h1>
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'text-white font-semibold bg-white/10'
                      : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right: Auth Profile */}
      <div className="ml-auto">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#a1a1aa] hidden sm:block truncate max-w-[150px]">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              title="Sign Out"
            >
              <SignOut size={18} />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
