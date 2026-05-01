import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TimelineBuilder from './TimelineBuilder';

// Mock motion/react — filter out framer-motion props to avoid React DOM warnings
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TimelineBuilder Component', () => {
  it('should render events when passed as props', () => {
    const events = [
      { title: 'Notification', date: '2025-03-01', description: 'ECI notification issued.' },
      { title: 'Polling Day', date: '2025-05-01', description: 'Citizens cast their votes.' },
    ];
    render(<TimelineBuilder events={events} />);
    expect(screen.getByText('Notification')).toBeInTheDocument();
    expect(screen.getByText('Polling Day')).toBeInTheDocument();
  });

  it('should display event dates', () => {
    const events = [
      { title: 'Test Event', date: '2025-06-15', description: 'Test description' },
    ];
    render(<TimelineBuilder events={events} />);
    expect(screen.getByText('2025-06-15')).toBeInTheDocument();
  });

  it('should display event descriptions', () => {
    const events = [
      { title: 'Test', date: '2025-01-01', description: 'Detailed description here' },
    ];
    render(<TimelineBuilder events={events} />);
    expect(screen.getByText('Detailed description here')).toBeInTheDocument();
  });

  it('should show verification disclaimer when events exist', () => {
    const events = [
      { title: 'Event', date: '2025-01-01', description: 'Desc' },
    ];
    render(<TimelineBuilder events={events} />);
    expect(screen.getByText(/Verification Required/)).toBeInTheDocument();
  });

  it('should show empty state when no events and not loading', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ timeline: [] }),
    });
    render(<TimelineBuilder />);
    // After fetch resolves, it should show the empty state
    const emptyMsg = await screen.findByText(/No schedule announced/);
    expect(emptyMsg).toBeInTheDocument();
  });

  it('should render CTA button when event has a cta field', () => {
    const events = [
      { title: 'Event', date: '2025-01-01', description: 'Desc', cta: 'Learn More' },
    ];
    render(<TimelineBuilder events={events} />);
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('should use fallback timeline if fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));
    render(<TimelineBuilder />);
    
    // After fetch fails, it should show the fallback
    const fallbackMsg = await screen.findByText(/Schedule Announcement/);
    expect(fallbackMsg).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
