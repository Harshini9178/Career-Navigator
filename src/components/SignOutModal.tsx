import React, { useState } from 'react';
import { LogOut, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { sound } from '../lib/sound.js';
import { getAvatarSrc } from '../lib/avatars.js';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout?: () => void;
}

export default function SignOutModal({ isOpen, onClose, onConfirmLogout }: SignOutModalProps) {
  const { user, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    sound.playClick(500);
    try {
      await logout();
      if (onConfirmLogout) {
        onConfirmLogout();
      }
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => {
        sound.playClick(700);
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-[var(--danger-soft)] rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30 flex items-center justify-center">
              <LogOut className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="signout-modal-title" className="font-heading font-bold text-base text-[var(--text-primary)] tracking-tight">
                Sign Out
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">End your current session</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick(700);
              onClose();
            }}
            aria-label="Close confirmation dialog"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border)]">
            <img
              src={getAvatarSrc(user.picture)}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-[var(--border)] bg-slate-900"
            />
            <div className="min-w-0 flex-1">
              <span className="block font-semibold text-xs text-[var(--text-primary)] truncate">{user.name}</span>
              <span className="block text-[10px] text-[var(--text-muted)] truncate font-mono">{user.email}</span>
            </div>
            <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
              {user.role}
            </span>
          </div>
        )}

        {/* Informative text */}
        <div className="space-y-2 text-xs text-[var(--text-secondary)]">
          <p>
            Are you sure you want to log out? Your current session cookie will be revoked and invalidated on the server.
          </p>
          <div className="flex items-center space-x-1.5 text-[11px] text-[var(--text-muted)] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
            <span>Placement practice progress is safely stored.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick(700);
              onClose();
            }}
            disabled={isSigningOut}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--danger)] hover:bg-red-600 text-white text-xs font-semibold transition active:scale-[0.98] shadow-sm flex items-center justify-center space-x-2"
          >
            {isSigningOut ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Logout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
