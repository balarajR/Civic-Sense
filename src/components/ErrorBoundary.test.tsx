import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Suppress console.error noise from React's error boundary logging
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

/** Component that throws on render */
function BrokenComponent(): React.ReactElement {
  throw new Error('Test crash');
}

/** Normal child component */
function GoodComponent(): React.ReactElement {
  return <div>All systems operational</div>;
}

describe('ErrorBoundary Component', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('All systems operational')).toBeInTheDocument();
  });

  it('should render fallback UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render the Retry button', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should show default fallback message', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(
      screen.getByText(/An unexpected error occurred/)
    ).toBeInTheDocument();
  });

  it('should show custom fallback message when provided', () => {
    render(
      <ErrorBoundary fallbackMessage="Custom error message here">
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error message here')).toBeInTheDocument();
  });

  it('should have role="alert" on error fallback', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
