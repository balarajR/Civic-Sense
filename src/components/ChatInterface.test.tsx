import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatInterface from './ChatInterface';
import { Persona } from '../types';

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => React.createElement('div', null, children),
}));

const defaultMessages = [
  {
    id: '1',
    role: 'assistant' as const,
    content: 'Welcome to CivicSence!',
    timestamp: new Date(),
  },
];

describe('ChatInterface Component', () => {
  const mockSend = vi.fn();

  it('should render the Live Terminal header', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    expect(screen.getByText('Live Terminal')).toBeInTheDocument();
  });

  it('should render assistant messages', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    expect(screen.getByText('Welcome to CivicSence!')).toBeInTheDocument();
  });

  it('should render the input field with placeholder', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    expect(screen.getByPlaceholderText('TYPE_YOUR_QUERY_HERE...')).toBeInTheDocument();
  });

  it('should call onSendMessage when form is submitted with text', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    const input = screen.getByPlaceholderText('TYPE_YOUR_QUERY_HERE...');
    fireEvent.change(input, { target: { value: 'How to register?' } });
    fireEvent.submit(input.closest('form')!);
    expect(mockSend).toHaveBeenCalledWith('How to register?');
  });

  it('should NOT submit when input is empty', () => {
    const mockFn = vi.fn();
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockFn}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    const input = screen.getByPlaceholderText('TYPE_YOUR_QUERY_HERE...');
    fireEvent.submit(input.closest('form')!);
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should disable input when isLoading is true', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={true}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    const input = screen.getByPlaceholderText('TYPE_YOUR_QUERY_HERE...');
    expect(input).toBeDisabled();
  });

  it('should display persona badge when persona is not UNKNOWN', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.FIRST_TIME_VOTER}
      />
    );
    expect(screen.getByText('FIRST_TIME_VOTER')).toBeInTheDocument();
  });

  it('should NOT display persona badge when persona is UNKNOWN', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    expect(screen.queryByText('GUEST_USER')).not.toBeInTheDocument();
  });

  it('should render multiple messages in order', () => {
    const multiMessages = [
      { id: '1', role: 'assistant' as const, content: 'First message', timestamp: new Date() },
      { id: '2', role: 'user' as const, content: 'User reply', timestamp: new Date() },
      { id: '3', role: 'assistant' as const, content: 'Second response', timestamp: new Date() },
    ];
    render(
      <ChatInterface
        messages={multiMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('User reply')).toBeInTheDocument();
    expect(screen.getByText('Second response')).toBeInTheDocument();
  });

  it('should clear the input after sending a message', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    const input = screen.getByPlaceholderText('TYPE_YOUR_QUERY_HERE...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form')!);
    expect(input.value).toBe('');
  });

  it('should render the SEND button', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    expect(screen.getByText('SEND →')).toBeInTheDocument();
  });

  it('should disable send button when input is empty', () => {
    render(
      <ChatInterface
        messages={defaultMessages}
        onSendMessage={mockSend}
        isLoading={false}
        detectedPersona={Persona.UNKNOWN}
      />
    );
    const button = screen.getByText('SEND →');
    expect(button).toBeDisabled();
  });
});
