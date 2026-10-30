import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Compass,
  ArrowRight,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  HelpCircle,
  ThumbsUp,
  Share2,
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { SUGGESTED_PROMPTS } from '../fixtures/chatData';
import { useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_welcome_1',
    sender: 'assistant',
    text: `Namaste & Welcome to ParyatakRoute Travel Intelligence! 🌏

I am your personal AI travel advisor. You can ask me about:
- **Optimal travel seasons & weather** for destinations across India and globally.
- **Hidden gems & photographic viewpoints** in Rajasthan, Kerala, Ladakh, and Goa.
- **Budget optimization** and packing recommendations.
- **Custom route planning** and cultural etiquette.

No registration required—how can I assist your wanderlust today?`,
    timestamp: 'Just now',
    suggestedActions: [
      'Top 3 heritage spots in Jaipur',
      'What should I pack for Kerala in December?',
      'Best time to visit Ladakh without acclimatization issues',
    ],
  },
];

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [likedMessageIds, setLikedMessageIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const initialPromptHandled = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Automatically submit initial prompt passed from Homepage Card 2 ("Ask AI")
  useEffect(() => {
    if (initialPromptHandled.current) return;
    const promptFromState = (location.state as any)?.initialPrompt;
    const promptFromSearch = new URLSearchParams(location.search).get('prompt');
    const promptToSubmit = (promptFromState || promptFromSearch || '').trim();

    if (promptToSubmit) {
      initialPromptHandled.current = true;
      handleSend(promptToSubmit);
    }
  }, [location]);

  const handleSend = async (messageText?: string, isRetry: boolean = false) => {
    const textToSend = (messageText || (isRetry && lastFailedText ? lastFailedText : input)).trim();
    if (!textToSend || isLoading) return;

    setError(null);

    if (!isRetry) {
      const userMessage: Message = {
        id: `usr_${Date.now()}`,
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMessage]);
      if (!messageText) setInput('');
    }

    setIsLoading(true);

    const historyTurns = messages
      .filter((m) => m.id !== 'msg_welcome_1')
      .slice(-10)
      .map((m) => ({
        role: (m.sender === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.text,
      }));

    try {
      const response = await chatService.sendMessage({
        message: textToSend,
        history: historyTurns,
      });

      const assistantMessage: Message = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: response.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastFailedText(null);
    } catch (err: any) {
      setLastFailedText(textToSend);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Unable to reach Groq AI assistant. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action.includes('Plan') || action.includes('Itinerary')) {
      navigate('/create');
    } else {
      handleSend(action);
    }
  };

  const handleToggleLike = (id: string) => {
    setLikedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
    setError(null);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--surface-white-canvas)', padding: 'var(--spacing-32) var(--spacing-16)' }}>
      <div className="container" style={{ maxWidth: 960 }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-24)', flexWrap: 'wrap', gap: 'var(--spacing-12)' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 'var(--radius-pills)', backgroundColor: 'var(--color-hopper-blue-subtle)', color: 'var(--color-hopper-blue)', fontSize: 13, fontWeight: 'var(--font-weight-semibold)', marginBottom: 8 }}>
              <Sparkles size={14} />
              <span>ParyatakRoute Intelligence</span>
            </div>
            <h1 style={{ fontSize: 'var(--text-app-heading)', lineHeight: 'var(--leading-app-heading)', fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-ink)' }}>
              AI Travel Assistant
            </h1>
            <p style={{ color: 'var(--color-graphite)', fontSize: 15, marginTop: 4 }}>
              Zero-friction conversational guidance powered by Groq. Accessible to all travelers with no login required.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-8)' }}>
            <button
              onClick={handleClearChat}
              className="btn-secondary"
              style={{ fontSize: 13, padding: '8px 14px' }}
              title="Reset Conversation"
            >
              <RefreshCw size={14} />
              <span>Reset Chat</span>
            </button>
            <button
              onClick={() => navigate('/create')}
              className="btn-primary"
              style={{ fontSize: 13, padding: '8px 16px' }}
            >
              <Calendar size={14} />
              <span>Plan Trip Wizard</span>
            </button>
          </div>
        </div>

        {/* Chat Canvas */}
        <div
          style={{
            border: '1px solid var(--color-divider-gray)',
            borderRadius: 'var(--radius-cards)',
            backgroundColor: 'var(--surface-white-canvas)',
            display: 'flex',
            flexDirection: 'column',
            height: '620px',
            overflow: 'hidden',
          }}
        >
          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 'var(--spacing-24)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-20)',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Sender badge */}
                <div style={{ fontSize: 12, color: 'var(--color-graphite)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {msg.sender === 'assistant' ? (
                    <>
                      <BrandLogo variant="light" height={20} clickable={false} />
                      <span style={{ fontWeight: 600 }}>Paryatak Assistant</span>
                    </>
                  ) : (
                    <span>You</span>
                  )}
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Bubble */}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '14px 18px',
                    borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: msg.sender === 'user' ? 'var(--color-hopper-blue)' : 'var(--color-cloud)',
                    color: msg.sender === 'user' ? 'var(--color-white)' : 'var(--color-ink)',
                    fontSize: 15,
                    lineHeight: 1.5,
                    border: msg.sender === 'assistant' ? '1px solid var(--color-divider-gray)' : 'none',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}
                </div>

                {/* Assistant Suggestion Chips & Utility Bar */}
                {msg.sender === 'assistant' && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            style={{
                              backgroundColor: 'var(--surface-white-canvas)',
                              border: '1px solid var(--color-hopper-blue)',
                              color: 'var(--color-hopper-blue)',
                              borderRadius: 'var(--radius-pills)',
                              padding: '5px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--color-hopper-blue)';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--surface-white-canvas)';
                              e.currentTarget.style.color = 'var(--color-hopper-blue)';
                            }}
                          >
                            <span>{action}</span>
                            <ArrowRight size={11} />
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-graphite)' }}>
                      <button
                        onClick={() => handleToggleLike(msg.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: likedMessageIds.has(msg.id) ? 'var(--color-hopper-blue)' : 'var(--color-graphite)' }}
                        title="Helpful reply"
                      >
                        <ThumbsUp size={13} />
                        <span>{likedMessageIds.has(msg.id) ? 'Helpful' : 'Like'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 12, color: 'var(--color-graphite)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} color="var(--color-hopper-blue)" />
                  <span style={{ fontWeight: 600 }}>Paryatak Assistant</span>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--color-cloud)',
                    border: '1px solid var(--color-divider-gray)',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--color-graphite)',
                    fontSize: 14,
                  }}
                >
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  <span>Thinking & analyzing regional itinerary context...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-compactcontrols)',
                  color: 'var(--color-danger)',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => handleSend(undefined, true)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions Bar */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--color-cloud)',
              borderTop: '1px solid var(--color-divider-gray)',
              borderBottom: '1px solid var(--color-divider-gray)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              display: 'flex',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--color-graphite)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <HelpCircle size={13} />
              Suggestions:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-divider-gray)',
                  borderRadius: 'var(--radius-pills)',
                  padding: '3px 10px',
                  fontSize: 12,
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--surface-white-canvas)',
                  flexShrink: 0,
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--surface-white-canvas)',
              display: 'flex',
              gap: 'var(--spacing-12)',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about destinations, season, packing, or itineraries (e.g. 3-day Jaipur trip)..."
              disabled={isLoading}
              style={{
                flex: 1,
                border: '1px solid var(--color-divider-gray)',
                borderRadius: 'var(--radius-pills)',
                padding: '12px 20px',
                fontSize: 15,
                outline: 'none',
                color: 'var(--color-ink)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-hopper-blue)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-divider-gray)')}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn-primary"
              style={{
                borderRadius: 'var(--radius-pills)',
                width: 48,
                height: 48,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                opacity: !input.trim() || isLoading ? 0.5 : 1,
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
