import { InteractionMode, Message, TimelineEvent } from '../types';

export function isTimelineEvent(value: unknown): value is TimelineEvent {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<TimelineEvent>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.description === 'string'
  );
}

export function getTimelineEventsFromMessages(messages: Message[]): TimelineEvent[] | undefined {
  const timelineMetadata = messages.find(
    (message) => message.mode === InteractionMode.TIMELINE_BUILDER
  )?.metadata;
  const events = timelineMetadata?.events;

  return Array.isArray(events) && events.every(isTimelineEvent) ? events : undefined;
}
