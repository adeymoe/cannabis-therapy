import checkinModel from "../models/checkinModel.js";
import { GoogleGenAI } from '@google/genai';

// Initialize Google Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Helper: get start of today (midnight)
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper: get end of today (23:59:59.999)
const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Helper: build an array of dates (YYYY-MM-DD) between two dates inclusive
const buildDateRange = (from, to) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const out = [];
  for (let t = from.getTime(); t <= to.getTime(); t += oneDay) {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    out.push(d.toISOString().slice(0, 10)); // 'YYYY-MM-DD'
  }
  return out;
};

// Helper: compute mean of numeric array, null if empty
const mean = (arr) => {
  if (!arr || !arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
};

// Helper: Pearson correlation between two equal-length arrays
// Returns number between -1..1 or null if not computable
const pearsonCorrelation = (xs, ys) => {
  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length || xs.length < 2) return null;
  const n = xs.length;
  const meanX = mean(xs);
  const meanY = mean(ys);
  const denomX = Math.sqrt(xs.reduce((s, x) => s + Math.pow(x - meanX, 2), 0));
  const denomY = Math.sqrt(ys.reduce((s, y) => s + Math.pow(y - meanY, 2), 0));
  if (denomX === 0 || denomY === 0) return null;
  const cov = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  return cov / (denomX * denomY);
};

