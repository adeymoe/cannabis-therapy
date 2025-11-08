import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'bot'],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const chatModel = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export default chatModel;
