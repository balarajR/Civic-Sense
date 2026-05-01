import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionHub from './ActionHub';

// Mock motion/react — filter out framer-motion props to avoid React DOM warnings
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

/**
 * ActionHub renders LiveResults by default, which has a useEffect that
 * calls fetch() + setInterval(). We must:
 *   1. Mock global.fetch to resolve immediately
 *   2. Wrap every render in act() so React flushes all state updates
 *   3. Clean up timers to prevent leaking intervals
 */

const mockElectionData = {
  timestamp: '2026-04-30T14:32:00Z',
  source: 'ECI',
  status: 'live',
  national: {
    totalConstituencies: 543,
    declared: 312,
    leading: 231,
    parties: [],
  },
  turnout: {
    nationalAverage: '67.4%',
    highestState: { name: 'Lakshadweep', value: '84.5%' },
    lowestState: { name: 'Bihar', value: '52.3%' },
  },
};

describe('ActionHub Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockElectionData),
      })
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render all four tool tabs', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    expect(screen.getByRole('tab', { name: /live election data/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /polling booth/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /compare candidates/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ECI election rules/i })).toBeInTheDocument();
  });

  it('should show Live Results as active by default', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    const liveTab = screen.getByRole('tab', { name: /live election data/i });
    expect(liveTab).toHaveAttribute('aria-selected', 'true');
    expect(liveTab).toHaveClass('bg-black');
  });

  it('should switch to Booth Finder on tab click', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    const boothTab = screen.getByRole('tab', { name: /polling booth/i });
    await act(async () => {
      fireEvent.click(boothTab);
    });
    expect(boothTab).toHaveAttribute('aria-selected', 'true');
    expect(boothTab).toHaveClass('bg-black');
  });

  it('should switch to Candidate Comparator on tab click', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    const compareTab = screen.getByRole('tab', { name: /compare candidates/i });
    await act(async () => {
      fireEvent.click(compareTab);
    });
    expect(compareTab).toHaveAttribute('aria-selected', 'true');
    expect(compareTab).toHaveClass('bg-black');
  });

  it('should switch to ECI Guidelines on tab click', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    const rulesTab = screen.getByRole('tab', { name: /ECI election rules/i });
    await act(async () => {
      fireEvent.click(rulesTab);
    });
    expect(rulesTab).toHaveAttribute('aria-selected', 'true');
    expect(rulesTab).toHaveClass('bg-black');
  });

  it('should only highlight one tab at a time', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    const boothTab = screen.getByRole('tab', { name: /polling booth/i });
    const liveTab = screen.getByRole('tab', { name: /live election data/i });

    await act(async () => {
      fireEvent.click(boothTab);
    });
    expect(boothTab).toHaveAttribute('aria-selected', 'true');
    expect(liveTab).toHaveAttribute('aria-selected', 'false');
  });

  it('should render the tablist container with proper ARIA', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    expect(screen.getByRole('tablist', { name: /Action Hub tool selector/i })).toBeInTheDocument();
  });

  it('should render the tabpanel container', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    expect(screen.getByRole('tabpanel', { name: /active tool content/i })).toBeInTheDocument();
  });

  it('should render the region with proper label', async () => {
    await act(async () => {
      render(<ActionHub />);
    });
    expect(screen.getByRole('region', { name: /Action Hub tools/i })).toBeInTheDocument();
  });
});
