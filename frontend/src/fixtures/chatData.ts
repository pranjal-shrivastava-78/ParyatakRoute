export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

export const SUGGESTED_PROMPTS = [
  'What is the best time to visit Ladakh without acclimatization issues?',
  'Top 3 heritage spots in Jaipur for photography',
  'How to plan a 4-day budget backpacking trip to South Goa',
  'What should I pack for Kerala in December?',
  'Vegetarian street food guide for Varanasi',
];

export function getAssistantReply(userQuery: string): { reply: string; suggestedActions?: string[] } {
  const query = userQuery.toLowerCase();

  if (query.includes('ladakh') || query.includes('leh')) {
    return {
      reply: `For **Leh & Ladakh**, the golden window is **June through September** when roads via Manali and Srinagar open.

Key tips:
1. **Acclimatization:** Spend your first 48 hours resting in Leh town (altitude 3,500m) before crossing passes like Khardung La (5,359m).
2. **Inner Line Permits:** Required for Nubra Valley and Pangong Tso—easily arranged in Leh or online.
3. **Clothing:** Layering is vital. Temperatures swing from +22°C during daytime sunshine to -2°C at night at Pangong Lake.`,
      suggestedActions: ['View 6-Day Ladakh Itinerary', 'Weather Forecast in Leh', 'Plan Ladakh Trip'],
    };
  }

  if (query.includes('jaipur') || query.includes('rajasthan')) {
    return {
      reply: `In **Jaipur**, best photography lighting happens in early morning and golden hour:

1. **Panna Meena ka Kund:** Arrive by 7:30 AM before tourists crowd the geometric 8-story stepwell.
2. **Hawa Mahal:** Best photographed across the street from Wind View Cafe during sunrise when morning light hits the pink facade.
3. **Amer Fort:** Take the elephant trail or upper rampart walk near Jaigarh Fort for panoramic valley shots.`,
      suggestedActions: ['View 4-Day Jaipur Plan', 'Best Cafes in Jaipur', 'Plan Jaipur Trip'],
    };
  }

  if (query.includes('kerala') || query.includes('munnar') || query.includes('alleppey')) {
    return {
      reply: `**Kerala** in winter (November to February) is pure bliss with pleasant 20-28°C temperatures and clear skies.

Packing recommendations:
- Lightweight cotton or linen clothing for Cochin & Alleppey.
- Light woolen fleece or cardigan for Munnar evenings (can drop to 12°C).
- Comfortable walking sandals and eco-friendly mosquito repellent.
- Don't miss Karimeen Pollichathu on an Alleppey backwater cruise!`,
      suggestedActions: ['Explore 5-Day Kerala Plan', 'Houseboat Booking Tips', 'Plan Kerala Trip'],
    };
  }

  if (query.includes('goa') || query.includes('beach')) {
    return {
      reply: `For a **budget 4-day trip to Goa**:

- **Stay in South Goa:** Agonda or Palolem beach huts offer peaceful shores at ₹1,500-2,500/night.
- **Transport:** Rent a scooter (approx. ₹350-500/day) to easily hop between Cabo de Rama Fort and Cola Beach.
- **Heritage Walk:** Dedicate an afternoon to the colorful Latin Quarter of Fontainhas in Panaji.`,
      suggestedActions: ['View Goa Itinerary', 'Best Beaches in Goa', 'Plan Goa Trip'],
    };
  }

  if (query.includes('budget') || query.includes('cost') || query.includes('money')) {
    return {
      reply: `Here are **smart budget travel guidelines** for India:

- **Backpacker:** ₹1,200 - ₹2,000/day (Hostels, sleeper trains, local thalis).
- **Comfort Traveler:** ₹3,500 - ₹6,000/day (Boutique homestays, AC trains/taxis, mid-range dining).
- **Luxury Heritage:** ₹12,000+/day (Palace hotels, private chauffeur, fine-dining).

ParyatakRoute’s deterministic budget engine recalculates itemized activity expenses dynamically!`,
      suggestedActions: ['Calculate Trip Budget', 'Compare Destinations'],
    };
  }

  // Default intelligent travel assistant reply
  return {
    reply: `That is a wonderful travel question! 

ParyatakRoute specializes in **crafting personalized, geospatially optimized travel journeys**. You can use our **Create Trip** wizard to generate an hour-by-hour itinerary complete with estimated expenses, driving routes, and weather forecasts.

Would you like me to recommend top destinations matching your preferred travel style?`,
    suggestedActions: ['Explore Top Destinations', 'Generate 3-Day Itinerary', 'Find Mountain Escapes'],
  };
}
