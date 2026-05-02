import { describe, expect, it } from 'vitest';
import type { Message } from '../types';
import { InteractionMode } from '../types';
import { getTimelineEventsFromMessages, isTimelineEvent } from './timelineMetadata';

const baseMessage: Message = {
  id: 'message-1',
  role: 'assistant',
  content: 'Timeline ready.',
  timestamp: new Date('2026-05-02T00:00:00.000Z'),
};

describe('timeline metadata utilities', () => {
  it('accepts complete timeline events', () => {
    expect(isTimelineEvent({
      title: 'Polling day',
      date: 'ECI notified',
      description: 'Voters cast ballots at assigned polling stations.',
    })).toBe(true);
  });

  it('rejects non-object values and incomplete records', () => {
    expect(isTimelineEvent(null)).toBe(false);
    expect(isTimelineEvent('Polling day')).toBe(false);
    expect(isTimelineEvent({ date: 'ECI notified', description: 'Missing title.' })).toBe(false);
    expect(isTimelineEvent({ title: 'Polling day', description: 'Missing date.' })).toBe(false);
    expect(isTimelineEvent({ title: 'Polling day', date: 'ECI notified' })).toBe(false);
  });

  it('extracts timeline events from the first timeline-builder message', () => {
    const events = [
      {
        title: 'Counting',
        date: 'Result day',
        description: 'Votes are counted and official results are published.',
      },
    ];

    expect(getTimelineEventsFromMessages([
      baseMessage,
      {
        ...baseMessage,
        id: 'message-2',
        mode: InteractionMode.TIMELINE_BUILDER,
        metadata: { events },
      },
    ])).toEqual(events);
  });

  it('returns undefined when timeline metadata is absent or malformed', () => {
    expect(getTimelineEventsFromMessages([])).toBeUndefined();
    expect(getTimelineEventsFromMessages([{ ...baseMessage, mode: InteractionMode.TIMELINE_BUILDER }])).toBeUndefined();
    expect(getTimelineEventsFromMessages([{
      ...baseMessage,
      mode: InteractionMode.TIMELINE_BUILDER,
      metadata: { events: 'not-an-array' },
    }])).toBeUndefined();
    expect(getTimelineEventsFromMessages([{
      ...baseMessage,
      mode: InteractionMode.TIMELINE_BUILDER,
      metadata: { events: [{ title: 'Incomplete' }] },
    }])).toBeUndefined();
  });
});
