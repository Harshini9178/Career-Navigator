import React, { useState } from 'react';
import { X, Sparkles, Check, RefreshCw, Wand2, ArrowRight } from 'lucide-react';
import { ResumeContent } from '../../types.js';
import { api } from '../../lib/api.js';

interface AiSummaryHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: string;
  content: ResumeContent;
  onApplySummary: (summary: string) => void;
}

export default function AiSummaryHelperModal({
  isOpen,
  onClose,
  targetRole,
  content,
  onApplySummary
}: AiSummaryHelperModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
  const [editableSuggestion, setEditableSuggestion] = useState<string>('');

  if (!isOpen) return null;

  // Build role & skill grounded prompts
  const skillsList = [
    ...(content.skills?.programmingLanguages || []),
    ...(content.skills?.frameworks || []),
    ...(content.skills?.toolsPlatforms || [])
  ].slice(0, 8);

  const expSummary = (content.experience || [])
    .map((e) => `${e.jobTitle} at ${e.company}`)
    .slice(0, 2)
    .join(', ');

  const generateLocalRoleSuggestions = (): string[] => {
    const role = targetRole || 'Software Engineer';
    const topSkills = skillsList.length > 0 ? skillsList.slice(0, 4).join(', ') : 'modern tech stacks';

    return [
      `Results-oriented ${role} with practical experience building reliable, maintainable software systems using ${topSkills}. Demonstrated track record in high-quality feature delivery, microservice architectures, and cross-functional team collaboration.`,
      `Detail-driven ${role} proficient in scalable cloud deployments, automated testing, and agile engineering practices with ${topSkills}. Passionate about clean code, performance optimization, and solving real-world business challenges.`,
      `Innovative ${role} combining strong analytical foundations with hands-on proficiency in ${topSkills}. Experienced in full software lifecycle development from system design to production deployment and monitoring.`
    ];
  };

  const suggestions = generateLocalRoleSuggestions();

  const handleSelect = (s: string) => {
    setSelectedSuggestion(s);
    setEditableSuggestion(s);
  };

  const handleApply = () => {
    if (editableSuggestion.trim()) {
      onApplySummary(editableSuggestion.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-base)]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                Role-Aligned Professional Summary Assistant
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Tailored suggestions based on your target role: <strong className="text-purple-300">{targetRole || 'Software Engineer'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestions List */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Select a candidate summary option below. You can edit the text to adjust nuances before accepting.
          </p>

          <div className="space-y-3">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(s)}
                className={`p-3.5 rounded-xl border cursor-pointer transition text-xs leading-relaxed ${
                  selectedSuggestion === s
                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30 text-[var(--text-primary)]'
                    : 'border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-purple-400 font-bold uppercase">
                    Option 0{idx + 1}
                  </span>
                  {selectedSuggestion === s && (
                    <span className="text-[10px] text-purple-300 font-bold flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Selected</span>
                    </span>
                  )}
                </div>
                <p>{s}</p>
              </div>
            ))}
          </div>

          {/* Editable text area */}
          {editableSuggestion && (
            <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                Review & Customize Before Applying
              </label>
              <textarea
                rows={3}
                value={editableSuggestion}
                onChange={(e) => setEditableSuggestion(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-y leading-relaxed"
              />
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {editableSuggestion.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-base)] flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!editableSuggestion.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Apply Summary</span>
          </button>
        </div>
      </div>
    </div>
  );
}
