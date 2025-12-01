import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Get current authenticated user (used by /me endpoint)
const getUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { password, ...safeUser } = user.toObject ? user.toObject() : user;
    res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Error in getUser:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Please provide email and password" });
    }

    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid email or password" });

    const token = createToken(user._id);
    const { password: _, ...safeUser } = user.toObject();

    res.json({ success: true, token, user: safeUser });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.json({ success: false, message: "Please fill all fields" });
    }

    const exists = await userModel.findOne({ email });
    if (exists) return res.json({ success: false, message: "User already exists" });

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({ username, email, password: hashedPassword });
    const user = await newUser.save();
    const token = createToken(user._id);
    const { password: _, ...safeUser } = user.toObject();

    res.json({ success: true, token, user: safeUser });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user profile (used by /profile endpoint for Dashboard)
const getUserProfile = async (req, res) => {
  try {
    // req.user is already attached by authUser middleware
    const user = await userModel.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export {
  loginUser,
  registerUser,
  getUser,
  getUserProfile,
};