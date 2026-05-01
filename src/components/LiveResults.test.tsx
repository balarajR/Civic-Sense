import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LiveResults from './LiveResults';

// Mock motion/react — filter out framer-motion props to avoid React DOM warnings
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
}));

const mockApiResponse = {
  timestamp: '2026-04-30T14:32:00Z',
  source: 'Election Commission of India',
  status: 'live',
  national: {
    totalConstituencies: 543,
    declared: 312,
    leading: 231,
    parties: [
      { name: 'Party Alpha', acronym: 'PA', won: 180, leading: 42, total: 222, color: 'bg-orange-500' },
      { name: 'Party Beta', acronym: 'PB', won: 90, leading: 22, total: 112, color: 'bg-blue-500' },
      { name: 'Party Gamma', acronym: 'PG', won: 42, leading: 10, total: 52, color: 'bg-green-500' },
    ],
  },
  turnout: {
    nationalAverage: '67.4%',
    highestState: { name: 'Lakshadweep', value: '84.5%' },
    lowestState: { name: 'Bihar', value: '52.3%' },
  },
};

describe('LiveResults Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should show loading state initially', () => {
    global.fetch = vi.fn(
      () => new Promise(() => {}) // never resolves
    ) as unknown as typeof fetch;

    render(<LiveResults />);
    expect(screen.getByText(/Establishing SECURE Connection/i)).toBeInTheDocument();
  });

  it('should display election data after successful fetch', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText('543')).toBeInTheDocument();
    expect(screen.getByText('312')).toBeInTheDocument();
    expect(screen.getByText('231')).toBeInTheDocument();
    expect(screen.getByText('67.4%')).toBeInTheDocument();
  });

  it('should render the Live Analytics heading', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText('Live Analytics')).toBeInTheDocument();
  });

  it('should display data source attribution', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText(/Election Commission of India/i)).toBeInTheDocument();
  });

  it('should apply spin animation to refresh button while loading', async () => {
    let resolvePromise: (value: any) => void;
    
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      }))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolvePromise = resolve;
      })) as unknown as typeof fetch;

    render(<LiveResults />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Refresh election results data/i)).toBeInTheDocument();
    });
    const refreshBtn = screen.getByLabelText(/Refresh election results data/i);
    fireEvent.click(refreshBtn);
    
    expect(refreshBtn.querySelector('svg')).toHaveClass('animate-spin');
    
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });
    });
  });

  it('should render party names and seat counts', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText(/Party Alpha \(PA\)/)).toBeInTheDocument();
    expect(screen.getByText(/Party Beta \(PB\)/)).toBeInTheDocument();
    expect(screen.getByText(/Party Gamma \(PG\)/)).toBeInTheDocument();
    expect(screen.getByText('222')).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText('52')).toBeInTheDocument();
  });

  it('should display won/leading breakdown per party', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText('180 Won / 42 Lead')).toBeInTheDocument();
    expect(screen.getByText('90 Won / 22 Lead')).toBeInTheDocument();
  });

  it('should show error state when fetch fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText(/Failed to load real-time election data/i)).toBeInTheDocument();
  });

  it('should show a Retry button in error state', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText('Retry Connection')).toBeInTheDocument();
  });

  it('should retry fetching data when Retry button is clicked', async () => {
    let callCount = 0;
    global.fetch = vi.fn(() => {
      callCount++;
      if (callCount <= 1) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });
    }) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText('Retry Connection')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Retry Connection'));
    });

    expect(screen.getByText('543')).toBeInTheDocument();
  });

  it('should display the National Trends heading', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText('National Trends')).toBeInTheDocument();
  });

  it('should show last synced timestamp', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText(/Last synced/i)).toBeInTheDocument();
  });

  it('should render the refresh button with proper aria-label', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByLabelText('Refresh election results data')).toBeInTheDocument();
  });

  it('should fallback to Unknown error if non-Error is thrown', async () => {
    global.fetch = vi.fn(() => Promise.reject('Network failure')) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText(/Failed to load real-time election data/i)).toBeInTheDocument();
  });

  it('should fallback to empty array if parties is not an array', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ...mockApiResponse,
          national: { ...mockApiResponse.national, parties: null },
        }),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<LiveResults />);
    });

    expect(screen.getByText('543')).toBeInTheDocument();
    expect(screen.queryByText(/Party Alpha/)).not.toBeInTheDocument();
  });
});
