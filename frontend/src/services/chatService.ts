import apiClient from './apiClient';
import { APIResponse, ChatRequest, ChatResponse } from '../types/api';

export const chatService = {
  /**
   * Send a conversation message to Groq AI Travel Assistant.
   * Path: POST /api/v1/chat (Public & Authenticated)
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const payload = {
      message: request.message.trim(),
      trip_id: request.trip_id || request.tripId || undefined,
      itinerary_id: request.itinerary_id || request.itineraryId || undefined,
      history: (request.history || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    const res = await apiClient.post<APIResponse<ChatResponse>>('/chat', payload);

    if (!res.data || !res.data.data) {
      throw new Error(res.data?.message || 'Empty response received from AI assistant');
    }

    return {
      reply: res.data.data.reply,
      trip_context_applied: res.data.data.trip_context_applied,
      tripContextApplied: res.data.data.tripContextApplied,
      itinerary_context_applied: res.data.data.itinerary_context_applied,
      itineraryContextApplied: res.data.data.itineraryContextApplied,
      timestamp: res.data.data.timestamp || new Date().toISOString(),
      conversationId: request.conversationId || request.conversation_id || `conv_${Date.now()}`,
      suggestedActions: [
        'Tell me more about local dining',
        'What are the best photography spots?',
        'Provide day-by-day packing suggestions',
      ],
      intent: 'travel_advice',
    };
  },
};

export default chatService;
