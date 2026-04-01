import mongoose from "mongoose";

const cudScreeningSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // DSM-5 based answers: each answer is 0 (No) or 1 (Yes)
    answers: {
      usedMoreThanIntended: { type: Number, default: 0 },       // Q1
      triedToCutDown: { type: Number, default: 0 },             // Q2
      spentLotOfTime: { type: Number, default: 0 },             // Q3
      cravings: { type: Number, default: 0 },                   // Q4
      failedObligations: { type: Number, default: 0 },          // Q5
      continuedDespiteSocialProblems: { type: Number, default: 0 }, // Q6
      givenUpActivities: { type: Number, default: 0 },          // Q7
      usedInHazardousSituations: { type: Number, default: 0 },  // Q8
      continuedDespiteHealthProblems: { type: Number, default: 0 }, // Q9
      tolerance: { type: Number, default: 0 },                  // Q10
      withdrawal: { type: Number, default: 0 },                 // Q11
    },

    // Total score = sum of all yes answers (0–11)
    totalScore: {
      type: Number,
      required: true,
    },

    // Severity classification
    severity: {
      type: String,
      enum: ["No CUD", "Mild", "Moderate", "Severe"],
      required: true,
    },

    // AI-generated personalized feedback from Gemini
    aiFeedback: {
      type: String,
      default: "",
    },

    // Optional: user's self-reported context
    userNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const CUDScreening = mongoose.model("CUDScreening", cudScreeningSchema);

export default CUDScreening;