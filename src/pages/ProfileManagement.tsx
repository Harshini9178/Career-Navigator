import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, CheckCircle } from 'lucide-react';
import { User } from '../types.js';
import { api } from '../lib/api.js';

interface ProfileProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function ProfileManagement({ user, onProfileUpdate }: ProfileProps) {
  const [branch, setBranch] = useState(user.branch || 'Computer Science');
  const [skills, setSkills] = useState(user.skills ? user.skills.join(', ') : '');
  const [projects, setProjects] = useState(user.projects ? user.projects.join(', ') : '');
  const [targetRole, setTargetRole] = useState(user.targetRole || 'Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || 'Entry Level');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.put('/api/profile', {
        branch,
        skills,
        projects,
        targetRole,
        experienceLevel
      });

      if (!response.ok) {
        throw new Error('Failed to update student profile.');
      }

      const data = await response.json();
      if (data.success && data.user) {
        onProfileUpdate(data.user);
        setMessage('Your Placement Profile has been successfully updated!');
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'An error occurred during save.');
    } finally {
      setLoading(false);
    }
  };

  const BRANCHES = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering'
  ];

  const EXPERIENCE_LEVELS = [
    'Internship',
    'Entry Level',
    'Associate (1-2 Years Experience)'
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 text-[var(--text-primary)]">
      {/* User Identity Card displaying Avatar, Name, Email, Role and Account State */}
      <div className="glass-panel p-6 sm:p-7 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-[var(--border)] bg-[var(--bg-card)] relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* User Picture / Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
            alt={user.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-[var(--primary)]/40 object-cover bg-[var(--bg-base)]"
          />
          <span 
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--success)] border-2 border-[var(--bg-sidebar)]" 
            title="Session active"
          />
        </div>

        {/* User Metadata */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-heading tracking-tight">
              {user.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
              {user.role}
            </span>
            {user.completedProfile && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Profile Configured
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-[var(--text-secondary)] font-mono">
            <span className="flex items-center gap-1 text-[var(--text-primary)]">
              <span>Email:</span>
              <strong className="text-[var(--text-primary)] font-medium">{user.email}</strong>
            </span>
            <span className="text-[var(--border)] hidden sm:inline">•</span>
            <span className="text-[var(--text-muted)]">
              ID: <code className="text-[var(--text-secondary)] bg-[var(--bg-base)] px-1.5 py-0.5 rounded border border-[var(--border)]">{user.id}</code>
            </span>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-md bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)]">
              Target: <span className="text-[var(--primary)] font-semibold">{user.targetRole || 'Not specified'}</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)]">
              Branch: <span className="text-[var(--text-primary)]">{user.branch || 'General'}</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)]">
              Level: <span className="text-[var(--text-primary)]">{user.experienceLevel || 'Entry'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Intro header */}
      <div className="glass-panel p-5 rounded-2xl space-y-1 border border-[var(--border)] bg-[var(--bg-card)]">
        <h3 className="font-bold text-[var(--text-primary)] text-xs font-mono uppercase tracking-wider">Placement Interview Customization</h3>
        <p className="text-xs text-[var(--text-secondary)]">Configure your target roles and technical skills. AI questions are dynamically custom-generated based on these values.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
        <h4 className="font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">Student Profile Settings</h4>

        {message && (
          <div className="p-3 bg-[var(--success-soft)] border border-[var(--success)]/30 rounded-xl text-[var(--success)] text-xs flex items-center space-x-1.5 font-semibold">
            <CheckCircle className="w-4.5 h-4.5 text-[var(--success)] flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Branch Selection */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Engineering Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full p-3 border border-[var(--border)] rounded-xl text-xs bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{b}</option>
              ))}
            </select>
          </div>

          {/* Target Job Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Target Career Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Full Stack Engineer, Systems Associate"
              className="w-full p-3 border border-[var(--border)] rounded-xl text-xs bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              required
            />
          </div>
        </div>

        {/* Experience Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Experience Profile Segment</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full p-3 border border-[var(--border)] rounded-xl text-xs bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level} value={level} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{level}</option>
            ))}
          </select>
        </div>

        {/* Skills input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Core Technical Competencies (Comma-separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, SQL, Node.js, Spring Boot"
            className="w-full p-3 border border-[var(--border)] rounded-xl text-xs bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            required
          />
          <span className="block text-[10px] text-[var(--text-muted)]">Provide direct technologies to receive accurate coding and design challenges.</span>
        </div>

        {/* Projects list */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Key Projects Undertaken (Comma-separated)</label>
          <input
            type="text"
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="AI Platform, Weather Widget, Academic Management System"
            className="w-full p-3 border border-[var(--border)] rounded-xl text-xs bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            required
          />
          <span className="block text-[10px] text-[var(--text-muted)]">AI-interview engines will generate specific questions targeting these project structures.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving and restructuring prompts...</span>
            </>
          ) : (
            <span>Save Settings & Unlock Interviews</span>
          )}
        </button>
      </form>
    </div>
  );
}

// Simple local Refresh icon
function RefreshCw(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