// Generate AI summary using Gemini via GoogleGenAI client
const generateAISummary = async (mood, craving, stress, notes) => {
  try {
    const prompt = `The user submitted this mood check-in:
Mood Score: ${mood}/10
Cannabis Craving: ${craving}/10
Stress Level: ${stress}/10
Notes: "${notes || 'No additional notes'}"

Generate:
1. A one-sentence summary of their emotional state.
2. A short suggestion (1 sentence).

Tone: empathetic, calm, not medical, supportive, harm-reduction oriented.

Format your response exactly as:
Emotional State: [your summary]
Suggestion: [your suggestion]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }],
    });

    const text = response.text || '';

    // Parse response
    const emotionalMatch = text.match(/Emotional State:\s*(.+)/i);
    const suggestionMatch = text.match(/Suggestion:\s*(.+)/i);

    return {
      emotionalState: emotionalMatch ? emotionalMatch[1].trim() : "You're navigating your journey with awareness.",
      suggestion: suggestionMatch ? suggestionMatch[1].trim() : 'Take a moment to breathe and reflect on your progress.',
    };
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return {
      emotionalState: "You're taking important steps in your recovery journey.",
      suggestion: 'Keep tracking your progress and be kind to yourself.',
    };
  }
};

// Create a new check-in
const createCheckin = async (req, res) => {
  try {
    const { mood, craving, stress, notes, copingActivities, energy } = req.body;

    // Validation
    if (!mood || !craving || !stress) {
      return res.status(400).json({ success: false, message: "Mood, craving, and stress are required." });
    }

    if (mood < 1 || mood > 10 || craving < 1 || craving > 10 || stress < 1 || stress > 10) {
      return res.status(400).json({ success: false, message: "Values must be between 1 and 10." });
    }

    if (energy && (energy < 1 || energy > 10)) {
      return res.status(400).json({ success: false, message: "Energy must be between 1 and 10." });
    }

    // Check if user already has a check-in today
    const today = getStartOfDay();
    const existingCheckin = await checkinModel.findOne({
      user: req.user.id,
      date: today,
    });

    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: "You've already checked in today. Use update to modify it.",
        checkin: existingCheckin,
      });
    }

    // Generate AI summary
    const summary = await generateAISummary(mood, craving, stress, notes);

    // Create new check-in
    const newCheckin = await checkinModel.create({
      user: req.user.id,
      mood,
      craving,
      stress,
      notes: notes || '',
      date: today,
      summary,
      copingActivities: copingActivities || [],
      energy: energy || 5,
    });

    res.status(201).json({
      success: true,
      message: "Check-in saved successfully.",
      checkin: newCheckin,
    });
  } catch (error) {
    console.error("Error creating check-in:", error);
    res.status(500).json({ success: false, message: "Server error while saving check-in." });
  }
};

// Get all check-ins for the logged-in user
const getAllCheckins = async (req, res) => {
  try {
    const checkins = await checkinModel
      .find({ user: req.user.id })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: checkins.length,
      checkins,
    });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    res.status(500).json({ success: false, message: "Server error while fetching check-ins." });
  }
};

// Get today's check-in (if exists)
const getTodayCheckin = async (req, res) => {
  try {
    const today = getStartOfDay();
    const todayEnd = getEndOfDay();

    const checkin = await checkinModel.findOne({
      user: req.user.id,
      date: { $gte: today, $lte: todayEnd },
    });

    if (!checkin) {
      return res.status(200).json({
        success: true,
        message: "No check-in for today yet.",
        checkin: null,
      });
    }

    res.status(200).json({
      success: true,
      checkin,
    });
  } catch (error) {
    console.error("Error fetching today's check-in:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// Get check-in stats (last 30 days) with advanced metrics
const getCheckinStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 29); // last 30 days including today

    const checkins = await checkinModel
      .find({
        user: userId,
        date: { $gte: fromDate },
      })
      .sort({ date: 1 });

    if (!checkins.length) {
      return res.json({
        success: true,
        stats: {
          from: fromDate,
          to: today,
          dailySeries: [],
          totals: {
            totalDaysWithCheckin: 0,
            goodDays: 0,
            badDays: 0,
            currentStreak: 0,
            bestStreak: 0,
            avgCheckinQualityScore: null,
          },
          patterns: {
            avgMoodOnHighCraving: null,
            avgMoodOnLowCraving: null,
            avgCravingOnHighStress: null,
          },
          advancedMetrics: {
            moodStabilityIndex: null,
            copingEffectiveness: {
              avgMoodWithCoping: null,
              avgMoodWithoutCoping: null,
              difference: null,
            },
          },
        },
      });
    }

    // Map by day
    const dayMap = new Map();
    checkins.forEach((c) => {
      const d = new Date(c.date);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD

      // If multiple in a day, average them
      if (!dayMap.has(key)) {
        dayMap.set(key, {
          sumMood: 0,
          sumCraving: 0,
          sumStress: 0,
          sumEnergy: 0,
          hasCoping: false,
          count: 0,
        });
      }
      const entry = dayMap.get(key);
      entry.sumMood += c.mood;
      entry.sumCraving += c.craving;
      entry.sumStress += c.stress;
      entry.sumEnergy += c.energy || 5; // default to 5 if not set
      if (c.copingActivities && c.copingActivities.length > 0) {
        entry.hasCoping = true;
      }
      entry.count += 1;
    });

    // Build dailySeries over the full 30-day window
    const dailySeries = [];
    const oneDay = 24 * 60 * 60 * 1000;
    for (let t = fromDate.getTime(); t <= today.getTime(); t += oneDay) {
      const d = new Date(t);
      const key = d.toISOString().slice(0, 10);
      const dayEntry = dayMap.get(key);

      if (dayEntry) {
        const avgMood = dayEntry.sumMood / dayEntry.count;
        const avgCraving = dayEntry.sumCraving / dayEntry.count;
        const avgStress = dayEntry.sumStress / dayEntry.count;
        const avgEnergy = dayEntry.sumEnergy / dayEntry.count;

        dailySeries.push({
          date: key,
          mood: Math.round(avgMood * 10) / 10,
          craving: Math.round(avgCraving * 10) / 10,
          stress: Math.round(avgStress * 10) / 10,
          energy: Math.round(avgEnergy * 10) / 10,
          hasCoping: dayEntry.hasCoping,
          hasData: true,
        });
      } else {
        dailySeries.push({
          date: key,
          mood: null,
          craving: null,
          stress: null,
          energy: null,
          hasCoping: false,
          hasData: false,
        });
      }
    }

    const daysWithCheckin = dailySeries.filter((d) => d.hasData);
    const totalDaysWithCheckin = daysWithCheckin.length;

    // Define "good day" heuristic: mood >= 7 AND craving <= 4 AND stress <= 4
    let goodDays = 0;
    let badDays = 0;
    daysWithCheckin.forEach((d) => {
      if (d.mood >= 7 && d.craving <= 4 && d.stress <= 4) goodDays += 1;
      else badDays += 1;
    });

    // Compute streaks based on daysWithCheckin
    const dayTimestamps = daysWithCheckin
      .map((d) => {
        const dt = new Date(d.date);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime();
      })
      .sort((a, b) => a - b);

    let bestStreak = 0;
    let currentStreak = 0;

    if (dayTimestamps.length) {
      let streak = 1;
      const lastIdx = dayTimestamps.length - 1;

      for (let i = 1; i < dayTimestamps.length; i++) {
        if (dayTimestamps[i] - dayTimestamps[i - 1] === oneDay) {
          streak += 1;
        } else {
          bestStreak = Math.max(bestStreak, streak);
          streak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, streak);

      const lastDay = dayTimestamps[lastIdx];
      const todayTs = today.getTime();
      if (lastDay === todayTs || todayTs - lastDay === oneDay) {
        currentStreak = streak;
      } else {
        currentStreak = 0;
      }
    }

    // Pattern metrics
    const highCraving = daysWithCheckin.filter((d) => d.craving >= 7);
    const lowCraving = daysWithCheckin.filter((d) => d.craving <= 4);
    const highStress = daysWithCheckin.filter((d) => d.stress >= 7);

    const avg = (arr, key) =>
      arr.length
        ? Math.round((arr.reduce((sum, d) => sum + (d[key] || 0), 0) / arr.length) * 10) / 10
        : null;

    const patterns = {
      avgMoodOnHighCraving: avg(highCraving, 'mood'),
      avgMoodOnLowCraving: avg(lowCraving, 'mood'),
      avgCravingOnHighStress: avg(highStress, 'craving'),
    };

    // ========== NEW ADVANCED METRICS ==========

    // 1. Check-in Quality Score
    // Formula: (mood + (11 - craving) + (11 - stress) + energy) / 4
    // Inverted craving and stress so higher = better
    const qualityScores = daysWithCheckin.map((d) => {
      const copingScore = 11 - d.craving; // invert craving (1→10, 10→1)
      const energyScore = d.energy || 5;
      return (d.mood + copingScore + energyScore) / 3;
    });

    const avgCheckinQualityScore =
      qualityScores.length
        ? Math.round(
            (qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length) * 10
          ) / 10
        : null;

    // 2. Mood Stability Index (0-100)
    // Lower variance = higher stability
    const moodValues = daysWithCheckin.map((d) => d.mood);
    let moodStabilityIndex = null;

    if (moodValues.length > 1) {
      const meanMood = moodValues.reduce((sum, m) => sum + m, 0) / moodValues.length;
      const variance =
        moodValues.reduce((sum, m) => sum + Math.pow(m - meanMood, 2), 0) /
        moodValues.length;
      const stdDev = Math.sqrt(variance);

      // Normalize: max stdDev for 1-10 scale is ~2.87 (when values are [1,1,1,10,10,10])
      // We'll map stdDev inversely to 0-100 scale
      // stdDev 0 → 100, stdDev 3 → 0
      const maxStdDev = 3;
      const normalizedStability = Math.max(0, 100 - (stdDev / maxStdDev) * 100);
      moodStabilityIndex = Math.round(normalizedStability);
    }

    // 3. Coping Effectiveness
    const daysWithCoping = daysWithCheckin.filter((d) => d.hasCoping);
    const daysWithoutCoping = daysWithCheckin.filter((d) => !d.hasCoping);

    const avgMoodWithCoping = avg(daysWithCoping, 'mood');
    const avgMoodWithoutCoping = avg(daysWithoutCoping, 'mood');

    const copingEffectiveness = {
      avgMoodWithCoping,
      avgMoodWithoutCoping,
      difference:
        avgMoodWithCoping !== null && avgMoodWithoutCoping !== null
          ? Math.round((avgMoodWithCoping - avgMoodWithoutCoping) * 10) / 10
          : null,
    };

    // ========== END ADVANCED METRICS ==========

    return res.json({
      success: true,
      stats: {
        from: fromDate,
        to: today,
        dailySeries,
        totals: {
          totalDaysWithCheckin,
          goodDays,
          badDays,
          currentStreak,
          bestStreak,
          avgCheckinQualityScore,
        },
        patterns,
        advancedMetrics: {
          moodStabilityIndex,
          copingEffectiveness,
        },
      },
    });
  } catch (err) {
    console.error('Error in getCheckinStats:', err);
    return res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
};

// Update an existing check-in
const updateCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const { mood, craving, stress, notes, copingActivities, energy } = req.body;

    const checkin = await checkinModel.findById(id);

    if (!checkin) {
      return res.status(404).json({ success: false, message: "Check-in not found." });
    }

    if (checkin.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this check-in." });
    }

    // Update fields
    if (mood) checkin.mood = mood;
    if (craving) checkin.craving = craving;
    if (stress) checkin.stress = stress;
    if (notes !== undefined) checkin.notes = notes;
    if (copingActivities !== undefined) checkin.copingActivities = copingActivities;
    if (energy) checkin.energy = energy;

    // Regenerate AI summary
    const summary = await generateAISummary(
      checkin.mood,
      checkin.craving,
      checkin.stress,
      checkin.notes
    );
    checkin.summary = summary;

    await checkin.save();

    res.status(200).json({
      success: true,
      message: "Check-in updated successfully.",
      checkin,
    });
  } catch (error) {
    console.error("Error updating check-in:", error);
    res.status(500).json({ success: false, message: "Server error while updating check-in." });
  }
};

/**
 * Core compute insights helper
 * fromDate and toDate are Date objects (inclusive)
 */
const computeInsightsForRange = async (userId, fromDate, toDate) => {
  // Normalize date bounds to start/end of day
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  // Fetch checkins in period
  const checkins = await checkinModel
    .find({
      user: userId,
      date: { $gte: from, $lte: to },
    })
    .sort({ date: 1 })
    .lean();

  const totalCheckins = checkins.length;

  // Build map by day YYYY-MM-DD for daily aggregates
  const dayMap = new Map();
  checkins.forEach((c) => {
    const d = new Date(c.date);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        moods: [],
        cravings: [],
        stresses: [],
        energies: [],
        notes: [],
        date: key,
        rawCheckins: [],
      });
    }
    const ent = dayMap.get(key);
    ent.moods.push(c.mood);
    ent.cravings.push(c.craving);
    ent.stresses.push(c.stress);
    if (c.energy !== undefined && c.energy !== null) ent.energies.push(c.energy);
    if (c.notes) ent.notes.push(c.notes);
    ent.rawCheckins.push(c);
  });

  // Date range sequence
  const dateKeys = buildDateRange(from, new Date(to.getFullYear(), to.getMonth(), to.getDate()));

  // daily trend (average mood per day)
  const moodTrend = dateKeys.map((key) => {
    const ent = dayMap.get(key);
    const avgMood = ent ? Math.round((mean(ent.moods) ?? 0) * 10) / 10 : null;
    return { date: key, mood: avgMood };
  });

  // Averages across the period
  const allMoods = [];
  const allCravings = [];
  const allStresses = [];
  const allEnergies = [];

  checkins.forEach((c) => {
    if (typeof c.mood === "number") allMoods.push(c.mood);
    if (typeof c.craving === "number") allCravings.push(c.craving);
    if (typeof c.stress === "number") allStresses.push(c.stress);
    if (typeof c.energy === "number") allEnergies.push(c.energy);
  });

  const avgMood = allMoods.length ? Math.round(mean(allMoods) * 10) / 10 : null;
  const avgCraving = allCravings.length ? Math.round(mean(allCravings) * 10) / 10 : null;
  const avgStress = allStresses.length ? Math.round(mean(allStresses) * 10) / 10 : null;
  const avgEnergy = allEnergies.length ? Math.round(mean(allEnergies) * 10) / 10 : null;

  // Best/worst day (by average mood)
  const dayAgg = [];
  dayMap.forEach((val, key) => {
    dayAgg.push({
      date: key,
      avgMood: val.moods.length ? mean(val.moods) : null,
      notes: val.notes,
      rawCheckins: val.rawCheckins,
    });
  });

  const bestDay = dayAgg.length ? dayAgg.reduce((a, b) => ( (a.avgMood ?? -Infinity) >= (b.avgMood ?? -Infinity) ? a : b )) : null;
  const worstDay = dayAgg.length ? dayAgg.reduce((a, b) => ( (a.avgMood ?? Infinity) <= (b.avgMood ?? Infinity) ? a : b )) : null;

  // Improvement metric: compare first half vs second half of days that have data
  let improvement = null;
  if (dayAgg.length >= 2) {
    // order dayAgg by date
    dayAgg.sort((x, y) => x.date.localeCompare(y.date));
    const half = Math.ceil(dayAgg.length / 2);
    const firstHalf = dayAgg.slice(0, half).map((d) => d.avgMood).filter((v) => v != null);
    const secondHalf = dayAgg.slice(half).map((d) => d.avgMood).filter((v) => v != null);
    const avgFirst = firstHalf.length ? mean(firstHalf) : null;
    const avgSecond = secondHalf.length ? mean(secondHalf) : null;
    if (avgFirst != null && avgSecond != null) {
      improvement = Math.round((avgSecond - avgFirst) * 10) / 10; // positive => improved mood
    }
  }

  // Pattern correlations (pearson)
  // Use day-level matched arrays: mood vs craving, mood vs stress
  const pairedDays = [];
  dateKeys.forEach((key) => {
    const ent = dayMap.get(key);
    if (ent && ent.moods.length) {
      pairedDays.push({
        mood: mean(ent.moods),
        craving: ent.cravings.length ? mean(ent.cravings) : null,
        stress: ent.stresses.length ? mean(ent.stresses) : null,
      });
    }
  });

  const moodsForCorr = pairedDays.map((d) => d.mood);
  const cravingsForCorr = pairedDays.map((d) => (d.craving == null ? NaN : d.craving)).filter((x) => !Number.isNaN(x));
  const stressesForCorr = pairedDays.map((d) => (d.stress == null ? NaN : d.stress)).filter((x) => !Number.isNaN(x));

  let corrMoodCraving = null;
  let corrMoodStress = null;
  if (pairedDays.length >= 2) {
    // For correlation we need aligned arrays: only include days with both values
    const moodCravingPairs = pairedDays.filter((d) => d.mood != null && d.craving != null).map((d) => [d.mood, d.craving]);
    if (moodCravingPairs.length >= 2) {
      const xs = moodCravingPairs.map((p) => p[0]);
      const ys = moodCravingPairs.map((p) => p[1]);
      corrMoodCraving = Math.round(pearsonCorrelation(xs, ys) * 100) / 100; // rounded
    }
    const moodStressPairs = pairedDays.filter((d) => d.mood != null && d.stress != null).map((d) => [d.mood, d.stress]);
    if (moodStressPairs.length >= 2) {
      const xs = moodStressPairs.map((p) => p[0]);
      const ys = moodStressPairs.map((p) => p[1]);
      corrMoodStress = Math.round(pearsonCorrelation(xs, ys) * 100) / 100;
    }
  }

  // Improvement "percent" relative to first half, if possible
  let improvementPercent = null;
  if (improvement != null && dayAgg.length >= 2) {
    // compute firstHalf avg again (if available)
    const half = Math.ceil(dayAgg.length / 2);
    const firstHalf = dayAgg.slice(0, half).map((d) => d.avgMood).filter((v) => v != null);
    const avgFirst = firstHalf.length ? mean(firstHalf) : null;
    if (avgFirst && avgFirst !== 0) {
      improvementPercent = Math.round((improvement / avgFirst) * 100 * 10) / 10;
    }
  }

  // Compose summary sentence (simple)
  let summaryText = "Not enough data for a detailed summary.";
  if (totalCheckins > 0) {
    const best = bestDay ? `${bestDay.date} (mood ${Math.round(bestDay.avgMood * 10)/10})` : null;
    const worst = worstDay ? `${worstDay.date} (mood ${Math.round(worstDay.avgMood * 10)/10})` : null;
    summaryText = `Over the selected period you recorded ${totalCheckins} check-in(s). Average mood: ${avgMood ?? '-'}, craving: ${avgCraving ?? '-'}, stress: ${avgStress ?? '-'}. Best day: ${best ?? 'N/A'}. Worst day: ${worst ?? 'N/A'}.`;
    if (improvement != null) summaryText += ` Mood change (first→second half): ${improvement > 0 ? '+' : ''}${improvement}.`;
  }

  return {
    period: { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) },
    totalCheckins,
    averages: {
      mood: avgMood,
      craving: avgCraving,
      stress: avgStress,
      energy: avgEnergy,
    },
    moodTrend, // [{date, mood}]
    bestDay: bestDay ? { date: bestDay.date, avgMood: Math.round(bestDay.avgMood * 10) / 10 } : null,
    worstDay: worstDay ? { date: worstDay.date, avgMood: Math.round(worstDay.avgMood * 10) / 10 } : null,
    improvement: improvement != null ? { absolute: improvement, percent: improvementPercent } : null,
    patternCorrelations: {
      moodCraving: corrMoodCraving,
      moodStress: corrMoodStress,
    },
    summaryText,
  };
};

/**
 * Public helpers (Mongoose helpers)
 */
const computeWeeklyInsights = async (userId) => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 6); // last 7 days
  return computeInsightsForRange(userId, from, today);
};

const computeMonthlyInsights = async (userId) => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 29); // last 30 days
  return computeInsightsForRange(userId, from, today);
};

const computeAllTimeInsights = async (userId) => {
  // Find earliest checkin date
  const earliest = await checkinModel.findOne({ user: userId }).sort({ date: 1 }).select('date').lean();
  const from = earliest ? new Date(earliest.date) : new Date();
  if (!earliest) {
    // if no earliest, return empty structure for today only
    from.setHours(0,0,0,0);
  }
  const today = new Date();
  return computeInsightsForRange(userId, from, today);
};

/**
 * Express route handlers
 */
const weeklyInsights = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const insights = await computeWeeklyInsights(userId);
    return res.json({ success: true, insights });
  } catch (err) {
    console.error("Error computing weekly insights:", err);
    return res.status(500).json({ success: false, message: "Failed to compute weekly insights." });
  }
};

const monthlyInsights = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const insights = await computeMonthlyInsights(userId);
    return res.json({ success: true, insights });
  } catch (err) {
    console.error("Error computing monthly insights:", err);
    return res.status(500).json({ success: false, message: "Failed to compute monthly insights." });
  }
};

const allTimeInsights = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const insights = await computeAllTimeInsights(userId);
    return res.json({ success: true, insights });
  } catch (err) {
    console.error("Error computing all-time insights:", err);
    return res.status(500).json({ success: false, message: "Failed to compute all-time insights." });
  }
};

export {
  createCheckin,
  getAllCheckins,
  getTodayCheckin,
  updateCheckin,
  getCheckinStats,
  computeWeeklyInsights,
  computeMonthlyInsights,
  computeAllTimeInsights,
  weeklyInsights,
  monthlyInsights,
  allTimeInsights,
};