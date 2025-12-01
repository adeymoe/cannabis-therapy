// backend/models/Session.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user','assistant','system'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionType: { type: String, required: true }, // code from SessionType
  title: { type: String, default: '' },
  systemPrompt: { type: String, default: '' },
  history: { type: [messageSchema], default: [] },
  ended: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export default Session;
