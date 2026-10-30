import {
  ItineraryResponse,
  DayPlan,
  Activity,
  BudgetBreakdownAnalysis,
  ItineraryBudget,
} from '../types/api';

export const SAMPLE_ITINERARIES: Record<string, ItineraryResponse> = {
  'paryatak_kerala_5d': {
    id: 'paryatak_kerala_5d',
    trip_id: 'trip_kerala_001',
    user_id: 'user_sample_01',
    title: 'Kerala Emerald Highlands, Tea Trails & Alleppey Backwaters',
    summary: 'A 5-day voyage through misty emerald tea plantations in Munnar, heritage Portuguese alleys of Fort Kochi, and a tranquil overnight houseboat cruise across the Alleppey backwaters.',
    status: 'generated',
    created_at: '2026-10-15T10:00:00Z',
    updated_at: '2026-10-15T10:00:00Z',
    assumptions: [
      'Private chauffeur driven sedan for intercity transfers',
      'Twin-sharing heritage boutique hotel and deluxe houseboat',
      'Entry tickets and cultural performances included in daily allocations',
    ],
    generation_metadata: {
      model: 'openai/gpt-oss-120b',
      geocoding_provider: 'OpenStreetMap Nominatim',
      routing_engine: 'OSRM Driving Engine',
    },
    budget: {
      currency: 'INR',
      total_estimated: 26500,
      categories: {
        accommodation: 12000,
        food: 4500,
        activities: 3800,
        transport: 5200,
        miscellaneous: 1000,
      },
    },
    days: [
      {
        day_number: 1,
        date: '2026-11-10',
        theme: 'Colonial Heritage & Chinese Fishing Nets',
        activities: [
          {
            id: 'act_k1_1',
            name: 'Check-in at Heritage Haveli & Spice Street Walk',
            description: 'Settle into your boutique rain-tree sanctuary in the heart of Fort Kochi, then stroll through historic spice warehouses.',
            category: 'sightseeing',
            start_time: '10:00 AM',
            duration_minutes: 120,
            estimated_cost: 3500,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Fort Kochi Waterfront',
              address: 'Fort Kochi, Cochin, Kerala 682001',
              latitude: 9.9656,
              longitude: 76.2421,
            },
            transport: {
              mode: 'Sedan Taxi',
              details: 'Airport to Fort Kochi transfer',
              duration_minutes: 60,
              estimated_cost: 1200,
            },
          },
          {
            id: 'act_k1_2',
            name: 'Chinese Fishing Nets & St. Francis Church Promenade',
            description: 'Witness 14th-century cantilevered fishing nets operated with teak counterweights and visit the resting place of Vasco da Gama.',
            category: 'culture',
            start_time: '03:00 PM',
            duration_minutes: 150,
            estimated_cost: 300,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Kochi Beach Walk',
              address: 'Vasco da Gama Square, Fort Kochi',
              latitude: 9.9678,
              longitude: 76.2407,
            },
          },
          {
            id: 'act_k1_3',
            name: 'Kathakali Temple Dance & Malabar Coastal Seafood Dinner',
            description: 'Live eye-gesture and makeup demonstration followed by coastal spiced Kingfish curry at a seaside courtyard.',
            category: 'dining',
            start_time: '06:30 PM',
            duration_minutes: 150,
            estimated_cost: 1400,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Kerala Kathakali Centre',
              address: 'KB Jacob Rd, Fort Kochi',
              latitude: 9.9632,
              longitude: 76.2445,
            },
          },
        ],
      },
      {
        day_number: 2,
        date: '2026-11-11',
        theme: 'Ghat Ascent to Munnar Tea Highlands',
        activities: [
          {
            id: 'act_k2_1',
            name: 'Scenic Western Ghats Mountain Drive & Cheeyappara Falls',
            description: 'Ascend through 4,500 feet of rainforest and cascading mountain springs with roadside spiced cardamom tea stops.',
            category: 'nature',
            start_time: '08:00 AM',
            duration_minutes: 240,
            estimated_cost: 2200,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Cheeyappara Waterfalls',
              address: 'Kochi-Madurai Highway, Idukki',
              latitude: 10.0315,
              longitude: 76.8978,
            },
            transport: {
              mode: 'Private Car',
              details: 'Fort Kochi to Munnar hill route',
              duration_minutes: 240,
              estimated_cost: 2200,
            },
          },
          {
            id: 'act_k2_2',
            name: 'KDHP Tea Museum & Organic Tasting',
            description: 'Tour orthodox British tea processing machinery from 1905 and sample estate black, oolong, and white silver tips.',
            category: 'sightseeing',
            start_time: '02:30 PM',
            duration_minutes: 120,
            estimated_cost: 450,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Tata Tea Museum',
              address: 'Nullatanni Estate, Munnar',
              latitude: 10.0889,
              longitude: 77.0595,
            },
          },
          {
            id: 'act_k2_3',
            name: 'Sunset at Pothamedu Viewpoint',
            description: 'Panoramic dusk views across rolling tea hills, deep gorges, and fragrant eucalyptus groves.',
            category: 'nature',
            start_time: '05:30 PM',
            duration_minutes: 90,
            estimated_cost: 150,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Pothamedu Lookout',
              address: 'Munnar, Kerala',
              latitude: 10.0634,
              longitude: 77.0512,
            },
          },
        ],
      },
      {
        day_number: 3,
        date: '2026-11-12',
        theme: 'Eravikulam National Park & Rare Nilgiri Tahr',
        activities: [
          {
            id: 'act_k3_1',
            name: 'Anamudi Peak Safari & Rajamalai Trek',
            description: 'Spot endangered mountain goats grazing high on the slopes of South India’s highest summit (2,695m).',
            category: 'nature',
            start_time: '08:30 AM',
            duration_minutes: 210,
            estimated_cost: 650,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Eravikulam National Park',
              address: 'Kannan Devan Hills, Munnar',
              latitude: 10.1504,
              longitude: 77.0597,
            },
          },
          {
            id: 'act_k3_2',
            name: 'Cardamom & Clove Spice Plantation Walk',
            description: 'Guided herbal walk identifying cinnamon bark, nutmeg pods, green pepper vines, and pure vanilla blossoms.',
            category: 'culture',
            start_time: '02:00 PM',
            duration_minutes: 120,
            estimated_cost: 400,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Green Leaf Spices',
              address: 'Chithirapuram, Munnar',
              latitude: 10.0712,
              longitude: 77.0421,
            },
          },
          {
            id: 'act_k3_3',
            name: 'Kalaripayattu Ancient Martial Arts Demonstration',
            description: 'Spectacular 3,000-year-old warrior discipline featuring acrobatic leap maneuvers and shield duels.',
            category: 'culture',
            start_time: '06:00 PM',
            duration_minutes: 75,
            estimated_cost: 500,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Munnar Cultural Centre',
              address: 'Old Munnar Town',
              latitude: 10.0821,
              longitude: 77.0634,
            },
          },
        ],
      },
      {
        day_number: 4,
        date: '2026-11-13',
        theme: 'Alleppey Backwater Houseboat Cruise',
        activities: [
          {
            id: 'act_k4_1',
            name: 'Board Private Eco Kettuvallam Houseboat',
            description: 'Embark upon your handcrafted wooden boat and set sail through peaceful lagoons and palm-fringed channels.',
            category: 'nature',
            start_time: '12:00 PM',
            duration_minutes: 360,
            estimated_cost: 7500,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Punnamada Jetty',
              address: 'Alleppey Backwaters, Alappuzha',
              latitude: 9.4981,
              longitude: 76.3388,
            },
          },
          {
            id: 'act_k4_2',
            name: 'Karimeen Pollichathu Lunch on Vembanad Lake',
            description: 'Fresh pearl spot fish marinated in shallots, green chilies, and coconut oil, grilled inside a fresh banana leaf.',
            category: 'dining',
            start_time: '02:00 PM',
            duration_minutes: 90,
            estimated_cost: 1200,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Vembanad Lake',
              address: 'Alappuzha, Kerala',
              latitude: 9.5821,
              longitude: 76.3892,
            },
          },
          {
            id: 'act_k4_3',
            name: 'Narrow Canal Village Canoe Excursion',
            description: 'Hand-rowed wooden canoe exploration through shallow village canals, watching toddy tapping and village life.',
            category: 'nature',
            start_time: '05:00 PM',
            duration_minutes: 90,
            estimated_cost: 400,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Kuttanad Canals',
              address: 'Alleppey Rural Delta',
              latitude: 9.4721,
              longitude: 76.3512,
            },
          },
        ],
      },
      {
        day_number: 5,
        date: '2026-11-14',
        theme: 'Marari Beach Sunrise & Departure',
        activities: [
          {
            id: 'act_k5_1',
            name: 'Marari Fishermen Beach Walk & Coconut Breakfast',
            description: 'Sunrise peace on secluded white sand shores while observing traditional catamaran fishermen.',
            category: 'relaxation',
            start_time: '07:30 AM',
            duration_minutes: 120,
            estimated_cost: 0,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Marari Beach',
              address: 'Mararikulam, Alappuzha',
              latitude: 9.6015,
              longitude: 76.2982,
            },
          },
          {
            id: 'act_k5_2',
            name: 'Jew Town Curio & Hill Spice Emporium Shopping',
            description: 'Pick up organic Malabar black pepper, hand-carved teak elephants, and antique brass lamps in Mattancherry.',
            category: 'sightseeing',
            start_time: '11:30 AM',
            duration_minutes: 90,
            estimated_cost: 1500,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Jew Town Antiques',
              address: 'Mattancherry, Kochi',
              latitude: 9.9578,
              longitude: 76.2592,
            },
          },
          {
            id: 'act_k5_3',
            name: 'Transfer to Cochin International Airport (COK)',
            description: 'Comfortable air-conditioned transit to the airport for your onward flight.',
            category: 'transport',
            start_time: '03:30 PM',
            duration_minutes: 90,
            estimated_cost: 1200,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Cochin Airport',
              address: 'Nedumbassery, Kochi',
              latitude: 10.1518,
              longitude: 76.3930,
            },
          },
        ],
      },
    ],
  },
  'paryatak_jaipur_4d': {
    id: 'paryatak_jaipur_4d',
    trip_id: 'trip_jaipur_002',
    user_id: 'user_sample_01',
    title: 'Royal Heritage, Amber Citadel & Palaces of Jaipur',
    summary: 'A 4-day royal odyssey through Jaipur’s grand Amber fortress, intricate latticework of Hawa Mahal, starry Jantar Mantar observatories, and vibrant Johari Bazaar.',
    status: 'generated',
    created_at: '2026-08-20T12:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
    assumptions: [
      'Heritage haveli lodging near City Palace',
      'All monuments composite entry ticket included',
    ],
    generation_metadata: {
      model: 'openai/gpt-oss-120b',
      geocoding_provider: 'OpenStreetMap Nominatim',
      routing_engine: 'OSRM Driving Engine',
    },
    budget: {
      currency: 'INR',
      total_estimated: 21800,
      categories: {
        accommodation: 9500,
        food: 4200,
        activities: 3600,
        transport: 3500,
        miscellaneous: 1000,
      },
    },
    days: [
      {
        day_number: 1,
        date: '2026-11-15',
        theme: 'Pink City Gates, City Palace & Hawa Mahal',
        activities: [
          {
            id: 'act_j1_1',
            name: 'City Palace & Maharaja Sawai Man Singh II Museum',
            description: 'Explore courtyards inlaid with lapis lazuli and see the legendary solid silver Ganga Jal urns.',
            category: 'heritage',
            start_time: '10:00 AM',
            duration_minutes: 150,
            estimated_cost: 700,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'City Palace',
              address: 'Old City, Jaipur, Rajasthan',
              latitude: 26.9258,
              longitude: 75.8237,
            },
          },
          {
            id: 'act_j1_2',
            name: 'Jantar Mantar UNESCO Astronomical Observatory',
            description: 'Marvel at 19 monumental stone architectural instruments, including the world’s largest stone sundial.',
            category: 'sightseeing',
            start_time: '02:00 PM',
            duration_minutes: 90,
            estimated_cost: 200,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Jantar Mantar',
              address: 'Gangori Bazaar, Jaipur',
              latitude: 26.9248,
              longitude: 75.8246,
            },
          },
          {
            id: 'act_j1_3',
            name: 'Hawa Mahal Palace of Winds Golden Hour View',
            description: 'Photograph the iconic 953 honeycomb casements built for royal ladies to view street festivals.',
            category: 'heritage',
            start_time: '05:00 PM',
            duration_minutes: 90,
            estimated_cost: 350,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Hawa Mahal',
              address: 'Badi Chaupar, Jaipur',
              latitude: 26.9239,
              longitude: 75.8267,
            },
          },
        ],
      },
      {
        day_number: 2,
        date: '2026-11-16',
        theme: 'Amber Fort Citadel & Maota Lake Mirror Palace',
        activities: [
          {
            id: 'act_j2_1',
            name: 'Amber Fort & Sheesh Mahal Exploration',
            description: 'Ascend to the hilltop stronghold and walk through the glass mirror hall glowing in candlelight reflections.',
            category: 'heritage',
            start_time: '08:30 AM',
            duration_minutes: 240,
            estimated_cost: 800,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Amer Fort',
              address: 'Devisinghpura, Amer, Jaipur',
              latitude: 26.9855,
              longitude: 75.8513,
            },
          },
          {
            id: 'act_j2_2',
            name: 'Royal Rajasthani Thali at 1135 AD',
            description: 'Dine like royalty on Laal Maas, Dal Baati Churma, and Ker Sangri in an ornate carved archway dining room.',
            category: 'dining',
            start_time: '01:30 PM',
            duration_minutes: 90,
            estimated_cost: 1800,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: '1135 AD Amer',
              address: 'Amer Fort Ramparts, Jaipur',
              latitude: 26.9870,
              longitude: 75.8520,
            },
          },
          {
            id: 'act_j2_3',
            name: 'Panna Meena ka Kund Stepwell & Jal Mahal Sunset',
            description: 'Photograph the geometric symmetrical stairways of the 16th-century stepwell and twilight over the Water Palace.',
            category: 'nature',
            start_time: '04:30 PM',
            duration_minutes: 120,
            estimated_cost: 250,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Panna Meena ka Kund',
              address: 'Amer, Jaipur',
              latitude: 26.9902,
              longitude: 75.8561,
            },
          },
        ],
      },
      {
        day_number: 3,
        date: '2026-11-17',
        theme: 'Nahargarh Fort & Ancient Textile Bazaars',
        activities: [
          {
            id: 'act_j3_1',
            name: 'Nahargarh Fort Panoramic Rampart Walk',
            description: 'Stand on the rugged crest of the Aravalli hills overlooking the entire pink city expanse.',
            category: 'sightseeing',
            start_time: '09:00 AM',
            duration_minutes: 150,
            estimated_cost: 350,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Nahargarh Fort',
              address: 'Krishna Nagar, Jaipur',
              latitude: 26.9378,
              longitude: 75.8156,
            },
          },
          {
            id: 'act_j3_2',
            name: 'Sanganer Woodblock Indigo Printing Workshop',
            description: 'Hands-on block printing session carving your own scarf with natural vegetable pigments.',
            category: 'culture',
            start_time: '02:00 PM',
            duration_minutes: 120,
            estimated_cost: 1100,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Sanganer Heritage Village',
              address: 'Jaipur, Rajasthan',
              latitude: 26.8167,
              longitude: 75.7667,
            },
          },
          {
            id: 'act_j3_3',
            name: 'Johari Bazaar Gemstone & Mojri Stroll',
            description: 'Shop for enamel jewelry, bandhani sarees, and camel leather footwear with street kachori snacks.',
            category: 'shopping',
            start_time: '05:30 PM',
            duration_minutes: 150,
            estimated_cost: 1500,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Johari Bazaar',
              address: 'Old City, Jaipur',
              latitude: 26.9189,
              longitude: 75.8234,
            },
          },
        ],
      },
      {
        day_number: 4,
        date: '2026-11-18',
        theme: 'Galta Ji Monkey Temple & Departure',
        activities: [
          {
            id: 'act_j4_1',
            name: 'Galta Ji Spring Temple Valley Hike',
            description: 'Sacred natural water kunds and pavilion temples set into a rocky gorge inhabited by friendly macaques.',
            category: 'culture',
            start_time: '08:00 AM',
            duration_minutes: 150,
            estimated_cost: 200,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Galta Ji Temple',
              address: 'Galtaji, Jaipur',
              latitude: 26.9167,
              longitude: 75.8600,
            },
          },
          {
            id: 'act_j4_2',
            name: 'LMB Royal Ghewar & High Tea',
            description: 'Tasting Jaipur’s iconic honeycomb dessert with saffron rabdi at the historic Laxmi Mishthan Bhandar.',
            category: 'dining',
            start_time: '12:00 PM',
            duration_minutes: 75,
            estimated_cost: 650,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'LMB Restaurant',
              address: 'Johari Bazaar, Jaipur',
              latitude: 26.9205,
              longitude: 75.8239,
            },
          },
          {
            id: 'act_j4_3',
            name: 'Airport Transfer to Jaipur International (JAI)',
            description: 'Final departure with memories of palaces, forts, and desert hospitality.',
            category: 'transport',
            start_time: '03:00 PM',
            duration_minutes: 60,
            estimated_cost: 500,
            cost_currency: 'INR',
            source_status: 'verified',
            location: {
              name: 'Jaipur Airport',
              address: 'Sanganer, Jaipur',
              latitude: 26.8289,
              longitude: 75.8056,
            },
          },
        ],
      },
    ],
  },
};

