/**
 * @file   ErrorBoundary.tsx
 * @module ErrorBoundary
 * @description React Error Boundary — catches rendering errors in child
 *              components and displays a graceful fallback UI instead of
 *              crashing the entire application.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies react, lucide-react
 * @exports      ErrorBoundary (default)
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/** Props accepted by the ErrorBoundary component. */
interface ErrorBoundaryProps {
  /** Child components to wrap. */
  children: ReactNode;
  /** Optional custom error message displayed in the fallback UI. */
  fallbackMessage?: string;
}

/** Internal state tracking whether an error has been caught. */
interface ErrorBoundaryState {
  /** Whether a rendering error has occurred. */
  hasError: boolean;
  /** The caught Error object (for logging context). */
  error: Error | null;
}

/**
 * ErrorBoundary — Class component that implements React's error boundary API.
 * Catches JavaScript errors in child component trees and renders a recovery UI.
 *
 * @example
 *   <ErrorBoundary fallbackMessage="Chat failed.">
 *     <ChatInterface />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Derives error state from a caught rendering error.
   *
   * @param {Error} error - The caught rendering error.
   * @returns {ErrorBoundaryState} Updated state with error details.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // React requires this lifecycle for error boundary observability hooks.
  }

  /**
   * Resets the error state so the child tree can re-render.
   */
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
