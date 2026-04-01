import { GoogleGenAI } from "@google/genai";
import InteractionLog from "../models/interactionModel.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const checkInteraction = async (req, res) => {
  try {
    const { medications } = req.body;
    const userId = req.user._id;

    if (!medications || medications.length === 0) {
      return res.status(400).json({ message: "Please provide at least one medication." });
    }

    const medList = medications.join(", ");

    const prompt = `
You are a clinical pharmacist AI assistant. A cannabis user wants to know if their medications interact with cannabis (THC/CBD).

Medications: ${medList}

For each medication, check for known cannabis drug interactions. Return a JSON object with this exact structure:
{
  "severity": "safe" | "caution" | "danger",
  "summary": "A 1-2 sentence plain English summary of the overall risk",
  "interactions": [
    {
      "medication": "medication name",
      "effect": "what the interaction does",
      "severity": "safe" | "caution" | "danger",
      "recommendation": "what the user should do"
    }
  ],
  "disclaimer": "Always consult your doctor or pharmacist before combining cannabis with any medication."
}

Rules:
- "danger" if any medication is a blood thinner (warfarin), antidepressant (SSRIs, MAOIs), antiepileptic, heart medication, or immunosuppressant
- "caution" if mild sedation, metabolism changes (CYP450), or blood pressure effects are possible
- "safe" only if no known interactions exist
- Be concise, factual, and non-judgmental
- Return ONLY valid JSON, no markdown, no extra text
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const raw = response.text.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Save to DB
    const log = await InteractionLog.create({
      userId,
      medications,
      result: parsed,
    });

    res.status(200).json({ success: true, data: parsed, logId: log._id });
  } catch (error) {
    console.error("Interaction check error:", error.message);
    res.status(500).json({ message: "Failed to check drug interactions." });
  }
};

export const getInteractionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const logs = await InteractionLog.find({ userId }).sort({ createdAt: -1 }).limit(10);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history." });
  }
};