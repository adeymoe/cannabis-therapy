import mongoose from 'mongoose';

const weeklyTargetSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  targetPerDay: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  notes: { type: String, default: '' },
}, { _id: false });

const progressLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  actualUsage: { type: Number, required: true },
  mood: { type: String, enum: ['great', 'okay', 'tough', 'craving'], default: 'okay' },
  source: { type: String, enum: ['manual', 'checkin'], default: 'manual' },
  notes: { type: String, default: '' },
}, { _id: true });

const tplanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active',
  },
  goal: {
    currentUsage: { type: Number, required: true },
    targetUsage: { type: Number, required: true, default: 0 },
    unit: { type: String, enum: ['sessions', 'joints', 'mg'], default: 'sessions' },
    durationWeeks: { type: Number, enum: [4, 8, 12], default: 8 },
    reason: { type: String, default: '' },
  },
  aiRefinement: { type: String, default: '' },
  weeklyTargets: [weeklyTargetSchema],
  progressLogs: [progressLogSchema],
}, { timestamps: true });

const TPlan = mongoose.models.TPlan || mongoose.model('TPlan', tplanSchema);
export default TPlan;