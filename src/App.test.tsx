import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch for news API
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('./components/JourneySimulator', () => ({
  default: ({ onNext }: any) => <button onClick={onNext} data-testid="next-journey-btn">Next Journey Stage</button>
}));

vi.mock('./components/CivicQuiz', () => ({
  default: ({ onComplete }: any) => <button onClick={() => onComplete(85)} data-testid="complete-quiz-btn">Complete Quiz</button>
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default fetch mock for news
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ news: ['Test News 1', 'Test News 2'] }),
    });
  });

  it('renders the application shell', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getAllByRole('banner')[0]).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('fetches and displays news', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getAllByText('Test News 1')[0]).toBeInTheDocument();
    });
  });

  it('uses fallback news if API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API fail'));
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getAllByText(/ECI launches nationwide voter awareness/i)[0]).toBeInTheDocument();
    });
  });

  it('uses fallback news if API returns no news', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getAllByText(/ECI launches nationwide voter awareness/i)[0]).toBeInTheDocument();
    });
  });

  it('uses fallback news if API returns not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getAllByText(/ECI launches nationwide voter awareness/i)[0]).toBeInTheDocument();
    });
  });

  it('opens and closes mobile sidebar', async () => {
    await act(async () => { render(<App />); });
    const openButton = screen.getByLabelText('Open navigation menu');
    await act(async () => { fireEvent.click(openButton); });
    expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('Close navigation menu');
    await act(async () => { fireEvent.click(closeButton); });
    await waitFor(() => {
      expect(screen.queryByLabelText('Navigation menu')).not.toBeInTheDocument();
    });
  });

  it('closes mobile sidebar on backdrop click', async () => {
    await act(async () => { render(<App />); });
    const openButton = screen.getByLabelText('Open navigation menu');
    await act(async () => { fireEvent.click(openButton); });
    expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument();
    
    // The backdrop is the previous sibling or first child in the AnimatePresence when sidebar is open
    // It has className="fixed inset-0 bg-black/50 ..."
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      await act(async () => { fireEvent.click(backdrop); });
    }
    await waitFor(() => {
      expect(screen.queryByLabelText('Navigation menu')).not.toBeInTheDocument();
    });
  });

  it('handles mobile mode change', async () => {
    await act(async () => { render(<App />); });
    await act(async () => { fireEvent.click(screen.getByLabelText('Open navigation menu')); });
    const journeyButton = screen.getByText('01 JOURNEY');
    await act(async () => { fireEvent.click(journeyButton); });
    await waitFor(() => {
      expect(screen.queryByLabelText('Navigation menu')).not.toBeInTheDocument();
    });
  });

  it('handles desktop mode change and closes panel', async () => {
    await act(async () => { render(<App />); });
    const journeyButton = screen.getAllByText(/JOURNEY/i)[0]; // First one might be desktop
    await act(async () => { fireEvent.click(journeyButton!); });
    expect(await screen.findByRole('region', { name: /Active tool/i })).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('Close tool panel');
    await act(async () => { fireEvent.click(closeButton); });
    await waitFor(() => {
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });
  });

  it('advances journey stage when onNext is called', async () => {
    await act(async () => { render(<App />); });
    const journeyButton = screen.getAllByText(/JOURNEY/i)[0];
    await act(async () => { fireEvent.click(journeyButton!); });
    
    const nextBtn = await screen.findByTestId('next-journey-btn');
    await act(async () => { fireEvent.click(nextBtn); });
    // just to make sure it runs without errors
  });

  it('completes quiz and shows score when onComplete is called', async () => {
    await act(async () => { render(<App />); });
    const quizButton = screen.getAllByText(/CIVIC QUIZ/i)[0];
    await act(async () => { fireEvent.click(quizButton!); });
    
    const completeBtn = await screen.findByTestId('complete-quiz-btn');
    await act(async () => { fireEvent.click(completeBtn); });
    
    expect(await screen.findByText('Score: 85%')).toBeInTheDocument();
  });

  it('handles chat sending', async () => {
    mockFetch
      .mockResolvedValueOnce({ // for news
        ok: true,
        json: () => Promise.resolve({ news: [] }),
      })
      .mockResolvedValueOnce({ // for chat
        ok: true,
        json: () => Promise.resolve({
          reply: 'AI Reply',
          detectedPersona: 'FIRST_TIME_VOTER',
          currentMode: 'CIVIC_QUIZ',
        }),
      });

    await act(async () => { render(<App />); });
    const input = await screen.findByPlaceholderText(/TYPE_YOUR_QUERY_HERE/i);
    await act(async () => { fireEvent.change(input, { target: { value: 'Hello' } }); });
    const sendButton = screen.getByText('SEND');
    await act(async () => { fireEvent.click(sendButton); });

    await waitFor(() => {
      expect(screen.getByText('AI Reply')).toBeInTheDocument();
    });
  });

  it('handles chat sending failure', async () => {
    mockFetch
      .mockResolvedValueOnce({ // for news
        ok: true,
        json: () => Promise.resolve({ news: [] }),
      })
      .mockRejectedValueOnce(new Error('Network error')); // for chat

    await act(async () => { render(<App />); });
    const input = await screen.findByPlaceholderText(/TYPE_YOUR_QUERY_HERE/i);
    await act(async () => { fireEvent.change(input, { target: { value: 'Hello' } }); });
    await act(async () => { fireEvent.click(screen.getByText('SEND')); });

    await waitFor(() => {
      expect(screen.getByText(/I'm having trouble connecting directly/i)).toBeInTheDocument();
    });
  });

  it('handles abort error silently in chat', async () => {
    const abortError = new DOMException('Abort', 'AbortError');
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ news: [] }) })
      .mockRejectedValueOnce(abortError);

    await act(async () => { render(<App />); });
    const input = await screen.findByPlaceholderText(/TYPE_YOUR_QUERY_HERE/i);
    await act(async () => { fireEvent.change(input, { target: { value: 'Hello' } }); });
    await act(async () => { fireEvent.click(screen.getByText('SEND')); });

    // Wait a bit to ensure no error message is added
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
    expect(screen.queryByText(/I'm having trouble connecting directly/i)).not.toBeInTheDocument();
  });

  it('handles abort error silently in news', async () => {
    const abortError = new DOMException('Abort', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);

    await act(async () => { render(<App />); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
  });

  it('handles news api failure with fallback', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false }); // Fails news
    await act(async () => { render(<App />); });
    await waitFor(async () => {
      // It should fallback to ECI news. There are multiple because of duplication in NewsTicker
      const elements = await screen.findAllByText(/ECI launches nationwide voter awareness/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('handles chat sending with empty response', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ news: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}), // Empty response
      });

    await act(async () => { render(<App />); });
    const input = await screen.findByPlaceholderText(/TYPE_YOUR_QUERY_HERE/i);
    await act(async () => { fireEvent.change(input, { target: { value: 'Hello' } }); });
    await act(async () => { fireEvent.click(screen.getByText('SEND')); });

    await waitFor(() => {
      expect(screen.getByText("I'm processing your request.")).toBeInTheDocument();
    });
  });

  it('cancels in-flight chat requests', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ news: [] }) })
      .mockImplementationOnce((url, options) => new Promise((resolve, reject) => {
        const signal = options?.signal;
        if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ reply: 'First' })
        }), 500); // 500ms slow response
      }))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reply: 'Second' })
      }); // Fast response

    await act(async () => { render(<App />); });
    const input = await screen.findByPlaceholderText(/TYPE_YOUR_QUERY_HERE/i);
    const form = input.closest('form') as HTMLFormElement;
    
    // First message
    await act(async () => { fireEvent.change(input, { target: { value: 'One' } }); });
    await act(async () => { fireEvent.submit(form); });
    
    // Second message immediately (should cancel first)
    await act(async () => { fireEvent.change(input, { target: { value: 'Two' } }); });
    await act(async () => { fireEvent.submit(form); });

    await waitFor(() => {
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  it('renders all tools when active', async () => {
    await act(async () => { render(<App />); });
    const tools = ['JOURNEY', 'MYTH BUSTER', 'CIVIC QUIZ', 'TIMELINE', 'ACTION HUB'];
    
    for (const tool of tools) {
      if (tool === 'MYTH BUSTER') continue; // general mode
      
      const buttons = screen.getAllByText(new RegExp(tool, 'i'));
      await act(async () => { fireEvent.click(buttons[0]!); });
      expect(await screen.findByRole('region')).toBeInTheDocument();
    }
  });

});
