import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches rendering errors in child components
 * and displays a graceful fallback UI instead of crashing the entire app.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught rendering error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center p-8 bg-red-50 border-2 border-black text-center"
        >
          <AlertTriangle size={48} strokeWidth={3} className="text-red-600 mb-4" />
          <h2 className="text-lg font-black uppercase mb-2">Something went wrong</h2>
          <p className="text-sm font-bold text-slate-600 mb-6 max-w-md">
            {this.props.fallbackMessage ||
              "An unexpected error occurred. Please try refreshing this section."}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 font-black uppercase text-sm border-2 border-black hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={16} strokeWidth={3} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
