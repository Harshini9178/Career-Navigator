import React, { useState } from 'react';
import { X, Check, Eye, Layout, ShieldCheck, Sparkles } from 'lucide-react';
import { ATS_TEMPLATES, TemplateDefinition } from './ResumeTemplates.js';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
}

export default function TemplateGalleryModal({
  isOpen,
  onClose,
  activeTemplateId,
  onSelectTemplate
}: TemplateGalleryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'ATS Universal', 'Engineering', 'Career Level', 'Domain'];

  const filteredTemplates = selectedCategory === 'All'
    ? ATS_TEMPLATES
    : ATS_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-base)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                ATS Template Studio Gallery
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                8 structurally distinct, single-column and recruiter-approved ATS layouts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
            aria-label="Close template gallery"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-2 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-card)] overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredTemplates.map((template: TemplateDefinition) => {
            const isSelected = activeTemplateId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template.id);
                  onClose();
                }}
                className={`group relative rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]/20 ring-2 ring-[var(--primary)]/40 shadow-lg'
                    : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                <div>
                  {/* Miniature Skeleton / Layout Graphic */}
                  <div className="w-full h-36 rounded-lg bg-white p-3 mb-3 border border-slate-200 overflow-hidden shadow-inner flex flex-col space-y-1.5 opacity-90 group-hover:opacity-100 transition">
                    <div className="w-1/2 h-2.5 bg-slate-900 rounded-sm mx-auto" />
                    <div className="w-1/3 h-1 bg-slate-500 rounded-sm mx-auto" />
                    <div className="w-2/3 h-0.5 bg-slate-300 rounded-sm mx-auto mb-1" />
                    <div className="h-0.5 bg-slate-900 w-full mb-1" />
                    {/* Simulated content bars */}
                    <div className="space-y-1">
                      <div className="w-1/4 h-1.5 bg-slate-800 rounded-sm" />
                      <div className="w-full h-1 bg-slate-300 rounded-sm" />
                      <div className="w-5/6 h-1 bg-slate-300 rounded-sm" />
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="w-1/3 h-1.5 bg-slate-800 rounded-sm" />
                      <div className="w-full h-1 bg-slate-300 rounded-sm" />
                      <div className="w-4/5 h-1 bg-slate-300 rounded-sm" />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] font-semibold uppercase">
                      {template.category}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${template.atsBadgeColor}`}>
                      {template.atsScoreRating}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    {template.name}
                  </h3>
                  <p className="text-[10px] text-[var(--primary)] font-medium mb-1">
                    {template.subtitle}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-3">
                    {template.description}
                  </p>
                </div>

                <div className="border-t border-[var(--border)] pt-2 mt-2">
                  <p className="text-[9px] text-[var(--text-muted)] italic mb-3">
                    Target: {template.recommendedFor}
                  </p>
                  <button
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:border-[var(--primary)]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active Template</span>
                      </>
                    ) : (
                      <span>Select Template</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
