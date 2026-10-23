import React from 'react';
import { LogOut } from 'lucide-react';
import { User } from '../types.js';
import { getAvatarSrc } from '../lib/avatars.js';

interface NavbarProps {
  user: User;
  title: string;
  onLogout?: () => void;
}

export default function Navbar({ user, title, onLogout }: NavbarProps) {
  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-sidebar)]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3 pl-12 lg:pl-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        <h2 className="font-heading text-base sm:text-lg text-[var(--text-primary)] font-bold tracking-[-0.02em]">
          {title}
        </h2>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* User profile */}
        <div className="flex items-center space-x-3">
          <img
            src={getAvatarSrc(user.picture)}
            alt={user.name}
            className="w-8 h-8 rounded-full border border-[var(--border)] object-cover bg-slate-900"
          />
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-medium text-[var(--text-primary)] tracking-tight leading-snug">{user.name}</span>
            <span className="block text-[10px] text-[var(--text-muted)] font-mono uppercase">{user.role}</span>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--danger-soft)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]/30 transition text-xs cursor-pointer"
              title="Sign out of current session"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
