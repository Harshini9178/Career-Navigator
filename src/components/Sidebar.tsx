import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  FileEdit,
  Video,
  Bot,
  User,
  MessageSquare,
  LogOut,
  Users,
  PieChart,
  Menu,
  X,
  Brain
} from 'lucide-react';
import { User as UserType } from '../types.js';
import SignOutModal from './SignOutModal.js';
import { getAvatarSrc } from '../lib/avatars.js';
import { sound } from '../lib/sound.js';

interface SidebarProps {
  user: UserType;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, currentView, onNavigate, onLogout }: SidebarProps) {
  const isAdmin = user.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const studentLinks = [
    { view: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'resume-builder', label: 'Resume Builder', icon: FileEdit },
    { view: 'career-assistant', label: 'AI Career Assistant', icon: Bot },
    { view: 'resume-analyzer', label: 'Resume Analyzer', icon: FileText },
    { view: 'interview-prep', label: 'Mock Interviews', icon: Video },
    { view: 'aptitude', label: 'Aptitude Assessment', icon: Brain },
    { view: 'profile', label: 'Profile', icon: User },
    { view: 'feedback', label: 'Feedback', icon: MessageSquare }
  ];

  const adminLinks = [
    { view: 'admin-dashboard', label: 'Analytics Panel', icon: PieChart },
    { view: 'admin-students', label: 'Registered Students', icon: Users },
    { view: 'admin-feedbacks', label: 'Student Feedback', icon: MessageSquare }
  ];

  const activeLinks = isAdmin ? adminLinks : studentLinks;

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border)] space-x-3 bg-[var(--bg-sidebar)]">
        <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
        <div>
          <span className="font-heading font-bold text-sm text-[var(--text-primary)] tracking-tight block">
            Career Navigator
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono block">
            {isAdmin ? 'Admin Portal' : 'Interview Workspace'}
          </span>
        </div>
      </div>

      {/* User Information Profile Box */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-sidebar)]">
        <div className="flex items-center space-x-3">
          <img
            src={getAvatarSrc(user.picture)}
            alt={user.name}
            className="w-9 h-9 rounded-full border border-[var(--border)] object-cover bg-slate-900"
          />
          <div className="overflow-hidden flex-1">
            <span className="block font-medium text-xs text-[var(--text-primary)] truncate">{user.name}</span>
            <span className="block text-[10px] text-[var(--text-muted)] truncate font-mono">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav aria-label="Main Navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
        <span className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] px-3 mb-2">
          Navigation
        </span>

        {activeLinks.map((link) => {
          const Icon = link.icon;
          const isActive = currentView === link.view;

          return (
            <button
              key={link.view}
              onClick={() => handleNavigate(link.view)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full group flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`} aria-hidden="true" />
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-sidebar)]">
        <button
          onClick={() => {
            sound.playClick(700);
            setShowSignOutModal(true);
          }}
          aria-label="Log Out of Career Navigator"
          className="w-full flex items-center space-x-3 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-md text-xs font-medium transition"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-4 z-50 w-9 h-9 rounded-md bg-[var(--bg-sidebar)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center shadow-sm"
        aria-label={mobileOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="w-4 h-4" aria-hidden="true" /> : <Menu className="w-4 h-4" aria-hidden="true" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-[var(--bg-sidebar)] border-r border-[var(--border)] text-[var(--text-primary)] flex-col h-screen fixed top-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 w-60 bg-[var(--bg-sidebar)] border-r border-[var(--border)] text-[var(--text-primary)] flex flex-col h-screen z-40 transform transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Interactive Sign-Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirmLogout={onLogout}
      />
    </>
  );
}
