import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Enterprise Production Error Boundary
 * Catches JavaScript errors anywhere in their child component tree,
 * logs errors safely, and displays a resilient theatrical fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[TheatricalErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="theatrical-error-boundary-container"
          role="alert"
          aria-live="assertive"
          className="min-h-[50vh] w-full flex items-center justify-center p-6 bg-[#121214] border border-red-900/40 rounded-xl my-6 shadow-2xl text-stone-200"
        >
          <div className="max-w-md w-full text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-red-950/80 border border-red-800 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="font-serif-tc text-lg font-bold text-amber-200 tracking-wide">
                {this.props.fallbackTitle || '舞台幕後訊號調適中'}
              </h2>
              <p className="text-xs text-stone-400 font-sans leading-relaxed">
                {this.props.fallbackMessage ||
                  '組件渲染遭遇偶發非預期例外。已自動啟動防護隔離機制，系統其餘區塊與離線快取資料不受影響。'}
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/50 border border-stone-800 rounded p-3 text-[11px] font-mono text-red-300/80 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-sans font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重試此區塊</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#8c2d2d] hover:bg-[#a63535] text-white text-xs font-sans font-bold shadow transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>重新整理頁面</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
