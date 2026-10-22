import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { api } from '../lib/api.js';

export default function FeedbackForm() {
  const [category, setCategory] = useState<'interview' | 'resume' | 'general'>('interview');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    setSuccess(false);

    try {
      const response = await api.post('/api/feedback', { category, rating, comment });

      if (response.ok) {
        setSuccess(true);
        setComment('');
        setRating(5);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-8 text-[var(--text-primary)]">
      {/* Intro banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-2xl space-y-1">
        <h3 className="font-bold text-[var(--text-primary)] text-sm font-display">Submit Platform Feedback</h3>
        <p className="text-xs text-[var(--text-secondary)]">Your ratings and reviews are shared directly with placement coordinators to optimize prep drives.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
        <h4 className="font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">Feedback Details</h4>

        {success && (
          <div className="p-3 bg-[var(--success-soft)] border border-[var(--success)]/20 rounded-xl text-[var(--success)] text-xs flex items-center space-x-1.5 font-semibold">
            <CheckCircle className="w-4.5 h-4.5 text-[var(--success)] flex-shrink-0" />
            <span>Thank you! Your feedback has been received and logged.</span>
          </div>
        )}

        {/* Category Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Audit Category</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'interview', label: 'Mock Interviews' },
              { id: 'resume', label: 'Resume Scanning' },
              { id: 'general', label: 'General Quality' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as any)}
                className={`p-3 text-xs font-semibold rounded-xl border text-center transition ${
                  category === cat.id
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-bold'
                    : 'border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--bg-card-hover)] bg-[var(--bg-base)] text-[var(--text-secondary)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating selection (Stars) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Rating Score</label>
          <div className="flex items-center space-x-2 bg-[var(--bg-base)] p-3 rounded-xl border border-[var(--border)] w-fit">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition transform active:scale-95"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating ? 'text-[var(--warning)] fill-[var(--warning)]' : 'text-[var(--border)]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Comments & Suggestions</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you liked, or suggest areas where our AI models could improve evaluation granularity..."
            className="w-full h-36 p-3.5 border border-[var(--border)] rounded-xl text-xs bg-[var(--bg-base)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] leading-relaxed resize-none font-sans"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !comment.trim()}
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 text-white" />
          <span>{submitting ? 'Submitting...' : 'Send Review'}</span>
        </button>
      </form>
    </div>
  );
}
