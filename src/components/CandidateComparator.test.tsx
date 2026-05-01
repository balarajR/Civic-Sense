import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CandidateComparator from './CandidateComparator';

// Mock motion/react — filter out framer-motion props to avoid React DOM warnings
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

const mockCandidates = {
  candidates: [
    {
      id: 'c1',
      name: 'Candidate Alpha',
      party: 'Party A',
      education: 'PhD Political Science',
      assets: '₹12 Cr',
      criminalCases: 0,
      profession: 'Advocate',
      partyLogo: 'PA',
      partyColor: 'bg-blue-500',
    },
    {
      id: 'c2',
      name: 'Candidate Beta',
      party: 'Party B',
      education: 'MBA Finance',
      assets: '₹8 Cr',
      criminalCases: 2,
      profession: 'Business',
      partyLogo: 'PB',
      partyColor: 'bg-green-500',
    },
    {
      id: 'c3',
      name: 'Candidate Gamma',
      party: 'Party C',
      education: 'BA History',
      assets: '₹3 Cr',
      criminalCases: 0,
      profession: 'Social Worker',
      partyLogo: 'PC',
      partyColor: 'bg-red-500',
    },
  ],
};

describe('CandidateComparator Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the constituency input field', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    const input = screen.getByPlaceholderText(/Enter Constituency/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Bangalore South');
  });

  it('should render the Affidavit Analyzer heading', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    expect(screen.getByText('Affidavit Analyzer')).toBeInTheDocument();
  });

  it('should show loading state while fetching candidates', () => {
    global.fetch = vi.fn(
      () => new Promise(() => {}) // never resolves — keeps loading state
    ) as unknown as typeof fetch;

    render(<CandidateComparator />);
    expect(screen.getByText(/Fetching Data/i)).toBeInTheDocument();
  });

  it('should display candidates after successful fetch', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    // Names may appear in both selection list and comparison view
    expect(screen.getAllByText('Candidate Alpha').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Candidate Beta').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Candidate Gamma').length).toBeGreaterThanOrEqual(1);
  });

  it('should auto-select the first two candidates', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    // First two should be selected
    expect(screen.getAllByText('Candidate Alpha').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Candidate Beta').length).toBeGreaterThanOrEqual(1);

    // Selected items show "Selected [X]"
    const selectedBadges = screen.getAllByText('Selected [X]');
    expect(selectedBadges.length).toBe(2);
  });

  it('should deselect a candidate when clicked again', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    expect(screen.getAllByText('Candidate Alpha').length).toBeGreaterThanOrEqual(1);

    // Click first candidate button to deselect via aria-pressed
    const candidateButton = screen.getAllByRole('button').find(
      (b) => b.getAttribute('aria-pressed') === 'true' && b.textContent?.includes('Candidate Alpha')
    );

    await act(async () => {
      if (candidateButton) fireEvent.click(candidateButton);
    });

    // Should show "Selection Pending" since fewer than 2 selected
    expect(screen.getByText('Selection Pending')).toBeInTheDocument();
  });

  it('should show comparison view when exactly 2 candidates selected', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    // Auto-selected first 2 → comparison view
    expect(screen.getByText(/Data Source/i)).toBeInTheDocument();
  });

  it('should display "NIL" for candidates with zero criminal cases', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    expect(screen.getByText('NIL')).toBeInTheDocument();
  });

  it('should display criminal case count for candidates with cases', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    expect(screen.getByText('2 REPORTED')).toBeInTheDocument();
  });

  it('should handle API fetch failure with official-source fallback cards', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    expect(screen.getAllByText(/Verify on ECI/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Official record required/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should update constituency when input changes', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockCandidates),
      })
    ) as unknown as typeof fetch;

    await act(async () => {
      render(<CandidateComparator />);
    });

    const input = screen.getByPlaceholderText(/Enter Constituency/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Varanasi' } });
    });
    expect(input).toHaveValue('Varanasi');
  });
});
