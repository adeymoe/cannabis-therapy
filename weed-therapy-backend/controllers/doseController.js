import DoseLog from '../models/doseLogModel.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Safety Score Calculator ───────────────────────────────────────────────
const safeThresholds = {
  joint: 1,      // grams
  vape: 50,      // puffs
  edible: 10,    // mg
  tincture: 1,   // ml
  bong: 1,       // grams
  dab: 0.3,      // grams
};

const computeSafetyScore = (method, thcPotency, amount, recentLogsCount) => {
  let score = 10;
  if (thcPotency > 20) score -= 3;
  else if (thcPotency > 15) score -= 1;
  if (method === 'dab') score -= 2;
  if (method === 'bong') score -= 1;
  const threshold = safeThresholds[method] || 1;
  if (amount > threshold * 2) score -= 2;
  else if (amount > threshold) score -= 1;
  if (recentLogsCount >= 3) score -= 2;
  else if (recentLogsCount >= 2) score -= 1;
  return Math.max(1, Math.min(10, score));
};

// ─── Gemini AI Feedback ────────────────────────────────────────────────────
const generateDoseFeedback = async (method, thcPotency, cbdPotency, amount, unit, safetyScore) => {
  try {
    const prompt = `
You are a cannabis harm reduction specialist. A user just logged a cannabis session:
- Method: ${method}
- THC Potency: ${thcPotency}%
- CBD Potency: ${cbdPotency}%
- Amount: ${amount} ${unit}
- Safety Score: ${safetyScore}/10

Write a short, non-judgmental, evidence-based harm reduction tip (2–3 sentences max).
Focus on: safe consumption, tolerance awareness, and when to take a break.
If the safety score is below 5, gently flag the risk. Keep it warm and supportive.
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || 'Stay mindful of your consumption and take breaks when needed.';
  } catch (err) {
    console.error('Gemini dose feedback error:', err.message);
    return 'Stay mindful of your consumption and take breaks when needed.';
  }
};

// ─── POST /api/dose/log ────────────────────────────────────────────────────
const logDose = async (req, res) => {
  try {
    const { method, thcPotency, cbdPotency, amount, unit, notes } = req.body;
    const userId = req.user._id;

    if (!method || thcPotency == null || !amount || !unit) {
      return res.status(400).json({ success: false, message: 'method, thcPotency, amount, and unit are required.' });
    }

    // Count logs in last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await DoseLog.countDocuments({ userId, createdAt: { $gte: since } });

    const safetyScore = computeSafetyScore(method, thcPotency, amount, recentCount);
    const aiFeedback = await generateDoseFeedback(method, thcPotency, cbdPotency || 0, amount, unit, safetyScore);

    const doseLog = await DoseLog.create({
      userId,
      method,
      thcPotency,
      cbdPotency: cbdPotency || 0,
      amount,
      unit,
      notes: notes || '',
      safetyScore,
      aiFeedback,
    });

    res.status(201).json({ success: true, data: doseLog });
  } catch (err) {
    console.error('logDose error:', err.message);
    res.status(500).json({ success: false, message: 'Server error logging dose.' });
  }
};

// ─── GET /api/dose/history ─────────────────────────────────────────────────
const getDoseHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const logs = await DoseLog.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error('getDoseHistory error:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching history.' });
  }
};

// ─── GET /api/dose/stats ───────────────────────────────────────────────────
const getDoseStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logs = await DoseLog.find({ userId, createdAt: { $gte: since } }).sort({ createdAt: 1 });

    if (logs.length === 0) {
      return res.json({ success: true, data: { totalSessions: 0, avgSafetyScore: null, avgThc: null, mostUsedMethod: null, safetyTrend: [] } });
    }

    const totalSessions = logs.length;
    const avgSafetyScore = parseFloat((logs.reduce((s, l) => s + l.safetyScore, 0) / logs.length).toFixed(1));
    const avgThc = parseFloat((logs.reduce((s, l) => s + l.thcPotency, 0) / logs.length).toFixed(1));

    const methodCounts = logs.reduce((acc, l) => { acc[l.method] = (acc[l.method] || 0) + 1; return acc; }, {});
    const mostUsedMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const safetyTrend = logs.map((l) => ({
      date: l.createdAt.toISOString().split('T')[0],
      safetyScore: l.safetyScore,
      thcPotency: l.thcPotency,
      method: l.method,
    }));

    res.json({ success: true, data: { totalSessions, avgSafetyScore, avgThc, mostUsedMethod, safetyTrend } });
  } catch (err) {
    console.error('getDoseStats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
};

// ─── DELETE /api/dose/:id ──────────────────────────────────────────────────
const deleteDoseLog = async (req, res) => {
  try {
    const log = await DoseLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found.' });
    res.json({ success: true, message: 'Log deleted.' });
  } catch (err) {
    console.error('deleteDoseLog error:', err.message);
    res.status(500).json({ success: false, message: 'Server error deleting log.' });
  }
};

export { logDose, getDoseHistory, getDoseStats, deleteDoseLog };