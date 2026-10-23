import React, { useState } from 'react';
import {
  X,
  FileText,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  Calendar,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ResumeDocument } from '../../types.js';

interface MyResumesModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: ResumeDocument[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
  onCreateNew: () => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export default function MyResumesModal({
  isOpen,
  onClose,
  resumes,
  activeResumeId,
  onSelectResume,
  onCreateNew,
  onDuplicate,
  onRename,
  onDelete
}: MyResumesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = resumes.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.targetRole && r.targetRole.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const startRename = (r: ResumeDocument) => {
    setEditingId(r.id);
    setEditingTitle(r.title);
  };

  const saveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRename(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-base)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                My Resume Documents
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Manage, duplicate, rename, or switch between your tailored resumes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
            aria-label="Close My Resumes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title or role..."
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full sm:w-auto bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Resume</span>
          </button>
        </div>

        {/* List of Resumes */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                {searchTerm ? 'No resumes match your filter.' : 'You have not created any resumes yet.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    onCreateNew();
                    onClose();
                  }}
                  className="bg-[var(--primary)] text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Create Your First Resume
                </button>
              )}
            </div>
          ) : (
            filtered.map((r: ResumeDocument) => {
              const isActive = r.id === activeResumeId;
              const isEditing = editingId === r.id;

              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)]/20 ring-1 ring-[var(--primary)]/40'
                      : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <div className="flex items-center space-x-1 flex-1 max-w-sm">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveRename(r.id)}
                            autoFocus
                            className="w-full bg-[var(--bg-card)] border border-[var(--primary)] rounded px-2 py-0.5 text-xs text-[var(--text-primary)]"
                          />
                          <button
                            onClick={() => saveRename(r.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h4 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                            {r.title}
                          </h4>
                          <button
                            onClick={() => startRename(r)}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {isActive && (
                        <span className="bg-[var(--primary)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
                      <span>Role: <strong className="text-[var(--text-secondary)]">{r.targetRole || 'Not specified'}</strong></span>
                      <span>•</span>
                      <span>Template: <strong className="text-[var(--text-secondary)]">{r.templateId || 'classic-ats'}</strong></span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions & Score */}
                  <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                    <div className="px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-center">
                      <span className="block text-[9px] text-[var(--text-muted)] uppercase font-mono font-bold">ATS Score</span>
                      <span className="text-xs font-bold text-[var(--primary)] font-mono">
                        {r.atsScore ?? 85} / 100
                      </span>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectResume(r.id);
                          onClose();
                        }}
                        className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Open
                      </button>
                    )}

                    <button
                      onClick={() => onDuplicate(r.id)}
                      title="Duplicate this resume"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {deletingId === r.id ? (
                      <div className="flex items-center space-x-1 bg-rose-500/10 border border-rose-500/30 rounded-lg p-1">
                        <span className="text-[10px] text-rose-300 font-semibold px-1">Delete?</span>
                        <button
                          onClick={() => {
                            onDelete(r.id);
                            setDeletingId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-1.5 py-0.5 text-slate-300 text-[10px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(r.id)}
                        disabled={resumes.length <= 1}
                        title={resumes.length <= 1 ? 'Cannot delete your only resume' : 'Delete resume'}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 border border-[var(--border)] transition disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
