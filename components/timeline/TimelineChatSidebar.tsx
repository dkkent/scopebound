'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface Proposal {
  id: string;
  summary: string;
  deltaCost: number;
  deltaWeeks: number;
  proposalData: {
    changes: string[];
    reasoning: string;
  };
  status: string;
  createdAt: string;
}

interface TimelineChatSidebarProps {
  shareToken: string;
  onProposalSelect?: (proposalId: string) => void;
  onEmailUpdate?: (email: string) => void;
}

export function TimelineChatSidebar({ shareToken, onProposalSelect, onEmailUpdate }: TimelineChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [input, setInput] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, [shareToken]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/timelines/${shareToken}/chat`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setProposals(data.proposals || []);
        setSessionId(data.sessionId);
        if (data.session?.clientEmail) {
          setClientEmail(data.session.clientEmail);
          setEmailSubmitted(true);
          onEmailUpdate?.(data.session.clientEmail);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      setEmailSubmitted(true);
      onEmailUpdate?.(clientEmail);
    } else {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch(`/api/timelines/${shareToken}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          clientEmail: emailSubmitted ? clientEmail : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (data.proposal) {
        setProposals((prev) => [...prev, data.proposal]);
        toast({
          title: 'New proposal generated',
          description: data.proposal.summary,
        });
      }

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      
      setMessages((prev) => prev.filter((msg) => msg.id !== `temp-${Date.now()}`));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!emailSubmitted) {
    return (
      <div className="flex flex-col h-full p-6">
        <h3 className="text-lg font-semibold mb-2">Questions about this timeline?</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Chat with our AI to explore scope changes, understand costs, and request modifications.
        </p>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium mb-2 block">
              Your email address
            </label>
            <input
              id="email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 min-h-9 border rounded-md bg-background"
              data-testid="input-client-email"
              required
            />
          </div>
          <Button type="submit" className="w-full" data-testid="button-start-chat">
            Start Chatting
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Scope Discussion</h3>
        <p className="text-sm text-muted-foreground">
          Ask questions or suggest changes
        </p>
      </div>

      {proposals.length > 0 && (
        <div className="p-4 border-b space-y-3">
          <h4 className="text-sm font-medium">Proposals</h4>
          {proposals.map((proposal) => (
            <Card
              key={proposal.id}
              className="p-3 hover-elevate cursor-pointer"
              onClick={() => onProposalSelect?.(proposal.id)}
              data-testid={`card-proposal-${proposal.id}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium flex-1">{proposal.summary}</p>
                  <Badge variant="secondary" className="text-xs">
                    {proposal.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    <span className={proposal.deltaCost > 0 ? 'text-destructive' : 'text-green-600'}>
                      {proposal.deltaCost > 0 ? '+' : ''}${Math.abs(proposal.deltaCost).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className={proposal.deltaWeeks > 0 ? 'text-destructive' : 'text-green-600'}>
                      {proposal.deltaWeeks > 0 ? '+' : ''}{proposal.deltaWeeks}w
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>Start a conversation to explore</p>
            <p>potential scope changes</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            data-testid={`message-${message.role}-${message.id}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about scope changes..."
            className="resize-none min-h-0 h-auto"
            rows={2}
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
