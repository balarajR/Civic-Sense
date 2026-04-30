import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NewsTicker from './NewsTicker';

describe('NewsTicker Component', () => {
  it('should not render when news array is empty', () => {
    const { container } = render(<NewsTicker news={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the live feed label', () => {
    render(<NewsTicker news={['Breaking news']} />);
    expect(screen.getByText('LIVE_FEED')).toBeInTheDocument();
  });

  it('should render the news items', () => {
    const news = ['Election dates announced', 'Voter turnout at 60%'];
    render(<NewsTicker news={news} />);
    
    // The items are duplicated for the infinite scroll, so we use getAllByText
    expect(screen.getAllByText('Election dates announced').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Voter turnout at 60%').length).toBeGreaterThan(0);
  });
});
