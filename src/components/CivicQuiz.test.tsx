import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CivicQuiz from './CivicQuiz';

// Mock motion/react — filter out framer-motion props to avoid React DOM warnings
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, layout, initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

const mockQuestions = [
  {
    question: 'What is the minimum age to vote?',
    options: ['16', '18', '21'],
    correctIndex: 1,
    explanation: 'The voting age is 18 years.',
  },
  {
    question: 'How to check electoral roll?',
    options: ['Police Station', 'Voter Helpline App', 'Wait for letter'],
    correctIndex: 1,
    explanation: 'Use the Voter Helpline App.',
  },
];

describe('CivicQuiz Component', () => {
  const mockComplete = vi.fn();

  it('should render the first question', () => {
    render(<CivicQuiz questions={mockQuestions} onComplete={mockComplete} />);
    expect(screen.getByText('What is the minimum age to vote?')).toBeInTheDocument();
  });

  it('should render the answer options', () => {
    render(<CivicQuiz questions={mockQuestions} onComplete={mockComplete} />);
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('should display step indicator', () => {
    render(<CivicQuiz questions={mockQuestions} onComplete={mockComplete} />);
    expect(screen.getByText(/1\s*\/\s*2/)).toBeInTheDocument();
  });

  it('should display the accuracy counter', () => {
    render(<CivicQuiz questions={mockQuestions} onComplete={mockComplete} />);
    expect(screen.getByText(/ACCURACY/)).toBeInTheDocument();
  });

  it('should show explanation when an answer is selected', () => {
    render(<CivicQuiz questions={mockQuestions} onComplete={mockComplete} />);
    // Click the correct answer (index 1 = '18')
    const correctOption = screen.getByText('18');
    fireEvent.click(correctOption);
    expect(screen.getByText('The voting age is 18 years.')).toBeInTheDocument();
  });

  it('should show NEXT button after answering', () => {
    render(<CivicQuiz questions={mockQuestions} onComplete={mockComplete} />);
    fireEvent.click(screen.getByText('18'));
    expect(screen.getByText(/NEXT/)).toBeInTheDocument();
  });

  it('should handle empty questions array gracefully', () => {
    const { container } = render(<CivicQuiz questions={[]} onComplete={mockComplete} />);
    // Should render something (possibly empty or a null guard)
    expect(container).toBeDefined();
  });
});
