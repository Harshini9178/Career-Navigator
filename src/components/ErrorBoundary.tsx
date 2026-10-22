import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an unhandled component error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl border border-[var(--danger)]/30 text-center space-y-5 bg-[var(--bg-card)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--danger-soft)] border border-[var(--danger)]/20 text-[var(--danger)] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-sans">
                {this.props.fallbackTitle || 'Something went wrong in this module'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                An unexpected interface error occurred. You can retry rendering this view or refresh the platform.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[var(--bg-base)] border border-[var(--border)] p-3 rounded-xl text-left overflow-x-auto max-h-32">
                <code className="text-[11px] font-mono text-[var(--danger)] break-words">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-transparent hover:bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold transition"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
