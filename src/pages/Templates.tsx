import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, FileText, Upload, Plus, X, Sparkles, FolderUp, CheckCircle2 } from 'lucide-react';
import { ResumeTemplate } from '../types.js';
import { api } from '../lib/api.js';

function normalizeTemplate(t: any): ResumeTemplate {
  return {
    id: t.id || `tpl-${Math.random()}`,
    name: t.name || 'Untitled Template',
    description: t.description || '',
    downloadCount: typeof t.downloadCount === 'number' ? t.downloadCount : (typeof t.downloads === 'number' ? t.downloads : 0),
    fileContent: t.fileContent || t.sectionsJson || ''
  };
}

export default function Templates() {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importName, setImportName] = useState('');
  const [importDesc, setImportDesc] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/resume/templates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const list = Array.isArray(data)
          ? data
          : (Array.isArray(data.templates) ? data.templates : []);
        const normalized = list.map(normalizeTemplate);
        setTemplates(normalized);
        setSelectedTemplate(normalized[0] || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (template: ResumeTemplate) => {
    navigator.clipboard.writeText(template.fileContent || '');
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (template: ResumeTemplate) => {
    try {
      await api.post(`/api/resume/templates/${template.id}/download`);
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, downloadCount: (t.downloadCount || 0) + 1 } : t))
      );

      // Trigger a raw text file download
      const element = document.createElement('a');
      const file = new Blob([template.fileContent || ''], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${(template.name || 'Template').replace(/\s+/g, '_')}_Template.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    if (!importName) {
      setImportName(baseName.replace(/[_-]/g, ' '));
    }
    if (!importDesc) {
      setImportDesc(`Custom template imported from ${fileName}`);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.fileContent) {
            setImportContent(parsed.fileContent);
            if (parsed.name) setImportName(parsed.name);
            if (parsed.description) setImportDesc(parsed.description);
          } else {
            setImportContent(JSON.stringify(parsed, null, 2));
          }
        } catch {
          setImportContent(content);
        }
      } else {
        setImportContent(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importName.trim() || !importContent.trim() || importing) return;

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const response = await api.post('/api/resume/templates/import', {
        name: importName.trim(),
        description: importDesc.trim() || 'Custom imported ATS resume template',
        fileContent: importContent.trim()
      });

      const data = await response.json();
      if (data.success && data.template) {
        setTemplates((prev) => [data.template, ...prev]);
        setSelectedTemplate(data.template);
        setImportSuccess('Template imported successfully!');
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportName('');
          setImportDesc('');
          setImportContent('');
          setImportSuccess(null);
        }, 1200);
      } else {
        setImportError(data.error || 'Failed to import template.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Error occurred while saving imported template.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-[var(--bg-base)]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] text-xs font-semibold">Loading ATS-vetted frameworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-[var(--text-primary)]">
      {/* Intro banner with Import Action */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[var(--text-primary)] text-base font-display">ATS-Optimized Frameworks</h3>
            <span className="text-[10px] font-mono font-bold text-[var(--primary)] bg-[var(--primary-soft)] border border-[var(--primary)]/20 px-2 py-0.5 rounded-full">
              {templates.length} Available
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Parser-vetted text frameworks designed to pass screening filters across Full Stack, Data Science, DevOps, Embedded, and Security.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setIsImportModalOpen(true);
            }}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 active:scale-95 cursor-pointer"
          >
            <FolderUp className="w-4 h-4" />
            <span>Import Template</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Templates selector list */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">
              Available Domain Layouts
            </h4>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Select to Preview</span>
          </div>

          <div className="space-y-3.5 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
            {templates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              const isCustom = template.id.startsWith('custom-');
              return (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                  }}
                  className={`border p-4 sm:p-5 rounded-2xl cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-1 ring-[var(--primary)]/30'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-[var(--text-primary)] text-xs font-display">{template.name}</h5>
                        {isCustom && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
                            Custom Imported
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-[var(--text-muted)] flex-shrink-0">
                        {template.downloadCount} downloads
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex space-x-2 mt-3.5 pt-3 border-t border-[var(--border)] justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(template);
                      }}
                      className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-card-hover)] border border-[var(--border)] px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                          <span className="text-[var(--success)]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(template);
                      }}
                      className="text-[10px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Template Detail & Preview Panel */}
        <div className="lg:col-span-7">
          {selectedTemplate ? (
            <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-4 sticky top-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm font-display">
                      {selectedTemplate.name}
                    </h4>
                    {selectedTemplate.id.startsWith('custom-') && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{selectedTemplate.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(selectedTemplate)}
                    className="p-2 bg-transparent hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 border border-[var(--border)]"
                  >
                    {copiedId === selectedTemplate.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                        <span className="text-[var(--success)] text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownload(selectedTemplate)}
                    className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Code/Text Viewer */}
              <div className="relative">
                <div className="p-4 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl overflow-x-auto max-h-[580px] overflow-y-auto">
                  <pre className="text-xs font-mono text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap selection:bg-[var(--primary-soft)] selection:text-white">
                    {selectedTemplate.fileContent}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs">
              Select a template on the left to preview its ATS framework.
            </div>
          )}
        </div>
      </div>

      {/* Import Template Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="relative w-full max-w-2xl border border-[var(--border)] bg-[var(--bg-card)] rounded-2xl p-6 sm:p-7 space-y-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                  <FolderUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                    Import Resume Template
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">
                    Import ATS frameworks from Overleaf, LaTeX, Markdown, or other tools
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-transparent hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications */}
            {importError && (
              <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-xs font-mono">
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className="p-3 bg-[var(--success-soft)] border border-[var(--success)]/30 rounded-xl text-[var(--success)] text-xs font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                <span>{importSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveImport} className="space-y-4">
              {/* File upload drag drop zone */}
              <div className="p-4 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--bg-base)] text-center transition">
                <input
                  type="file"
                  id="template-file-input"
                  accept=".txt,.md,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="template-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <Upload className="w-6 h-6 text-[var(--primary)]" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Upload file from computer (.txt, .md, .json)
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    Or paste markup directly into the editor below
                  </span>
                </label>
              </div>

              {/* Template Name & Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Template Title</label>
                  <input
                    type="text"
                    value={importName}
                    onChange={(e) => setImportName(e.target.value)}
                    placeholder="e.g. Quantitative Developer ATS Framework"
                    required
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Category / Role Target</label>
                  <input
                    type="text"
                    value={importDesc}
                    onChange={(e) => setImportDesc(e.target.value)}
                    placeholder="e.g. Custom framework tailored for FinTech roles"
                    className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Template Content */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Template Raw Markup / Text</label>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Markdown or Plain Text</span>
                </div>
                <textarea
                  rows={8}
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  placeholder="# [Candidate Name]&#10;[Contact Info] | [LinkedIn]&#10;&#10;## EDUCATION&#10;...&#10;&#10;## TECHNICAL SKILLS&#10;..."
                  required
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl p-3.5 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] leading-relaxed"
                />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-card-hover)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !importName.trim() || !importContent.trim()}
                  className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  {importing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save & Add to Templates</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
