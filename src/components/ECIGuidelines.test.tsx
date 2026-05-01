import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ECIGuidelines from './ECIGuidelines';

// Mock motion/react — filter out framer-motion props to avoid React DOM warnings
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

describe('ECIGuidelines Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the Legal Framework heading', () => {
    render(<ECIGuidelines />);
    expect(screen.getByText('Legal Framework')).toBeInTheDocument();
  });

  it('should render the descriptive subtitle', () => {
    render(<ECIGuidelines />);
    expect(screen.getByText(/Essential ECI directives/i)).toBeInTheDocument();
  });

  it('should render all category filter buttons', () => {
    render(<ECIGuidelines />);
    expect(screen.getByText('ALL')).toBeInTheDocument();
    expect(screen.getByText('MCC')).toBeInTheDocument();
    expect(screen.getByText('VOTER')).toBeInTheDocument();
    expect(screen.getByText('CANDIDATE')).toBeInTheDocument();
  });

  it('should show all three guidelines by default (ALL filter)', () => {
    render(<ECIGuidelines />);
    expect(screen.getByText('Model Code of Conduct (MCC)')).toBeInTheDocument();
    expect(screen.getByText('Voter Conduct & Rights')).toBeInTheDocument();
    expect(screen.getByText('Candidate Guidelines')).toBeInTheDocument();
  });

  it('should filter to show only MCC guideline when MCC button is clicked', () => {
    render(<ECIGuidelines />);
    fireEvent.click(screen.getByText('MCC'));
    expect(screen.getByText('Model Code of Conduct (MCC)')).toBeInTheDocument();
    expect(screen.queryByText('Voter Conduct & Rights')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate Guidelines')).not.toBeInTheDocument();
  });

  it('should filter to show only VOTER guideline when VOTER button is clicked', () => {
    render(<ECIGuidelines />);
    fireEvent.click(screen.getByText('VOTER'));
    expect(screen.getByText('Voter Conduct & Rights')).toBeInTheDocument();
    expect(screen.queryByText('Model Code of Conduct (MCC)')).not.toBeInTheDocument();
    expect(screen.queryByText('Candidate Guidelines')).not.toBeInTheDocument();
  });

  it('should filter to show only CANDIDATE guideline when CANDIDATE button is clicked', () => {
    render(<ECIGuidelines />);
    fireEvent.click(screen.getByText('CANDIDATE'));
    expect(screen.getByText('Candidate Guidelines')).toBeInTheDocument();
    expect(screen.queryByText('Model Code of Conduct (MCC)')).not.toBeInTheDocument();
    expect(screen.queryByText('Voter Conduct & Rights')).not.toBeInTheDocument();
  });

  it('should show all guidelines again when ALL button is clicked', () => {
    render(<ECIGuidelines />);
    fireEvent.click(screen.getByText('MCC'));
    fireEvent.click(screen.getByText('ALL'));
    expect(screen.getByText('Model Code of Conduct (MCC)')).toBeInTheDocument();
    expect(screen.getByText('Voter Conduct & Rights')).toBeInTheDocument();
    expect(screen.getByText('Candidate Guidelines')).toBeInTheDocument();
  });

  it('should display detail items for each guideline', () => {
    render(<ECIGuidelines />);
    expect(screen.getByText(/Places of worship shall not be used/i)).toBeInTheDocument();
    expect(screen.getByText(/Carrying mobile phones inside the polling booth/i)).toBeInTheDocument();
    expect(screen.getByText(/Submission of affidavit/i)).toBeInTheDocument();
  });

  it('should render the compliance notice', () => {
    render(<ECIGuidelines />);
    expect(screen.getByText(/Representation of the People Act, 1951/i)).toBeInTheDocument();
  });

  it('should render the ECI link with proper attributes', () => {
    render(<ECIGuidelines />);
    const link = screen.getByText(/FULL MANUALS AT ECI.GOV.IN/i);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://eci.gov.in/important-instructions/');
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('should render AI Summarize buttons for each guideline', () => {
    render(<ECIGuidelines />);
    const summarizeBtns = screen.getAllByText('AI Summarize');
    expect(summarizeBtns.length).toBe(3);
  });

  it('should call /api/summarize when AI Summarize is clicked', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ summary: 'AI-generated summary text' }),
      })
    ) as unknown as typeof fetch;

    render(<ECIGuidelines />);
    const summarizeBtns = screen.getAllByText('AI Summarize');
    fireEvent.click(summarizeBtns[0]!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/summarize', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('should display AI summary after successful summarization', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ summary: 'Key MCC rules prevent government misuse during elections.' }),
      })
    ) as unknown as typeof fetch;

    render(<ECIGuidelines />);
    const summarizeBtns = screen.getAllByText('AI Summarize');
    fireEvent.click(summarizeBtns[0]!);

    await waitFor(() => {
      expect(screen.getByText(/Key MCC rules prevent government misuse/)).toBeInTheDocument();
      expect(screen.getByText('AI Summary')).toBeInTheDocument();
    });
  });

  it('should show "Summarized" label after summary is generated', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ summary: 'Test summary' }),
      })
    ) as unknown as typeof fetch;

    render(<ECIGuidelines />);
    const summarizeBtns = screen.getAllByText('AI Summarize');
    fireEvent.click(summarizeBtns[0]!);

    await waitFor(() => {
      expect(screen.getByText('Summarized')).toBeInTheDocument();
    });
  });
});
