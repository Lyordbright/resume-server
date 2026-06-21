import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ status: "error", message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ status: "error", message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
};