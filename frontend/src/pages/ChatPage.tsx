import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  Calendar,
  Camera,
  CloudSun,
  IndianRupee,
  Briefcase,
  MapPin,
  Compass,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { chatService } from '../services/chatService';
import BrandLogo from '../components/BrandLogo';
import MarkdownRenderer from '../components/MarkdownRenderer';
import '../styles/chatPage.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

interface SuggestedPrompt {
  id: string;
  text: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
}

const SUGGESTED_QUESTIONS: SuggestedPrompt[] = [
  {
    id: 'sug_ladakh',
    text: 'Best time to visit Ladakh',
    icon: Calendar,
  },
  {
    id: 'sug_kerala',
    text: 'Hidden gems in Kerala',
    icon: Camera,
  },
  {
    id: 'sug_rajasthan',
    text: 'Weather in Rajasthan',
    icon: CloudSun,
  },
  {
    id: 'sug_goa',
    text: 'Budget trip to Goa',
    icon: IndianRupee,
  },
  {
    id: 'sug_packing',
    text: 'Packing essentials',
    icon: Briefcase,
  },
  {
    id: 'sug_jaipur',
    text: '3-day Jaipur itinerary',
    icon: MapPin,
  },
];

export const ChatPage: React.FC = () => {
  // Empty messages array initially so the clean, elegant Welcome / Hero screen is displayed
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const conversationInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const initialPromptHandled = useRef(false);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Handle incoming initial prompt passed from Homepage Card 2 ("Ask AI") or URL search
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
        'Unable to reach AI assistant. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleResetConversation = () => {
    setMessages([]);
    setInput('');
    setError(null);
    setLastFailedText(null);
    setTimeout(() => heroInputRef.current?.focus(), 100);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="chat-page-root">
      {!hasMessages ? (
        /* ======================================================================
           WELCOME / HERO VIEW (Initial State matching uploaded reference)
           ====================================================================== */
        <div className="ai-welcome-container">
          {/* Eyebrow with Sunbeam rays */}
          <div className="ai-greeting-eyebrow">
            <svg
              width="34"
              height="24"
              viewBox="0 0 34 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <path d="M4 18C7 16 10 14 13 13" stroke="#D97745" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M8 9C11 9 14 10 17 12" stroke="#D97745" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M18 3C18 6 18 9 18 12" stroke="#D97745" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M28 7C25 8 23 10 20 12" stroke="#D97745" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="ai-greeting-text">Namaste, Traveler!</span>
          </div>

          {/* Main Heading in Playfair Display with Terracotta Accent */}
          <h1 className="ai-welcome-title">
            I'm your ParyatakRoute
            <br />
            Travel Intelligence <span className="accent-word">Assistant</span>
          </h1>

          {/* Supporting Description in Inter */}
          <p className="ai-welcome-description">
            Ask me anything about destinations, itineraries, weather, hidden gems, budget tips and more. I'm here to help you plan your perfect journey.
          </p>

          {/* Main AI Prompt Input Pill */}
          <form
            className="ai-hero-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="ai-hero-input-pill">
              <div className="ai-hero-input-icon">
                <MessageSquare size={20} color="var(--color-primary, #183D32)" />
              </div>
              <input
                ref={heroInputRef}
                type="text"
                className="ai-hero-input-field"
                placeholder="Ask about destinations, seasons, packing, itineraries or anything travel-related..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                className="ai-hero-send-btn"
                disabled={!input.trim() || isLoading}
                title="Send prompt to AI Assistant"
                aria-label="Send prompt"
              >
                {isLoading ? (
                  <Loader2 size={18} className="spinner" />
                ) : (
                  <Send size={18} style={{ transform: 'translateX(1px)' }} />
                )}
              </button>
            </div>
          </form>

          {/* "Try asking about" Divider */}
          <div className="ai-divider-container">
            <div className="ai-divider-line" />
            <div className="ai-divider-center">
              <Compass size={17} color="var(--color-primary, #183D32)" />
              <span>Try asking about</span>
            </div>
            <div className="ai-divider-line" />
          </div>

          {/* 6 Clickable Suggestion Cards Grid (3 columns on desktop, 2 on tablet, 1 on mobile) */}
          <div className="ai-suggestions-grid">
            {SUGGESTED_QUESTIONS.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="ai-suggestion-card"
                  onClick={() => handleSend(item.text)}
                  disabled={isLoading}
                >
                  <div className="ai-suggestion-card-left">
                    <IconComp size={18} className="ai-suggestion-icon" />
                    <span className="ai-suggestion-text">{item.text}</span>
                  </div>
                  <ChevronRight size={15} className="ai-suggestion-arrow" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ======================================================================
           CONVERSATION VIEW (Active Chat State after prompt submission)
           ====================================================================== */
        <div className="ai-chat-conversation-container">
          {/* Top Conversation Toolbar */}
          <div className="ai-chat-toolbar">
            <div className="ai-chat-identity">
              <BrandLogo variant="light" layout="emblem-only" emblemHeight={24} clickable={false} />
              <div>
                <span className="ai-chat-identity-title">ParyatakRoute Travel Intelligence</span>
                <span className="ai-chat-identity-badge" style={{ marginLeft: 8 }}>AI Advisor</span>
              </div>
            </div>

            <div className="ai-chat-toolbar-actions">
              <button
                type="button"
                onClick={handleResetConversation}
                className="btn-secondary"
                style={{ fontSize: 13, padding: '7px 14px' }}
                title="Start a new conversation"
              >
                <RefreshCw size={13} />
                <span>New Chat</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/create')}
                className="btn-primary"
                style={{ fontSize: 13, padding: '7px 16px' }}
              >
                <Calendar size={13} />
                <span>Plan Trip Wizard</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="ai-messages-stream">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.sender === 'user' ? 'ai-message-row-user' : 'ai-message-row-assistant'}
              >
                {/* User Message Bubble */}
                {msg.sender === 'user' ? (
                  <>
                    <div className="ai-message-bubble-user">{msg.text}</div>
                    <span className="ai-message-meta-user">{msg.timestamp}</span>
                  </>
                ) : (
                  /* Assistant Message Bubble */
                  <>
                    <div className="ai-message-bubble-assistant">
                      <MarkdownRenderer content={msg.text} />

                      {/* Follow-up Action Chips */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="ai-followup-chips">
                          {msg.suggestedActions.map((action, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="ai-followup-chip"
                              onClick={() => {
                                if (action.includes('Plan') || action.includes('Itinerary')) {
                                  navigate('/create');
                                } else {
                                  handleSend(action);
                                }
                              }}
                            >
                              <span>{action}</span>
                              <ArrowRight size={12} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assistant Message Actions (Copy & Timestamp) */}
                    <div className="ai-message-meta-assistant">
                      <BrandLogo variant="light" layout="emblem-only" emblemHeight={16} clickable={false} />
                      <span>Paryatak Intelligence • {msg.timestamp}</span>
                      <span style={{ margin: '0 4px' }}>•</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className={`ai-action-btn ${copiedId === msg.id ? 'copied' : ''}`}
                        title="Copy text to clipboard"
                      >
                        {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="ai-message-row-assistant">
                <div className="ai-loading-bubble">
                  <Loader2 size={16} className="spinner" style={{ color: 'var(--color-primary, #183D32)' }} />
                  <span>Analyzing regional travel intelligence & weather...</span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="ai-error-banner">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => handleSend(undefined, true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D9383A',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Persistent Bottom Message Composer */}
          <div className="ai-bottom-composer">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <div className="ai-hero-input-pill">
                <div className="ai-hero-input-icon">
                  <Sparkles size={18} color="var(--color-primary, #183D32)" />
                </div>
                <input
                  ref={conversationInputRef}
                  type="text"
                  className="ai-hero-input-field"
                  placeholder="Ask a follow-up question or explore another destination..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="submit"
                  className="ai-hero-send-btn"
                  disabled={!input.trim() || isLoading}
                  title="Send message"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="spinner" />
                  ) : (
                    <Send size={18} style={{ transform: 'translateX(1px)' }} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
