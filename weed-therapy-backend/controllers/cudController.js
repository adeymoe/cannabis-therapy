import { GoogleGenAI } from "@google/genai";
import CUDScreening from "../models/cudScreeningModel.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Helpers ────────────────────────────────────────────────────────────────

const classifySeverity = (score) => {
  if (score === 0) return "No CUD";
  if (score <= 2) return "Mild";
  if (score <= 5) return "Moderate";
  return "Severe";
};

const DSM5_QUESTIONS = [
  { key: "usedMoreThanIntended",          text: "Used cannabis in larger amounts or for longer than intended" },
  { key: "triedToCutDown",                text: "Tried to cut down or stop but couldn't" },
  { key: "spentLotOfTime",                text: "Spent a lot of time obtaining, using, or recovering from cannabis" },
  { key: "cravings",                      text: "Experienced strong cravings or urges to use cannabis" },
  { key: "failedObligations",             text: "Failed to fulfil major obligations at work, school, or home" },
  { key: "continuedDespiteSocialProblems",text: "Continued using despite social or relationship problems caused by it" },
  { key: "givenUpActivities",             text: "Gave up or reduced important activities because of cannabis use" },
  { key: "usedInHazardousSituations",     text: "Used cannabis in physically hazardous situations" },
  { key: "continuedDespiteHealthProblems",text: "Continued using despite knowing it was causing physical or mental health problems" },
  { key: "tolerance",                     text: "Needed more cannabis to get the same effect (tolerance)" },
  { key: "withdrawal",                    text: "Experienced withdrawal symptoms when stopping or reducing use" },
];

// ─── Generate AI Feedback ────────────────────────────────────────────────────

const generateAIFeedback = async (severity, score, answers) => {
  try {
    const yesQuestions = DSM5_QUESTIONS
      .filter((q) => answers[q.key] === 1)
      .map((q) => `- ${q.text}`)
      .join("\n");

    const prompt = `
You are a compassionate, non-judgmental cannabis use disorder (CUD) counsellor.

A user has just completed a DSM-5 based CUD self-screening.

Results:
- Total score: ${score} out of 11
- Severity classification: ${severity}
- Criteria they endorsed (answered Yes):
${yesQuestions || "None"}

Write a warm, empathetic, and clinically informed response (3–4 short paragraphs) that:
1. Acknowledges their honesty and courage in completing the screening
2. Explains what their severity level means in plain, non-scary language
3. Offers 2–3 practical, evidence-based next steps tailored to their severity
4. Ends with an encouraging, hopeful message

Important rules:
- Never be preachy or judgmental
- Use "you" language, not "the user"
- Keep it under 250 words
- Do NOT repeat the score or list the questions back
- If severity is "No CUD", still validate their proactive check-in
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text?.trim() || "We appreciate you completing this screening. Please speak with a healthcare professional for personalised guidance.";
  } catch (err) {
    console.error("Gemini feedback error:", err.message);
    return "Thank you for completing this screening. Consider speaking with a healthcare professional for personalised support.";
  }
};

// ─── Controllers ────────────────────────────────────────────────────────────

// POST /api/cud/submit
const submitScreening = async (req, res) => {
  try {
    const { answers, userNote } = req.body;
    const userId = req.user._id;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Answers are required." });
    }

    // Validate and sanitise answers
    const sanitisedAnswers = {};
    let totalScore = 0;

    for (const q of DSM5_QUESTIONS) {
      const val = answers[q.key] === 1 || answers[q.key] === true ? 1 : 0;
      sanitisedAnswers[q.key] = val;
      totalScore += val;
    }

    const severity = classifySeverity(totalScore);

    // Generate AI feedback
    const aiFeedback = await generateAIFeedback(severity, totalScore, sanitisedAnswers);

    // Save to DB
    const screening = await CUDScreening.create({
      userId,
      answers: sanitisedAnswers,
      totalScore,
      severity,
      aiFeedback,
      userNote: userNote || "",
    });

    res.status(201).json({
      message: "Screening submitted successfully.",
      screening: {
        _id: screening._id,
        totalScore,
        severity,
        aiFeedback,
        createdAt: screening.createdAt,
      },
    });
  } catch (err) {
    console.error("submitScreening error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// GET /api/cud/history
const getScreeningHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await CUDScreening.find({ userId })
      .sort({ createdAt: -1 })
      .select("totalScore severity aiFeedback userNote createdAt")
      .limit(10);

    res.status(200).json({ history });
  } catch (err) {
    console.error("getScreeningHistory error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/cud/latest
const getLatestScreening = async (req, res) => {
  try {
    const userId = req.user._id;

    const latest = await CUDScreening.findOne({ userId })
      .sort({ createdAt: -1 });

    if (!latest) {
      return res.status(404).json({ message: "No screening found." });
    }

    res.status(200).json({ screening: latest });
  } catch (err) {
    console.error("getLatestScreening error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/cud/questions
const getQuestions = async (req, res) => {
  try {
    res.status(200).json({ questions: DSM5_QUESTIONS });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export {
  submitScreening,
  getScreeningHistory,
  getLatestScreening,
  getQuestions,
};