import React, { useState, useEffect } from 'react';
import { Sparkles, Database, X, Send, Bot, Check, Copy, ExternalLink, Activity, LogOut } from 'lucide-react';
import { User } from '../types.js';
import { api } from '../lib/api.js';
import { sound } from '../lib/sound.js';

interface NavbarProps {
  user: User;
  title: string;
  onLogout?: () => void;
  onNavigate?: (view: string) => void;
}

interface AiStatus {
  configured: boolean;
  model: string;
  status: 'active' | 'simulation';
  mode: string;
  features: string[];
}

export default function Navbar({ user, title, onLogout, onNavigate }: NavbarProps) {
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch live AI status on mount
    api.get('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAiStatus({
            configured: data.configured,
            model: data.model,
            status: data.status,
            mode: data.mode,
            features: data.features || []
          });
        }
      })
      .catch((err) => console.warn('Could not fetch AI status:', err));
  }, []);

  const handleQuickAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;

    sound.playClick(1000);
    setAsking(true);
    setAiAnswer(null);

    try {
      const response = await api.post('/api/ai/quick-ask', { question: question.trim() });
      const data = await response.json();
      const reply = data.answer || data.response;
      if (data.success && reply) {
        setAiAnswer(reply);
        sound.playChime();
      } else {
        setAiAnswer(data.error || 'Failed to retrieve answer from AI service.');
      }
    } catch (err: any) {
      setAiAnswer('Connection error when communicating with Gemini AI.');
    } finally {
      setAsking(false);
    }
  };

  const handleCopy = () => {
    if (!aiAnswer) return;
    navigator.clipboard.writeText(aiAnswer);
    setCopied(true);
    sound.playClick(1200);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-sidebar)]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3 pl-12 lg:pl-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <h2 className="font-heading text-base sm:text-lg text-[var(--text-primary)] font-bold tracking-[-0.02em]">
            {title}
          </h2>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* System Badges & Interactive Gemini AI Button */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <div className="hidden md:flex items-center space-x-1.5 bg-[var(--bg-card)] border border-[var(--border)] px-2.5 py-1 rounded-md text-[var(--text-secondary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              <Database className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>JSON DB</span>
            </div>

            {/* Interactive Gemini AI Badge / Assistant Trigger */}
            <button
              onClick={() => {
                sound.playClick(1100);
                setIsAiModalOpen(true);
              }}
              className="flex items-center space-x-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] hover:border-[var(--primary)]/50 px-3 py-1.5 rounded-md text-[var(--text-primary)] transition active:scale-95 shadow-none group cursor-pointer"
              title="Click to view Gemini AI Status & Copilot Assistant"
              aria-label="Gemini AI Assistant"
            >
              <span 
                className={`w-2 h-2 rounded-full ${
                  aiStatus?.configured ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--warning)]'
                }`} 
              />
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] group-hover:text-[var(--primary-hover)] transition" />
              <span className="font-medium text-xs">Gemini AI</span>
            </button>
          </div>

          {/* User profile */}
          <div className="flex items-center space-x-3 border-l border-[var(--border)] pl-3.5 sm:pl-5">
            <img
              src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-[var(--border)] object-cover"
            />
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-medium text-[var(--text-primary)] tracking-tight leading-snug">{user.name}</span>
              <span className="block text-[10px] text-[var(--text-muted)] font-mono uppercase">{user.role}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick(700);
                  onLogout();
                }}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--danger-soft)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]/30 transition text-xs"
                title="Sign out of current session"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Gemini AI Status & Quick Copilot Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="relative w-full max-w-lg border border-[var(--border)] bg-[var(--bg-card)] rounded-2xl shadow-none p-6 space-y-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow accent */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[var(--primary-soft)] rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                      Gemini AI Engine
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      aiStatus?.configured
                        ? 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/30'
                        : 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30'
                    }`}>
                      {aiStatus?.status === 'active' ? 'Live Gemini Connected' : 'Realistic Simulation Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">
                    Model: {aiStatus?.model || 'gemini-2.5-flash'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playClick(800);
                  setIsAiModalOpen(false);
                }}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Capabilities Info */}
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[var(--primary)]" /> Active Capabilities
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">Real-time Inference</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(aiStatus?.features || [
                  'ATS Resume Scanner',
                  'Technical Question Generator',
                  'SSE Answer Evaluator',
                  'Dynamic Follow-up Engine'
                ]).map((f, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)]">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Ask Copilot Form */}
            <form onSubmit={handleQuickAsk} className="space-y-3">
              <label className="block text-xs font-semibold text-[var(--text-primary)] font-heading">
                Quick Interview Copilot
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a technical concept (e.g. CAP theorem, STAR method, React Virtual DOM)..."
                  className="flex-1 bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition"
                  disabled={asking}
                />
                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-none"
                >
                  {asking ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Ask</span>
                      <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* AI Response Display */}
            {aiAnswer && (
              <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)] space-y-2 relative">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--primary)]">
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" /> Gemini Mentor Response
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                    title="Copy Answer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans">
                  {aiAnswer}
                </p>
              </div>
            )}

            {/* Environment setup hint */}
            {!aiStatus?.configured && (
              <p className="text-[10px] text-[var(--text-muted)] font-mono leading-relaxed">
                💡 <span className="text-[var(--text-secondary)]">Pro Tip:</span> To enable live Google Gemini AI inference, provide your <code className="text-[var(--text-primary)]">GEMINI_API_KEY</code> in <code className="text-[var(--text-primary)]">.env</code>.
              </p>
            )}

            {/* Link to Full Chatbot Page */}
            {onNavigate && (
              <button
                onClick={() => {
                  setIsAiModalOpen(false);
                  onNavigate('career-assistant');
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold transition"
              >
                <Bot className="w-4 h-4" />
                <span>Open Full Career Assistant Chat</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
