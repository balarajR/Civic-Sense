import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import BoothFinder from './BoothFinder';

describe('BoothFinder Component', () => {
  beforeEach(() => {
    render(<BoothFinder />);
  });

  it('should render the search input with proper ARIA label', () => {
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });
    expect(input).toBeInTheDocument();
  });

  it('should render the Booth Locator heading', () => {
    expect(screen.getByText(/Booth Locator/i)).toBeInTheDocument();
  });

  it('should show offline state initially', () => {
    expect(screen.getByText(/Map Terminal Offline/i)).toBeInTheDocument();
  });

  it('should update input value on user typing', () => {
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });
    fireEvent.change(input, { target: { value: 'Koramangala' } });
    expect(input).toHaveValue('Koramangala');
  });

  it('should render the search button with ARIA label', () => {
    const searchButton = screen.getByRole('button', { name: /search for polling booth/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should not show map when search is empty', () => {
    const searchButton = screen.getByRole('button', { name: /search for polling booth/i });
    fireEvent.click(searchButton);
    expect(screen.getByText(/Map Terminal Offline/i)).toBeInTheDocument();
  });

  it('should show map result when search is submitted with value', () => {
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });
    fireEvent.change(input, { target: { value: 'Jayanagar' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    // After search, offline message should disappear
    expect(screen.queryByText(/Map Terminal Offline/i)).not.toBeInTheDocument();
  });

  it('should render iframe when maps API key is available', () => {
    // Save original env
    const originalEnv = import.meta.env;
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
    
    // Clean up the beforeEach render and render again
    cleanup();
    render(<BoothFinder />);
    
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });
    fireEvent.change(input, { target: { value: 'Jayanagar' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    
    expect(screen.getByTitle('Google Maps polling booth location')).toBeInTheDocument();
    
    // Restore env
    vi.unstubAllEnvs();
  });

  it('should show offline map message when maps API key is missing', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    cleanup();
    render(<BoothFinder />);
    
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });
    fireEvent.change(input, { target: { value: 'Jayanagar' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    
    expect(screen.getByText(/Official verification needed/i)).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it('should render the ECI portal link with rel noopener noreferrer', () => {
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });
    fireEvent.change(input, { target: { value: 'MG Road' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    const eciLink = screen.getByRole('link', { name: /official ECI electoral search/i });
    expect(eciLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(eciLink).toHaveAttribute('target', '_blank');
  });

  it('should render verification info after search', () => {
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });
    fireEvent.change(input, { target: { value: 'Indiranagar' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    expect(screen.getByText(/Verification Required/i)).toBeInTheDocument();
  });

  it('should render the navigate button with ARIA label after search', () => {
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });
    fireEvent.change(input, { target: { value: 'Whitefield' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    expect(screen.getByRole('button', { name: /navigate to polling booth/i })).toBeInTheDocument();
  });

  it('should open Google Maps directions in a protected new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const input = screen.getByRole('textbox', { name: /enter your locality or EPIC ID/i });

    fireEvent.change(input, { target: { value: 'Whitefield' } });
    fireEvent.submit(input.closest('form')!);
    fireEvent.click(screen.getByRole('button', { name: /navigate to polling booth/i }));

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=Whitefield%20polling%20station%20Karnataka',
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
  });
});
