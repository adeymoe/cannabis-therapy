import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medications: {
      type: [String],
      required: true,
    },
    result: {
      severity: {
        type: String,
        enum: ["safe", "caution", "danger"],
        required: true,
      },
      summary: { type: String },
      interactions: [
        {
          medication: String,
          effect: String,
          severity: String,
          recommendation: String,
        },
      ],
      disclaimer: { type: String },
    },
  },
  { timestamps: true }
);

const InteractionLog = mongoose.model("InteractionLog", interactionSchema);
export default InteractionLog;