'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut, deleteUser } from '@/lib/auth-client';
import { SignOut, UserMinus, CaretDown, User } from '@phosphor-icons/react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/create', label: 'Create' },
  { href: '/config', label: 'Config' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Better Auth session hook
  const { data: sessionData, isPending } = useSession();
  const user = sessionData?.user;

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
          router.refresh();
        }
      }
    });
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
      await deleteUser({
        fetchOptions: {
          onSuccess: () => {
            router.push('/login');
            router.refresh();
          }
        }
      });
    }
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
      <div className="ml-auto relative">
        {isPending ? (
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse"></div>
        ) : user ? (
          <div>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            >
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <User size={14} />
              </div>
              <span className="text-xs hidden sm:block truncate max-w-[150px]">
                {user.email}
              </span>
              <CaretDown size={12} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs text-white font-medium truncate">{user.name || 'User'}</p>
                  <p className="text-[10px] text-[#a1a1aa] truncate">{user.email}</p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <SignOut size={16} />
                  Sign Out
                </button>
                
                <button
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/10 transition-colors text-left mt-1 border-t border-white/5 pt-2"
                >
                  <UserMinus size={16} />
                  Delete Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium bg-white text-black px-4 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
