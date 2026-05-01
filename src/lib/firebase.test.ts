import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('firebase', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('initializes the app and analytics when supported', async () => {
    vi.doMock('firebase/app', () => ({
      initializeApp: vi.fn(() => ({})),
    }));

    vi.doMock('firebase/analytics', () => ({
      getAnalytics: vi.fn(() => ({})),
      isSupported: vi.fn(() => Promise.resolve(true)),
    }));

    const { app } = await import('./firebase');
    expect(app).toBeDefined();
    await new Promise(process.nextTick);
  });

  it('handles analytics when unsupported', async () => {
    vi.doMock('firebase/app', () => ({
      initializeApp: vi.fn(() => ({})),
    }));

    vi.doMock('firebase/analytics', () => ({
      getAnalytics: vi.fn(() => ({})),
      isSupported: vi.fn(() => Promise.resolve(false)),
    }));

    const { app } = await import('./firebase');
    expect(app).toBeDefined();
    await new Promise(process.nextTick);
  });
});

