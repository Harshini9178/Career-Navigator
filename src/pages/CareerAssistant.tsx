import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Plus,
  MessageSquare,
  GraduationCap,
  Code2,
  AlertTriangle,
  ChevronRight,
  X,
  Menu,
  Briefcase,
  HelpCircle,
  Bug,
  BookOpen
} from 'lucide-react';
import { User, ChatMessage, ConversationSummary } from '../types.js';
import { api } from '../lib/api.js';
import { sound } from '../lib/sound.js';

interface CareerAssistantProps {
  user: User;
  onNavigate?: (view: string) => void;
}

const SUGGESTED_PROMPTS = [
  {
    icon: Code2,
    category: 'Technical Doubt',
    text: 'Explain Java inheritance with an example.'
  },
  {
    icon: GraduationCap,
    category: 'Placement Prep',
    text: 'Help me prepare for a technical interview.'
  },
  {
    icon: Bug,
    category: 'Debugging',
    text: 'Explain this programming error.'
  },
  {
    icon: Briefcase,
    category: 'Resume Guidance',
    text: 'Review my resume for a Java developer role.'
  },
  {
    icon: BookOpen,
    category: 'Study Roadmap',
    text: 'Give me a 30-day placement preparation plan.'
  },
  {
    icon: HelpCircle,
    category: 'Mock Practice',
    text: 'Ask me Java interview questions one by one.'
  }
];

interface CodeBlockProps {
  key?: React.Key;
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    sound.playClick(1200);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[var(--border)] bg-[#0B0F19] shadow-md text-xs font-mono">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#131B2E] border-b border-[var(--border)] text-[10px] text-slate-400">
        <span className="font-bold uppercase tracking-wider text-blue-400">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 hover:text-white transition px-2 py-0.5 rounded hover:bg-slate-800"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-slate-200 leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedContent({ text }: { text: string }) {
  if (!text) return null;

  // Split content by fenced code blocks (```lang ... ```)
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-[var(--text-primary)] break-words">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = part.substring(3, firstLineEnd).trim();
          const code = part.substring(firstLineEnd + 1, part.length - 3).replace(/\n$/, '');
          return <CodeBlock key={index} language={lang} code={code} />;
        }

        // Parse markdown paragraphs, lists, bold text, and inline code
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-1" />;

              // Heading 3
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lineIdx} className="font-bold text-sm text-[var(--text-primary)] mt-3 mb-1 font-heading">
                    {parseInline(trimmed.substring(4))}
                  </h4>
                );
              }
              // Heading 2
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lineIdx} className="font-bold text-base text-[var(--primary)] mt-3 mb-1 font-heading border-b border-[var(--border)] pb-1">
                    {parseInline(trimmed.substring(3))}
                  </h3>
                );
              }
              // Bullet item
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lineIdx} className="flex items-start space-x-2 pl-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-1.5 flex-shrink-0" />
                    <span className="flex-1">{parseInline(trimmed.substring(2))}</span>
                  </div>
                );
              }
              // Numbered item
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lineIdx} className="flex items-start space-x-2 pl-2">
                    <span className="font-mono text-[10px] font-bold text-[var(--primary)] flex-shrink-0 mt-0.5">
                      {numMatch[1]}.
                    </span>
                    <span className="flex-1">{parseInline(numMatch[2])}</span>
                  </div>
                );
              }
              // Regular paragraph
              return <p key={lineIdx}>{parseInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function parseInline(str: string): React.ReactNode {
  // Replace inline code (`...`) and bold (**...**)
  const segments = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return segments.map((seg, i) => {
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border)] font-mono text-[11px] text-[var(--primary)]">
          {seg.substring(1, seg.length - 1)}
        </code>
      );
    }
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
      return (
        <strong key={i} className="font-bold text-[var(--text-primary)]">
          {seg.substring(2, seg.length - 2)}
        </strong>
      );
    }
    return seg;
  });
}