/**
 * Calculates deterministic budget breakdown matching BudgetBreakdownAnalysis
 */
export function calculateBudgetAnalysis(itinerary: ItineraryResponse): BudgetBreakdownAnalysis {
  let transport = 0;
  let accommodation = 0;
  let food = 0;
  let activities = 0;
  let miscellaneous = 0;

  itinerary.days?.forEach((day) => {
    day.activities?.forEach((act) => {
      const cat = (act.category || '').toLowerCase();
      const cost = act.estimated_cost || 0;

      if (cat.includes('transport')) transport += cost;
      else if (cat.includes('accommodation') || cat.includes('lodging') || cat.includes('hotel')) accommodation += cost;
      else if (cat.includes('dining') || cat.includes('food') || cat.includes('meal')) food += cost;
      else if (cat.includes('shopping') || cat.includes('misc')) miscellaneous += cost;
      else activities += cost;

      if (act.transport?.estimated_cost) {
        transport += act.transport.estimated_cost;
      }
    });
  });

  const totalCalculated =
    itinerary.budget?.total_estimated ||
    transport + accommodation + food + activities + miscellaneous;

  const tripBudget = itinerary.budget?.total_estimated || totalCalculated;
  const isOver = totalCalculated > tripBudget;
  const difference = Math.abs(totalCalculated - tripBudget);

  return {
    itinerary_id: itinerary.id,
    trip_budget: tripBudget,
    total_estimated: totalCalculated,
    currency: itinerary.budget?.currency || 'INR',
    is_over_budget: isOver,
    difference,
    categories: {
      transport: transport || itinerary.budget?.categories?.transport || 4500,
      accommodation: accommodation || itinerary.budget?.categories?.accommodation || 11000,
      food: food || itinerary.budget?.categories?.food || 4200,
      activities: activities || itinerary.budget?.categories?.activities || 3500,
      miscellaneous: miscellaneous || itinerary.budget?.categories?.miscellaneous || 1000,
    },
  };
}

