import Checkin from '../models/checkinModel.js';
import { GoogleGenAI } from '@google/genai';

// Initialize Google Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Call Gemini API with prompt using GoogleGenAI client
async function callGemini(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    return response.text || '';
  } catch (error) {
    return '';
  }
}

// Fallback recommendations if AI response is invalid or empty
function fallbackRecommendations() {
  return [
    {
      name: 'Breathing exercise',
      rationale: 'Helps with immediate cravings and stress relief.',
      cautions: 'If you feel lightheaded, stop and rest.',
    },
    {
      name: 'Walk outside',
      rationale: 'Movement and fresh air can reduce cravings and improve mood.',
      cautions: 'Use safe routes and avoid risky areas.',
    },
    {
      name: 'Call a support person',
      rationale: 'Social support can help manage cravings and stress.',
      cautions: 'Reach out to trusted friends or professionals.',
    },
  ];
}

// Fetch latest check-in for user
async function fetchLatestCheckin(userId) {
  const checkin = await Checkin.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
  return checkin;
}

// Controller: recommend strains based on latest check-in using LLM knowledge only
const recommendStrainsFromCheckin = async (req, res) => {
  try {
    const userId = req.user._id; // assuming auth middleware sets req.user

    // 1. Get latest check-in
    const checkin = await fetchLatestCheckin(userId);
    if (!checkin) {
      return res.status(404).json({ success: false, message: 'No check-in data found' });
    }

    // 2. Build prompt with check-in data only
    const prompt = `
You are a compassionate cannabis harm-reduction assistant.

User's latest daily check-in:
- Mood level: ${checkin.mood}
- Craving level: ${checkin.craving}
- Stress level: ${checkin.stress}
- Energy level: ${checkin.energy || 'N/A'}

Based on the user's current state, recommend exactly 3 items in this order:
1. Two non-cannabis alternatives (e.g., mindfulness, exercise, hobbies)
2. One cannabis strain

For each recommendation, provide:

1. The name
2. Why it is recommended (brief rationale)
3. Any safety cautions or disclaimers

Format your response as a JSON array like this:

[
  {
    "name": "Name of alternative or strain",
    "rationale": "Reason for recommendation",
    "cautions": "Safety notes"
  },
  ...
]

Make sure the first two recommendations are non-cannabis alternatives, and the last recommendation is a cannabis strain.
`;

    // 3. Call Gemini
    const aiResponse = await callGemini(prompt);

    // 4. Parse Gemini JSON response robustly
    let recommendations = [];
    try {
      // Remove Markdown code block wrappers if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```')) {
        const lines = cleanedResponse.split('\n');
        if (lines.length >= 3) {
          lines.shift();
          lines.pop();
          cleanedResponse = lines.join('\n').trim();
        }
      }

      // Try direct parse
      recommendations = JSON.parse(cleanedResponse);
      if (!Array.isArray(recommendations)) throw new Error('Parsed JSON is not an array');
    } catch {
      // Try to extract JSON array substring from AI response
      const jsonArrayMatch = aiResponse.match(/$$.*$$/s);
      if (jsonArrayMatch) {
        try {
          recommendations = JSON.parse(jsonArrayMatch[0]);
          if (!Array.isArray(recommendations)) throw new Error('Extracted JSON is not an array');
        } catch {
          recommendations = [];
        }
      } else {
        recommendations = [];
      }
    }

    // 5. If no valid recommendations, use fallback
    if (!recommendations.length) {
      recommendations = fallbackRecommendations();
    }

    return res.json({ success: true, recommendations });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};

export {
  recommendStrainsFromCheckin,
};