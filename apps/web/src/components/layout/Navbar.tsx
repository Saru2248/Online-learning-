// ─────────────────────────────────────────────────────────────────────
//  Navbar — Sticky top navigation with auth state
// ─────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap, Search, Bell, UserCircle, Menu, X,
  LayoutDashboard, BookOpen, LogOut, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const navLinks = [
  { href: '/courses', label: 'Courses' },
  { href: '/courses?sortBy=popular', label: 'Popular' },
  { href: '/courses?category=Data+Science', label: 'Data Science' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, clearUser } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearUser();
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-surface-950/80 backdrop-blur-xl
                    border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600
                            flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Edu<span className="text-brand-400">Flow</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${pathname === link.href
                    ? 'text-brand-300 bg-brand-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Search Icon */}
            <Link
              href="/courses"
              className="hidden sm:flex p-2 rounded-lg text-slate-400 hover:text-white
                         hover:bg-white/5 transition-colors"
            >
              <Search size={18} />
            </Link>

            {user ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-slate-400 hover:text-white
                                   hover:bg-white/5 transition-colors">
                  <Bell size={18} />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
                </button>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                               border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-500/30 flex items-center
                                    justify-center text-brand-300 text-sm font-bold">
                      {user.name[0]}
                    </div>
                    <span className="hidden sm:block text-sm text-white max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 glass-card p-1 z-50">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg
                                   text-slate-300 hover:text-white hover:bg-white/5"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={16} /> My Dashboard
                      </Link>
                      <Link
                        href="/dashboard/courses"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg
                                   text-slate-300 hover:text-white hover:bg-white/5"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <BookOpen size={16} /> My Courses
                      </Link>
                      <hr className="border-white/10 mx-2 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                                   text-red-400 hover:text-red-300 hover:bg-red-500/5"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="hidden sm:block px-4 py-2 text-sm text-slate-300
                             hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary py-2 px-4 text-sm">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-surface-950 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2.5 rounded-lg text-slate-300 hover:text-white
                         hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
