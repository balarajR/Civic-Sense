import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionHub from './ActionHub';

describe('ActionHub Component', () => {
  beforeEach(() => {
    render(<ActionHub />);
  });

  it('should render all four tool tabs', () => {
    expect(screen.getByRole('tab', { name: /live election data/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /polling booth/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /compare candidates/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ECI election rules/i })).toBeInTheDocument();
  });

  it('should show Live Results as active by default', () => {
    const liveTab = screen.getByRole('tab', { name: /live election data/i });
    expect(liveTab).toHaveAttribute('aria-selected', 'true');
    expect(liveTab).toHaveClass('bg-black');
  });

  it('should switch to Booth Finder on tab click', () => {
    const boothTab = screen.getByRole('tab', { name: /polling booth/i });
    fireEvent.click(boothTab);
    expect(boothTab).toHaveAttribute('aria-selected', 'true');
    expect(boothTab).toHaveClass('bg-black');
  });

  it('should switch to Candidate Comparator on tab click', () => {
    const compareTab = screen.getByRole('tab', { name: /compare candidates/i });
    fireEvent.click(compareTab);
    expect(compareTab).toHaveAttribute('aria-selected', 'true');
    expect(compareTab).toHaveClass('bg-black');
  });

  it('should switch to ECI Guidelines on tab click', () => {
    const rulesTab = screen.getByRole('tab', { name: /ECI election rules/i });
    fireEvent.click(rulesTab);
    expect(rulesTab).toHaveAttribute('aria-selected', 'true');
    expect(rulesTab).toHaveClass('bg-black');
  });

  it('should only highlight one tab at a time', () => {
    const boothTab = screen.getByRole('tab', { name: /polling booth/i });
    const liveTab = screen.getByRole('tab', { name: /live election data/i });
    
    fireEvent.click(boothTab);
    expect(boothTab).toHaveAttribute('aria-selected', 'true');
    expect(liveTab).toHaveAttribute('aria-selected', 'false');
  });

  it('should render the tablist container with proper ARIA', () => {
    expect(screen.getByRole('tablist', { name: /Action Hub tool selector/i })).toBeInTheDocument();
  });

  it('should render the tabpanel container', () => {
    expect(screen.getByRole('tabpanel', { name: /active tool content/i })).toBeInTheDocument();
  });

  it('should render the region with proper label', () => {
    expect(screen.getByRole('region', { name: /Action Hub tools/i })).toBeInTheDocument();
  });
});
