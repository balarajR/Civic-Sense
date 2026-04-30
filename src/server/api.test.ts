import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Mock vite so esbuild is never loaded in the JSDOM env ────
vi.mock('vite', () => ({
  createServer: vi.fn().mockResolvedValue({ middlewares: { handle: vi.fn() } }),
}));

// ── Mock @google/genai before importing server ──────────────
vi.mock('@google/genai', () => {
  const mockSendMessage = vi.fn().mockResolvedValue({
    text: JSON.stringify({
      reply: 'Mocked AI response for voter registration.',
      detectedPersona: 'FIRST_TIME_VOTER',
      currentMode: 'JOURNEY_SIMULATOR',
      nextAction: 'Check booth location',
      uiData: {},
    }),
  });

  const mockGenerateContent = vi.fn().mockResolvedValue({
    text: JSON.stringify([
      { title: 'Election Announcement', date: '2025-03-01', description: 'MCC in effect.' },
    ]),
  });

  function GoogleGenAI() {
    return {
      chats: {
        create: vi.fn().mockReturnValue({
          sendMessage: mockSendMessage,
        }),
      },
      models: {
        generateContent: mockGenerateContent,
      },
    };
  }

  return { GoogleGenAI };
});

// ── Import after mocking ─────────────────────────────────────
// eslint-disable-next-line import/first
import { createApp } from '../../server';

describe('CivicSense API Endpoints', () => {
  let app: express.Express;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await createApp();
  });

  // ── Health Check ─────────────────────────────────────────
  describe('GET /api/health', () => {
    it('should return 200 with status "ok"', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ── Chat ─────────────────────────────────────────────────
  describe('POST /api/chat', () => {
    it('should return 200 with parsed AI response shape', async () => {
      const payload = {
        messages: [{ role: 'user', content: 'How do I register to vote?' }],
      };
      const res = await request(app).post('/api/chat').send(payload);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reply');
      expect(res.body).toHaveProperty('detectedPersona');
      expect(res.body).toHaveProperty('currentMode');
      expect(res.body).toHaveProperty('nextAction');
      expect(res.body).toHaveProperty('uiData');
    });

    it('should return 400 when messages array is missing', async () => {
      const res = await request(app).post('/api/chat').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when messages array is empty', async () => {
      const res = await request(app).post('/api/chat').send({ messages: [] });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── Summarize ────────────────────────────────────────────
  describe('POST /api/summarize', () => {
    it('should return 200 with a summary field', async () => {
      const payload = { title: 'Model Code of Conduct', description: 'Governs political conduct during elections.' };
      const res = await request(app).post('/api/summarize').send(payload);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
    });

    it('should return 400 when title or description is missing', async () => {
      const res = await request(app).post('/api/summarize').send({ title: 'Only title' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── Timeline ─────────────────────────────────────────────
  describe('GET /api/timeline', () => {
    it('should return 200 with a timeline array', async () => {
      const res = await request(app).get('/api/timeline');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('timeline');
      expect(Array.isArray(res.body.timeline)).toBe(true);
    });
  });

  // ── News ─────────────────────────────────────────────────
  describe('GET /api/news', () => {
    it('should return 200 with a news array', async () => {
      const res = await request(app).get('/api/news');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('news');
      expect(Array.isArray(res.body.news)).toBe(true);
    });
  });
});
