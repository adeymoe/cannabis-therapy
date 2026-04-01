import TPlan from '../models/tplanModel.js';
import DailyCheckin from '../models/checkinModel.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Helper: build weekly targets ────────────────────────────────────────────
const buildWeeklyTargets = (currentUsage, targetUsage, durationWeeks, aiWeeklyNotes = []) => {
  const targets = [];
  const totalReduction = currentUsage - targetUsage;
  const startDate = new Date();

  for (let w = 1; w <= durationWeeks; w++) {
    const progress = w / durationWeeks;
    const easedProgress = Math.pow(progress, 0.75);
    const targetPerDay = Math.max(
      targetUsage,
      Math.round((currentUsage - totalReduction * easedProgress) * 10) / 10
    );

    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (w - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    targets.push({
      week: w,
      targetPerDay,
      startDate: weekStart,
      endDate: weekEnd,
      notes: aiWeeklyNotes[w - 1] || '',
    });
  }
  return targets;
};

// ─── Helper: get AI refinement ────────────────────────────────────────────────
const getAIRefinement = async (goal, recentCheckins) => {
  const checkinSummary = recentCheckins.length
    ? recentCheckins.slice(0, 7).map(c =>
        `Date: ${new Date(c.createdAt).toDateString()}, Mood: ${c.mood}/10, Craving: ${c.craving}/10, Stress: ${c.stress}/10`
      ).join('\n')
    : 'No recent check-in data available.';

  const prompt = `
You are a compassionate cannabis harm-reduction therapist AI.

A user wants to create a tapering plan with these details:
- Current usage: ${goal.currentUsage} ${goal.unit}/day
- Target usage: ${goal.targetUsage} ${goal.unit}/day
- Duration: ${goal.durationWeeks} weeks
- Reason for reducing: "${goal.reason}"

Their recent check-in data (last 7 days):
${checkinSummary}

Please provide:
1. A short personalised encouragement message (2-3 sentences) acknowledging their reason and check-in patterns.
2. A JSON array of exactly ${goal.durationWeeks} short weekly tip strings (one per week, max 15 words each).

Respond ONLY in this JSON format:
{
  "encouragement": "...",
  "weeklyTips": ["tip for week 1", "tip for week 2", ...]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const raw = response.candidates[0].content.parts[0].text;
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      encouragement: parsed.encouragement || '',
      weeklyTips: Array.isArray(parsed.weeklyTips) ? parsed.weeklyTips : [],
    };
  } catch (err) {
    console.error('Gemini T-Plan error:', err.message);
    return {
      encouragement: "You're taking a brave step. Every small reduction counts.",
      weeklyTips: [],
    };
  }
};

// ─── POST /api/tplan/create ───────────────────────────────────────────────────
export const createTPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentUsage, targetUsage, unit, durationWeeks, reason } = req.body;

    if (currentUsage == null || targetUsage == null || !durationWeeks) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Deactivate any existing active plan
    await TPlan.updateMany({ user: userId, status: 'active' }, { status: 'paused' });

    // Fetch recent check-ins for AI context
    const recentCheckins = await DailyCheckin.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(7);

    const goal = {
      currentUsage,
      targetUsage,
      unit: unit || 'sessions',
      durationWeeks,
      reason: reason || '',
    };

    // Get AI refinement
    const { encouragement, weeklyTips } = await getAIRefinement(goal, recentCheckins);

    // Build weekly targets with AI tips
    const weeklyTargets = buildWeeklyTargets(currentUsage, targetUsage, durationWeeks, weeklyTips);

    const plan = await TPlan.create({
      user: userId,
      goal,
      aiRefinement: encouragement,
      weeklyTargets,
      progressLogs: [],
    });

    res.status(201).json({ success: true, plan });
  } catch (err) {
    console.error('createTPlan error:', err);
    res.status(500).json({ success: false, message: 'Server error creating plan.' });
  }
};

// ─── Enrichment helpers ───────────────────────────────────────────────────────
const computeStreak = (progressLogs) => {
  if (!progressLogs?.length) return 0;
  const sorted = [...progressLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const log of sorted) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    const diff = Math.round((current - logDate) / (1000 * 60 * 60 * 24));
    if (diff === 0 || diff === 1) {
      streak++;
      current = logDate;
    } else break;
  }
  return streak;
};

const computeMoodBreakdown = (progressLogs) => {
  const breakdown = { great: 0, okay: 0, tough: 0, craving: 0 };
  for (const log of progressLogs || []) {
    if (log.mood && breakdown[log.mood] !== undefined) breakdown[log.mood]++;
  }
  return breakdown;
};

const computeWeeklyProgress = (progressLogs, weeklyTargets) =>
  weeklyTargets.map(wt => {
    const logsInWeek = (progressLogs || []).filter(l => {
      const d = new Date(l.date);
      return d >= new Date(wt.startDate) && d <= new Date(wt.endDate);
    });
    const avgUsage = logsInWeek.length
      ? parseFloat((logsInWeek.reduce((s, l) => s + l.actualUsage, 0) / logsInWeek.length).toFixed(2))
      : null;
    return {
      week: wt.week,
      targetPerDay: wt.targetPerDay,
      avgActualUsage: avgUsage,
      logCount: logsInWeek.length,
      met: avgUsage !== null ? avgUsage <= wt.targetPerDay : null,
    };
  });

// ─── GET /api/tplan/active ────────────────────────────────────────────────────
export const getActivePlan = async (req, res) => {
  try {
    const plan = await TPlan.findOne({
      user: req.user.id,
      status: { $in: ['active', 'paused'] },
    }).lean();

    if (!plan) return res.json({ success: true, plan: null });

    const now = new Date();
    const planStart = new Date(plan.createdAt);
    const daysDiff = Math.floor((now - planStart) / (1000 * 60 * 60 * 24));
    const currentWeek = Math.min(Math.floor(daysDiff / 7) + 1, plan.goal.durationWeeks);

    // Adherence: % of days since start that have a log
    const totalLogs = plan.progressLogs.length;
    const daysSinceStart = Math.max(daysDiff, 1);
    const adherence = totalLogs > 0 ? Math.round((totalLogs / daysSinceStart) * 100) : 0;

    const streak = computeStreak(plan.progressLogs);
    const moodBreakdown = computeMoodBreakdown(plan.progressLogs);
    const weeklyProgress = computeWeeklyProgress(plan.progressLogs, plan.weeklyTargets);
    const currentTarget = plan.weeklyTargets.find(t => t.week === currentWeek) || null;

    const todayLog = plan.progressLogs.find(l =>
      new Date(l.date).toDateString() === now.toDateString()
    );

    res.json({
      success: true,
      plan: {
        ...plan,
        currentWeek,
        adherence,
        streak,
        moodBreakdown,
        weeklyProgress,
        currentTarget,
        todayLogged: !!todayLog,
        todayUsage: todayLog?.actualUsage ?? null,
        todayMood: todayLog?.mood ?? null,
      },
    });
  } catch (err) {
    console.error('getActivePlan error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching plan.' });
  }
};

// ─── GET /api/tplan/all ───────────────────────────────────────────────────────
export const getAllPlans = async (req, res) => {
  try {
    const plans = await TPlan.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/tplan/log ──────────────────────────────────────────────────────
export const logProgress = async (req, res) => {
  try {
    const { actualUsage, mood, notes, source } = req.body;

    if (actualUsage == null) {
      return res.status(400).json({ success: false, message: 'actualUsage is required.' });
    }

    const plan = await TPlan.findOne({ user: req.user.id, status: 'active' });
    if (!plan) return res.status(404).json({ success: false, message: 'No active plan found.' });

    // Check for existing log today — update instead of duplicate
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = plan.progressLogs.find(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    let updated = false;
    if (existingLog) {
      existingLog.actualUsage = actualUsage;
      if (mood) existingLog.mood = mood;
      if (notes !== undefined) existingLog.notes = notes;
      updated = true;
    } else {
      plan.progressLogs.push({
        date: new Date(),
        actualUsage,
        mood: mood || 'okay',
        source: source || 'manual',
        notes: notes || '',
      });
    }

    // Auto-complete if plan end date has passed
    const now = new Date();
    const lastWeek = plan.weeklyTargets[plan.weeklyTargets.length - 1];
    if (lastWeek && now > new Date(lastWeek.endDate)) plan.status = 'completed';

    await plan.save();

    const lastLog = updated
      ? plan.progressLogs.find(log => {
          const logDate = new Date(log.date);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime();
        })
      : plan.progressLogs[plan.progressLogs.length - 1];

    res.json({
      success: true,
      message: updated ? "Today's log updated." : 'Usage logged successfully.',
      log: lastLog,
      plan,
    });
  } catch (err) {
    console.error('logProgress error:', err);
    res.status(500).json({ success: false, message: 'Server error logging progress.' });
  }
};

// ─── PUT /api/tplan/:id/status ────────────────────────────────────────────────
export const updatePlanStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const plan = await TPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { new: true }
    );

    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/tplan/:id ────────────────────────────────────────────────────
export const deleteTPlan = async (req, res) => {
  try {
    const plan = await TPlan.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
    res.json({ success: true, message: 'Plan deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};