export default function CareerAssistant({ user }: CareerAssistantProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [candidateContext, setCandidateContext] = useState<Record<string, any>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. Initial Load: Check AI status, fetch conversation history, and user's profile context
  useEffect(() => {
    api.get('/api/ai/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAiConfigured(Boolean(data.configured));
        }
      })
      .catch(() => setAiConfigured(false));

    loadConversations();

    // Load active resume ATS insights for context-aware assistance
    api.get('/api/resume/my-analysis')
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        const item = resData?.analysis || resData;
        const ctx: Record<string, any> = {
          targetRole: user.targetRole || 'Software Engineer',
          branch: user.branch || 'Engineering',
          skills: user.skills || []
        };
        if (item && item.atsScore) {
          ctx.latestAtsScore = item.atsScore;
          if (item.skills && item.skills.length > 0) {
            ctx.skills = item.skills;
          }
        }
        setCandidateContext(ctx);
      })
      .catch(() => {
        setCandidateContext({
          targetRole: user.targetRole || 'Software Engineer',
          branch: user.branch || 'Engineering',
          skills: user.skills || []
        });
      });
  }, [user]);

  // 2. Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/api/ai/conversations');
      if (res.ok) {
        const text = await res.text();
        const list = text ? JSON.parse(text) : [];
        setConversations(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.warn('Failed to fetch conversation list:', e);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    sound.playClick(900);
    setActiveConversationId(convId);
    setSidebarOpen(false);

    try {
      const res = await api.get(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const text = await res.text();
        const detail = text ? JSON.parse(text) : null;
        if (detail && Array.isArray(detail.messages)) {
          setMessages(detail.messages);
          if (typeof detail.learningMode === 'boolean') {
            setLearningMode(detail.learningMode);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load conversation details:', e);
    }
  };

  const handleStartNewChat = () => {
    sound.playClick(1000);
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setSidebarOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClearAllHistory = async () => {
    sound.playClick(700);
    try {
      const res = await api.delete('/api/ai/conversations');
      if (res.ok) {
        setConversations([]);
        setActiveConversationId(null);
        setMessages([]);
        setShowClearConfirm(false);
      }
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sound.playClick(600);
    try {
      const res = await api.delete(`/api/ai/conversations/${id}`);
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          handleStartNewChat();
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend !== undefined ? textToSend : input;
    const query = rawText.trim();
    if (!query || loading) return;

    sound.playClick(1100);
    setLoading(true);

    const tempUserMsgId = `temp-user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      learningMode
    };

    // Optimistically append user message
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const payload = {
        conversationId: activeConversationId || undefined,
        message: query,
        learningMode,
        careerContext: candidateContext
      };

      const res = await api.post('/api/ai/chat', payload);
      let data: any = null;
      try {
        const rawBody = await res.text();
        if (rawBody && rawBody.trim()) {
          data = JSON.parse(rawBody);
        }
      } catch {
        data = null;
      }

      if (res.ok && data && data.success && data.message) {
        sound.playChime();
        setMessages((prev) => [...prev, data.message]);

        if (data.conversationId) {
          setActiveConversationId(data.conversationId);
          loadConversations();
        }
      } else {
        sound.playClick(350);
        const errContent =
          (data && (data.error?.message || data.error || data.message)) ||
          (!res.ok
            ? `Server returned status ${res.status} (${res.statusText || 'Error'})`
            : 'The AI service returned an empty or invalid response. Please retry.');

        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: errContent,
          timestamp: new Date().toISOString(),
          error: true,
          learningMode
        };
        setMessages((prev) => [...prev, errorMessage]);
        if (data?.conversationId && !activeConversationId) {
          setActiveConversationId(data.conversationId);
          loadConversations();
        }
      }
    } catch (err: any) {
      sound.playClick(350);
      const networkErrorMessage: ChatMessage = {
        id: `net-err-${Date.now()}`,
        role: 'assistant',
        content: `Network connection error: ${err.message || 'Unable to communicate with the AI backend service.'}. Please ensure the server is running and retry.`,
        timestamp: new Date().toISOString(),
        error: true,
        learningMode
      };
      setMessages((prev) => [...prev, networkErrorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLast = () => {
    // Find the last user message to resubmit
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Filter out trailing error messages AND the failed user message so it does not duplicate
    setMessages((prev) => {
      const list = [...prev];
      while (list.length > 0 && list[list.length - 1].error) {
        list.pop();
      }
      if (list.length > 0 && list[list.length - 1].role === 'user') {
        list.pop();
      }
      return list;
    });

    handleSendMessage(lastUserMsg.content);
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    sound.playClick(1200);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden relative">
      {/* 1. History Drawer / Sidebar */}
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`w-72 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col z-30 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'fixed inset-y-16 left-0 translate-x-0' : 'fixed inset-y-16 left-0 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] font-mono">
              Chat History
            </h3>
          </div>
          <button
            onClick={handleStartNewChat}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold transition"
            title="Start New Conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-[var(--text-muted)]/50" />
              <p>No saved conversations yet.</p>
              <p className="text-[10px]">Start asking placement or technical questions to begin!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition border ${
                    isActive
                      ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] font-semibold'
                      : 'border-transparent hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-start space-x-2 overflow-hidden flex-1 pr-2">
                    <MessageSquare className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                    <div className="overflow-hidden">
                      <p className="truncate font-medium">{conv.title}</p>
                      {conv.lastMessageSnippet && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                          {conv.lastMessageSnippet}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--danger-soft)] text-[var(--text-muted)] hover:text-[var(--danger)] transition"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {conversations.length > 0 && (
          <div className="p-3 border-t border-[var(--border)]">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg border border-[var(--border)] hover:border-[var(--danger)] text-[var(--text-muted)] hover:text-[var(--danger)] text-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </aside>

      {/* 2. Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-base)]">
        {/* Header Controls */}
        <div className="h-14 border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between bg-[var(--bg-card)]/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)]"
              aria-label="Toggle Chat History Drawer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-xs sm:text-sm font-display text-[var(--text-primary)]">
                    Career Assistant
                  </h2>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-muted)]">
                    Mentor & Diagnostic Engine
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Options: Learning Mode & Profile Context Badge */}
          <div className="flex items-center space-x-3">
            {/* Candidate Role & Skills Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-secondary)]">
              <Briefcase className="w-3 h-3 text-[var(--primary)]" />
              <span>Target: {candidateContext.targetRole || 'Software Engineer'}</span>
            </div>

            {/* Learning Mode Toggle */}
            <button
              onClick={() => {
                sound.playClick(1000);
                setLearningMode(!learningMode);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition border ${
                learningMode
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="When enabled, AI explains step-by-step with analogies and practice checks"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Learning Mode:</span>
              <span>{learningMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* AI Service Configuration Alert Banner (if unconfigured) */}
        {aiConfigured === false && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Gemini API Unconfigured:</strong> Live inference requires <code className="bg-black/30 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> in your server environment or <code className="bg-black/30 px-1 py-0.5 rounded font-mono">.env</code>.
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-300 uppercase">Live Model Pending</span>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            /* Welcome Empty State */
            <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-8">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/20">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">
                  Welcome to AI Career Assistant
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
                  Your dedicated technical mentor for solving programming doubts, preparing for placement interviews, refining resume projects, and mastering software architecture.
                </p>
              </div>

              {/* Capability Cards */}
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[var(--primary)] font-bold font-heading">
                    <Code2 className="w-4 h-4" />
                    <span>Technical Doubts</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Java, Python, React, Spring Boot, DSA, Big-O analysis, SQL, and OS.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[var(--accent)] font-bold font-heading">
                    <GraduationCap className="w-4 h-4" />
                    <span>Placement Prep</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Technical & HR interview scenarios, STAR-method answers, and coding rounds.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold font-heading">
                    <Bug className="w-4 h-4" />
                    <span>Debugging Guide</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Paste stack traces, compiler errors, or broken code for root cause fixes.
                  </p>
                </div>
              </div>

              {/* Suggested Starter Prompts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] border-b border-[var(--border)] pb-2">
                  <span>Suggested Starter Questions</span>
                  <span className="text-[10px]">Click any prompt to ask</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.text)}
                        className="text-left p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary)]/60 hover:bg-[var(--bg-card-hover)] transition group flex items-start space-x-2.5"
                      >
                        <div className="p-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-muted)] group-hover:text-[var(--primary)] transition flex-shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="block text-[10px] font-mono text-[var(--text-muted)] uppercase">
                            {item.category}
                          </span>
                          <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition line-clamp-2">
                            {item.text}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition mt-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Message Stream */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isError = Boolean(msg.error);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold border ${
                        isUser
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : isError
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-[var(--bg-card)] text-[var(--primary)] border-[var(--border)]'
                      }`}
                    >
                      {isUser ? user.name?.charAt(0).toUpperCase() || 'U' : isError ? <AlertTriangle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 space-y-2 border ${
                        isUser
                          ? 'bg-[var(--primary-soft)] border-[var(--primary)]/30 text-[var(--text-primary)]'
                          : isError
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                          : 'glass-card bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {/* Meta header on assistant messages */}
                      {!isUser && (
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2 text-[10px] font-mono text-[var(--text-muted)]">
                          <span className="flex items-center space-x-1.5 text-[var(--primary)] font-semibold">
                            <Sparkles className="w-3 h-3" />
                            <span>Career Navigator Mentor</span>
                          </span>

                          <div className="flex items-center space-x-2">
                            {msg.learningMode && (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-semibold">
                                Learning Mode
                              </span>
                            )}
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="hover:text-[var(--text-primary)] transition flex items-center space-x-1"
                              title="Copy Answer"
                            >
                              {copiedMsgId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <FormattedContent text={msg.content} />

                      {/* Error State with Retry Button */}
                      {isError && (
                        <div className="pt-2 flex items-center justify-between border-t border-rose-500/20">
                          <span className="text-[10px] text-rose-400">Request could not be fulfilled.</span>
                          <button
                            onClick={handleRetryLast}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry Question</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing / Generating Indicator */}
              {loading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] flex-shrink-0 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex items-center space-x-3 text-xs text-[var(--text-secondary)] font-mono">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>Consulting Gemini AI placement model...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 3. Input Toolbar */}
        <div className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="relative flex items-end rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] focus-within:border-[var(--primary)] transition shadow-inner">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a technical doubt, placement question, or paste code to debug (Press Enter to send, Shift+Enter for new line)..."
                rows={Math.min(5, Math.max(1, input.split('\n').length))}
                disabled={loading}
                className="w-full resize-none bg-transparent px-4 py-3 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none max-h-32 leading-relaxed"
              />

              <div className="p-2 flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:hover:bg-[var(--primary)] text-white flex items-center justify-center transition shadow-none"
                  title="Send Question (Enter)"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono px-1">
              <span>Enter ↵ to send • Shift + Enter for newline</span>
              <span>Career Navigator AI • Educational & Placement Guidance</span>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal: Clear Chat History */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-[var(--danger)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--danger-soft)] border border-[var(--danger)]/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[var(--text-primary)] font-display">Clear All History?</h4>
                <p className="text-xs text-[var(--text-muted)]">This cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              All stored consultation sessions and technical queries associated with your candidate account will be permanently erased.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-secondary)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllHistory}
                className="px-4 py-2 rounded-xl bg-[var(--danger)] hover:bg-rose-600 text-white text-xs font-semibold transition"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
