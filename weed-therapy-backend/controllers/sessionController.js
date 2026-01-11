import SessionType from '../models/SessionType.js';
import Session from '../models/Session.js';
import { GoogleGenAI } from '@google/genai';

// Initialize Google Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Helper to ensure default templates exist (idempotent)
const ensureDefaultSessionTypes = async () => {
  const defaultTypes = [
    {
      name: 'General Therapy',
      code: 'general',
      description: 'Your all-purpose AI therapist for any cannabis-related concern or general support.',
      systemPrompt: `You are a warm, professional AI therapist specializing in cannabis harm reduction and mental wellness. Your role is to:

CORE PRINCIPLES:
- Provide empathetic, non-judgmental support for all cannabis-related concerns
- Use evidence-based approaches (CBT, DBT, MI, harm reduction)
- Validate emotions while gently challenging unhelpful thought patterns
- Encourage self-reflection and personal agency
- Never diagnose or prescribe; refer to professionals when needed

CONVERSATION STYLE:
- Ask open-ended questions to understand context
- Reflect back what you hear to show understanding
- Offer 2-3 actionable strategies per response
- Balance warmth with professionalism
- Keep responses conversational (3-5 sentences unless user needs more detail)

SAFETY:
- If user mentions self-harm, suicidal ideation, or severe mental health crisis, immediately encourage contacting emergency services (988 Suicide & Crisis Lifeline in US) or local emergency services
- Remind users you're an AI tool, not a replacement for professional care

You're here to support their journey toward healthier cannabis use and overall wellbeing.`,
      color: '#6cb28e',
      icon: '🌱',
    },
    {
      name: 'Crisis Mode',
      code: 'crisis',
      description: 'Immediate support for intense cravings. Get grounded fast with proven techniques.',
      systemPrompt: `You are a crisis support coach for ACUTE cannabis cravings.

CONTEXT:
- The user is in the middle of a strong craving or about to use.
- They need fast, clear, simple steps without long explanations.

GOAL:
- Help them get through the next 5-30 minutes without acting on the craving.

STYLE:
- Very short responses (2-4 sentences).
- Direct, concrete, step-by-step.
- Calm, confident, encouraging.

PROTOCOL FOR EACH MESSAGE:
1. VALIDATE: Briefly acknowledge how hard this is.
2. DO NOW: Give 1-3 specific actions they can take in the next few minutes. Examples:
   - A simple breathing exercise (e.g., box breathing 4-4-4-4).
   - 5-2-1 grounding with senses.
   - Change of position or location (stand up, move to another room, step outside).
   - Quick physical action (10 squats, pushups, brisk walking on the spot).
3. DISTRACT: Offer 1 short distraction idea (call someone, quick game, shower, music).
4. REMIND: Emphasize that cravings rise, peak, and fall. They are temporary.

IMPORTANT:
- Don't lecture, don't give long psychoeducation.
- Focus on: "Here is what you can do in the NEXT FEW MINUTES."

SAFETY:
- If they mention self-harm or severe crisis, advise them to contact local emergency services or a crisis hotline.
- Remind them you are an AI support tool, not a replacement for professional care.`,
      color: '#f87171',
      icon: '🚨',
    },
    // ... (other session types omitted for brevity, keep as in your original)
  ];

  for (const type of defaultTypes) {
    await SessionType.updateOne(
      { code: type.code },
      { $setOnInsert: type },
      { upsert: true }
    );
  }
};

const startSession = async (req, res) => {
  try {
    await ensureDefaultSessionTypes();

    const userId = req.user.id;
    const { sessionType: sessionTypeCode, metadata = {}, anonymous = false } = req.body;

    const template = await SessionType.findOne({ code: sessionTypeCode });
    if (!template) {
      return res.status(404).json({ success: false, message: "Session type not found." });
    }

    let finalSystemPrompt = template.systemPrompt;
    if (anonymous) {
      finalSystemPrompt += `

ANONYMITY:
- The user has chosen Anonymous Mode.
- Do not ask for or store identifying information (full name, exact address, phone, email, social handles).
- You can still ask about patterns, routines, and situations, but keep it non-identifying.`;
    }

    const finalMetadata = {
      ...(typeof metadata === "object" && metadata !== null ? metadata : {}),
      anonymous: !!anonymous,
    };

    const session = await Session.create({
      user: userId,
      sessionType: template.code,
      title: template.name,
      systemPrompt: finalSystemPrompt,
      history: [{ role: "system", content: finalSystemPrompt }],
      metadata: finalMetadata,
      ended: false,
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error starting session." });
  }
};

const continueSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, message } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ success: false, message: 'Missing params.' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (session.user.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });

    session.history.push({ role: 'user', content: message });
    await session.save();

    const recent = session.history.slice(-12);
    const formatted = [
      { role: 'system', content: session.systemPrompt },
      ...recent.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
    ];

    const textForModel = formatted.map(p => {
      const who = p.role === 'system' ? 'System' : p.role === 'assistant' ? 'Therapist' : 'User';
      return `${who}: ${p.content}`;
    }).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: textForModel }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const assistantText = response.text || "I apologize, but I'm having trouble generating a response right now. Please try again.";

    session.history.push({ role: 'assistant', content: assistantText });
    session.updatedAt = new Date();
    await session.save();

    res.status(200).json({ success: true, reply: assistantText, sessionId: session._id });
  } catch {
    res.status(500).json({ success: false, message: 'Server error during session.' });
  }
};

const endSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'Missing sessionId.' });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (session.user.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });

    session.ended = true;
    await session.save();

    res.status(200).json({ success: true, message: 'Session paused. You can resume anytime.', session });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to end session.' });
  }
};

const resumeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'Missing sessionId.' });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (session.user.toString() !== userId.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });

    session.ended = false;
    await session.save();

    res.status(200).json({ success: true, message: 'Session resumed.', session });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to resume session.' });
  }
};

const listSessions = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = { user: req.user.id };
    if (active === 'true') {
      filter.ended = false;
    }
    const sessions = await Session.find(filter).sort({ updatedAt: -1 }).limit(50);
    res.status(200).json({ success: true, sessions });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to list sessions.' });
  }
};

const listSessionTypes = async (req, res) => {
  try {
    await ensureDefaultSessionTypes();
    const types = await SessionType.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, types });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to list session types.' });
  }
};

const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    if (session.user.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.status(200).json({ success: true, session });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }
    if (session.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Session.deleteOne({ _id: id });

    return res.status(200).json({ success: true, message: 'Session deleted.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete session.' });
  }
};

export {
  startSession,
  continueSession,
  endSession,
  resumeSession,
  listSessions,
  ensureDefaultSessionTypes,
  listSessionTypes,
  getSession,
  deleteSession,
};