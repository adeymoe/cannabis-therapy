// backend/models/SessionType.js
import mongoose from 'mongoose';

const sessionTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  systemPrompt: { type: String, default: '' },
  color: { type: String, default: '#6cb28e' },
  icon: { type: String, default: '' },
}, { timestamps: true });

const SessionType = mongoose.models.SessionType || mongoose.model('SessionType', sessionTypeSchema);
export default SessionType;
