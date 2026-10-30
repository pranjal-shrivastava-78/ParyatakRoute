# ParyatakRoute — Groq API Quota & Token Optimization Guide

**Project:** ParyatakRoute  
**AI Target Provider:** Groq Cloud API  
**Primary Model:** `openai/gpt-oss-120b` (Itinerary Generation & Day Regeneration)  
**Fast Model:** `openai/gpt-oss-20b` (Context-Aware Travel Chatbot)  

---

## 1. Groq Cloud Quota & Rate Limit Overview

On Groq Cloud:
- **Requests Per Minute (RPM)**: Free/Tier rate limits apply (typically 30 RPM).
- **Requests Per Day (RPD)**: High daily volume allowance (14,400 RPD).
- **Tokens Per Minute (TPM)**: Strict TPM limits (typically 6,000–30,000 TPM depending on model tier).

A full 7-day travel itinerary generation prompt with extensive descriptions consumes **2,000 to 3,500 input + output tokens** per invocation. If multiple users request itineraries simultaneously, TPM exhaustion (HTTP 429 `RATE_LIMIT_EXCEEDED`) can occur if not properly managed.

---

## 2. Token-Optimization Strategies

### Strategy A: Model Tier Segregation
1. **`openai/gpt-oss-120b`**: Used strictly for **Itinerary Generation** (`POST /api/v1/itineraries/generate`) and **Single-Day Regeneration** (`POST /api/v1/itineraries/:id/days/:dayNumber/regenerate`). Its high parameter count guarantees 100% adherence to complex nested JSON schemas.
2. **`openai/gpt-oss-20b`**: Used for the **AI Travel Chatbot** (`POST /api/v1/chat`). Runs at ~700+ tokens/second with an order-of-magnitude lower TPM footprint, delivering near-instant conversational responses.

### Strategy B: Prompt Token Compression
The generation prompt is engineered to strip boilerplate repetition while retaining strict structural constraints:

```text
-- OPTIMIZED SYSTEM PROMPT (Saves ~40% tokens) --
You are ParyatakRoute AI, an expert travel planner. Output ONLY valid JSON matching this schema:
{"title":"string","summary":"string","days":[{"dayNumber":1,"date":"YYYY-MM-DD","theme":"string","activities":[{"name":"string","description":"string","category":"string","startTime":"HH:MM","durationMinutes":120,"estimatedCost":0,"costCurrency":"INR","location":{"name":"string","latitude":null,"longitude":null},"transport":{"mode":"string","details":"string","durationMinutes":0,"estimatedCost":0},"sourceStatus":"unverified"}]}],"budget":{"currency":"INR","categories":{"transport":0,"accommodation":0,"food":0,"activities":0,"miscellaneous":0}}}
```

### Strategy C: Surgical Single-Day Regeneration
When a user asks to modify or regenerate Day 3 of a 7-day trip:
- **Naive Approach**: Send all 7 days to the AI and regenerate the entire trip (consuming ~3,000 tokens).
- **Optimized Method**: Send only the target day's date, destination, and user instructions:
  - Input tokens: ~250.
  - Output tokens: ~400.
  - **Token Savings: 78% reduction**. The FastAPI backend updates only the specific array index in `itineraries.days` via PostgreSQL `jsonb_set`.

### Strategy D: Chatbot Context Pruning
When the user chats with the AI assistant about a trip:
- Instead of serializing the entire 3,000-token itinerary document into the conversation history, the backend produces a concise 150-token executive summary:
  ```text
  TRIP SUMMARY:
  Destination: Jaipur | Dates: 2026-11-10 to 2026-11-13 (4 days) | Budget: INR 20000 | Travellers: 2
  Key Stops: Hawa Mahal, Amber Fort, City Palace, Chokhi Dhani.
  ```

---

## 3. Resilient Error Handling & Exponential Backoff

To handle unexpected burst rate limits gracefully:

```python
import asyncio
import random
from groq import Groq, RateLimitError

async def call_groq_with_retry(client: Groq, max_retries: int = 3, **kwargs):
    """
    Executes a Groq completion with bounded exponential backoff and jitter.
    """
    base_delay = 1.0
    for attempt in range(max_retries):
        try:
            return await client.chat.completions.create(**kwargs)
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise e
            # Exponential backoff with full jitter
            delay = base_delay * (2 ** attempt) + random.uniform(0.1, 0.5)
            print(f"[Groq AI] Rate limit encountered. Retrying in {delay:.2f}s...")
            await asyncio.sleep(delay)
```

---

## 4. Groq Environment Configuration (`.env`)

```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
GROQ_CHAT_MODEL=openai/gpt-oss-20b
GROQ_TIMEOUT_SECONDS=30
GROQ_MAX_RETRIES=3
```
