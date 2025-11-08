import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: false, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
  },
  { minimize: false, timestamps: true }
);

const userModel = mongoose.models.User || mongoose.model('User', userSchema);
export default userModel;
