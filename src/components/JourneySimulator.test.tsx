import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import JourneySimulator from './JourneySimulator';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
}));

describe('JourneySimulator Component', () => {
  const mockNext = vi.fn();

  it('should render the Voting Pipeline header', () => {
    render(<JourneySimulator currentStage={1} onNext={mockNext} />);
    expect(screen.getByText('Voting Pipeline')).toBeInTheDocument();
  });

  it('should display the current step indicator', () => {
    render(<JourneySimulator currentStage={3} onNext={mockNext} />);
    expect(screen.getByText('STEP 3 / 5')).toBeInTheDocument();
  });

  it('should render all 5 stage titles', () => {
    render(<JourneySimulator currentStage={1} onNext={mockNext} />);
    expect(screen.getByText('Voter Registration')).toBeInTheDocument();
    expect(screen.getByText('EPIC Card / Voter ID')).toBeInTheDocument();
    expect(screen.getByText('Booth Lookup')).toBeInTheDocument();
    expect(screen.getByText('Election Day')).toBeInTheDocument();
    expect(screen.getByText('The Result')).toBeInTheDocument();
  });

  it('should show the description for the active stage', () => {
    render(<JourneySimulator currentStage={1} onNext={mockNext} />);
    expect(
      screen.getByText(/first step is getting on the electoral roll/)
    ).toBeInTheDocument();
  });

  it('should show action button for the active stage', () => {
    render(<JourneySimulator currentStage={1} onNext={mockNext} />);
    expect(screen.getByText(/Visit voters\.eci\.gov\.in/)).toBeInTheDocument();
  });

  it('should call onNext when the stage action button is clicked', () => {
    render(<JourneySimulator currentStage={1} onNext={mockNext} />);
    const button = screen.getByText(/Visit voters\.eci\.gov\.in/);
    fireEvent.click(button);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should show DONE badge for completed stages', () => {
    render(<JourneySimulator currentStage={3} onNext={mockNext} />);
    const doneBadges = screen.getAllByText('DONE');
    // Stages 1 and 2 are completed when currentStage is 3
    expect(doneBadges.length).toBe(2);
  });

  it('should render stage 5 correctly', () => {
    render(<JourneySimulator currentStage={5} onNext={mockNext} />);
    expect(screen.getByText('STEP 5 / 5')).toBeInTheDocument();
    expect(screen.getByText(/View Live Results/)).toBeInTheDocument();
  });
});