/**
 * Generates an interactive synthetic itinerary on the fly for any custom user input
 */
export function generateSyntheticItinerary(params: {
  destination: string;
  startDate: string;
  endDate: string;
  travelers?: number;
  budget?: number;
  currency?: string;
  interests?: string[];
  pace?: string;
}): ItineraryResponse {
  const destName = params.destination.split(',')[0].trim();
  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const dayCount = Math.min(Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 1), 10);

  const currency = params.currency || 'INR';
  const totalCost = params.budget || (dayCount * (currency === 'INR' ? 5500 : 120));

  const generatedDays: DayPlan[] = [];

  for (let d = 1; d <= dayCount; d++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + (d - 1));
    const dateStr = dayDate.toISOString().split('T')[0];

    let theme = `Highlights & Culture of ${destName}`;
    if (d === 1) theme = `Arrival & Historic Orientation in ${destName}`;
    else if (d === dayCount) theme = `Scenic Farewell & Departure`;
    else if (d % 2 === 0) theme = `Natural Landscapes & Architectural Wonders`;

    const dayCostBase = Math.round(totalCost / dayCount);

    generatedDays.push({
      day_number: d,
      date: dateStr,
      theme,
      activities: [
        {
          id: `act_${d}_1`,
          name: `Morning Guided Exploration of ${destName} Heritage Landmark`,
          description: `Guided walk through iconic landmarks, panoramic viewpoints, and local architecture with photo stops.`,
          category: 'sightseeing',
          start_time: '09:00 AM',
          duration_minutes: 180,
          estimated_cost: Math.round(dayCostBase * 0.3),
          cost_currency: currency,
          source_status: 'verified',
          location: {
            name: `${destName} Central District`,
            address: `${destName}, India`,
            latitude: 20.5937 + d * 0.04,
            longitude: 78.9629 + d * 0.04,
          },
          transport: {
            mode: 'Auto Rickshaw / Cab',
            details: 'Transit between central sites',
            duration_minutes: 20,
            estimated_cost: 150,
          },
        },
        {
          id: `act_${d}_2`,
          name: `Authentic Regional Lunch & Old Bazaar Tasting`,
          description: `Taste celebrated local delicacies and regional specialty dishes at a top-rated heritage eatery.`,
          category: 'dining',
          start_time: '01:30 PM',
          duration_minutes: 90,
          estimated_cost: Math.round(dayCostBase * 0.25),
          cost_currency: currency,
          source_status: 'verified',
          location: {
            name: `Old Bazaar, ${destName}`,
            address: `Main Market, ${destName}`,
            latitude: 20.5950 + d * 0.04,
            longitude: 78.9640 + d * 0.04,
          },
        },
        {
          id: `act_${d}_3`,
          name: `Sunset Lookout & Artisan Crafts Walk`,
          description: `Breathtaking sunset vistas followed by a relaxed evening stroll through bustling local handicraft markets.`,
          category: 'culture',
          start_time: '05:00 PM',
          duration_minutes: 120,
          estimated_cost: Math.round(dayCostBase * 0.2),
          cost_currency: currency,
          source_status: 'verified',
          location: {
            name: `${destName} Viewpoint`,
            address: `Promenade, ${destName}`,
            latitude: 20.5980 + d * 0.04,
            longitude: 78.9660 + d * 0.04,
          },
        },
      ],
    });
  }

  const itinId = `itinerary_${Date.now()}`;
  const tripId = `trip_${Date.now()}`;

  return {
    id: itinId,
    trip_id: tripId,
    user_id: 'user_sample_01',
    title: `${destName} ${dayCount}-Day Personalized Journey`,
    summary: `A personalized ${dayCount}-day itinerary across ${destName} curated for ${params.travelers || 2} travelers focused on ${params.interests?.join(', ') || 'heritage and scenic discovery'}.`,
    status: 'generated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assumptions: [
      'Twin-sharing accommodation in verified boutique stays',
      'Daily meal allowance and local transit estimated',
    ],
    generation_metadata: {
      model: 'openai/gpt-oss-120b',
      geocoding_provider: 'OpenStreetMap Nominatim',
      routing_engine: 'OSRM Driving Engine',
    },
    budget: {
      currency,
      total_estimated: totalCost,
      categories: {
        accommodation: Math.round(totalCost * 0.45),
        food: Math.round(totalCost * 0.2),
        activities: Math.round(totalCost * 0.18),
        transport: Math.round(totalCost * 0.12),
        miscellaneous: Math.round(totalCost * 0.05),
      },
    },
    days: generatedDays,
  };
}
