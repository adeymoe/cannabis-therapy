import mongoose from "mongoose";

const checkinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mood: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    craving: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    stress: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    summary: {
      emotionalState: { type: String, default: '' },
      suggestion: { type: String, default: '' },
    },
    // NEW: Coping activities tracking
    copingActivities: {
      type: [String], // e.g., ["breathing", "exercise", "journaling", "meditation"]
      default: [],
    },
    // NEW: Energy level (1-10)
    energy: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

checkinSchema.index({ user: 1, date: -1 });

const checkinModel = mongoose.models.Checkin || mongoose.model('Checkin', checkinSchema);
export default checkinModel;