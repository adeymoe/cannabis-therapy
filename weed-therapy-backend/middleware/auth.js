import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const authUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Expecting format: "Bearer <token>"

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: "Token is invalid or expired" });
  }
};

export default authUser;
