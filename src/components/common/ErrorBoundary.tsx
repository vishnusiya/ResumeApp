import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetApp = () => {
    try {
      localStorage.removeItem('ai_resume_editor_data_v2');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  private handleTryRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-900 p-6 text-slate-100 font-sans">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Editor Encountered an Issue
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected state error occurred while rendering the workspace. You can reset to a clean default template or attempt to recover your session.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-700/60 rounded-xl text-left font-mono text-[11px] text-red-400 max-h-28 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleResetApp}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Clean Template</span>
              </button>

              <button
                onClick={this.handleTryRecover}
                className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Recovering</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
