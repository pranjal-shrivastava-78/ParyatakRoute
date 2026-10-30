import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, AlertCircle, Bot, User, CheckCircle2 } from 'lucide-react';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

interface ChatDrawerProps {
  currentTripId?: string;
  currentItineraryId?: string;
  tripDestination?: string;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  currentTripId,
  currentItineraryId,
  tripDestination,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: tripDestination
        ? `Namaste! I'm your ParyatakRoute Travel Companion. I have full context on your journey to **${tripDestination}**. How can I help fine-tune your itinerary or suggest local hidden gems?`
        : "Namaste! I'm your ParyatakRoute AI Travel Assistant. Ask me anything about destinations, local culture, travel tips, or packing lists!",
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lastContextApplied, setLastContextApplied] = useState<{
    trip: boolean;
    itinerary: boolean;
  }>({ trip: false, itinerary: false });

  const { isAuthenticated } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInputMessage('');
    setIsSending(true);

    try {
      // Send to FastAPI /api/v1/chat with history
      const response = await chatService.sendMessage({
        message: text,
        trip_id: currentTripId,
        itinerary_id: currentItineraryId,
        history: newHistory.slice(-8), // send recent conversation turns
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply },
      ]);
      setLastContextApplied({
        trip: !!response.trip_context_applied,
        itinerary: !!response.itinerary_context_applied,
      });
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        'Unable to reach Groq AI assistant. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${errMsg}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = tripDestination
    ? [
        `What are the must-try local dishes in ${tripDestination}?`,
        `What should we pack for ${tripDestination}?`,
        `Are there safety or cultural tips for ${tripDestination}?`,
      ]
    : [
        'Suggest a 4-day heritage trip in Rajasthan',
        'What are the best beach destinations for November?',
        'Tips for high-altitude acclimatization in Ladakh',
      ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        className="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Travel Assistant"
        aria-label="Travel Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="chat-drawer">
          {/* Header */}
          <div className="chat-drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>AI Travel Assistant</div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>
                  Powered by Groq AI
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Context bar if in trip/itinerary */}
          {(currentTripId || currentItineraryId) && (
            <div
              style={{
                backgroundColor: 'var(--color-hopper-blue-subtle)',
                padding: '6px 12px',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--color-hopper-blue)',
                fontWeight: 600,
                borderBottom: '1px solid var(--color-divider-gray)',
              }}
            >
              <CheckCircle2 size={13} />
              <span>
                Connected to journey {tripDestination ? `(${tripDestination})` : ''}
              </span>
            </div>
          )}

          {/* Messages Body */}
          <div className="chat-drawer-body">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${
                  msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                }`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, opacity: 0.8, fontSize: 11 }}>
                  {msg.role === 'user' ? (
                    <>
                      <User size={12} /> <span>You</span>
                    </>
                  ) : (
                    <>
                      <Bot size={12} /> <span>Paryatak Assistant</span>
                    </>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))}

            {isSending && (
              <div className="chat-bubble chat-bubble-assistant" style={{ fontStyle: 'italic', color: 'var(--color-graphite)' }}>
                Consulting Groq AI journey model...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions if few messages */}
          {messages.length <= 2 && (
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--color-white)',
                borderTop: '1px solid var(--color-cloud)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(p)}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-pills)',
                    border: '1px solid var(--color-divider-gray)',
                    backgroundColor: 'var(--color-cloud)',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="chat-input-bar">
            <input
              type="text"
              placeholder="Ask any travel question (e.g. local food, packing, hidden gems)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{
                flex: 1,
                border: '1px solid var(--color-divider-gray)',
                borderRadius: 'var(--radius-pills)',
                padding: '8px 14px',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isSending || !inputMessage.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: 'var(--color-hopper-blue)',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSending || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                opacity: isSending || !inputMessage.trim() ? 0.6 : 1,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
          }}
        />
      )}
    </>
  );
};

export default ChatDrawer;
