import mongoose from 'mongoose';

const doseLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      enum: ['joint', 'vape', 'edible', 'tincture', 'bong', 'dab'],
      required: true,
    },
    thcPotency: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    cbdPotency: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['g', 'mg', 'puffs', 'ml'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
    safetyScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 10,
    },
    aiFeedback: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const DoseLog = mongoose.model('DoseLog', doseLogSchema);
export default DoseLog;