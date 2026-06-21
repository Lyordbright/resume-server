import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

export const signup = async (req, res, next) => {
  console.log("Got here!");

  const { password, confirmPassword, email, firstName, lastName } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({
      status: "error",
      message: "Passwords do not match",
    });
  }

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const tokenExpireTime = Date.now() + 30 * 60 * 1000; // 30 mins

    // Create user safely (whitelist fields)
    const user = await userModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      emailVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpires: tokenExpireTime,
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Unable to create user",
      });
    }

    // Verification link sent to user
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    // Send verification email (correct usage)
    await sendEmail(
      email,
      "Verify Your Email - Profile Elevate AI",
      verifyUrl
    );

    return res.status(201).json({
      status: "success",
      message: "User created successfully. Please verify your email!",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};



export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Email or password is incorrect",
      });
    }

    // Prevent login if email is not verified
    if (!user.emailVerified) {
      return res.status(403).json({
        status: "error",
        message: "Please verify your email before logging in.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(404).json({
        status: "error",
        message: "Email or password is incorrect",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      status: "success",
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


export const verifyEmail = async (req, res, next) => {
  const { token } = req.params;

  try {
    // Hash the token from the URL to compare with DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await userModel.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification link.",
      });
    }

    // Mark email as verified and clear token
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });

  } catch (error) {
    console.log(error);
    next(error);
  }
};



export const verifyAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Token received:", token);
  console.log("JWT_SECRET:", process.env.JWT_SECRET);

  if (!token) {
    return res.status(401).json({ status: "error", message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded:", decoded);

    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ status: "error", message: "User not found" });
    }

    return res.status(200).json({ status: "success", user });
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
};



export const updateProfile = async (req, res, next) => {
  const { firstName, lastName } = req.body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return res.status(400).json({
      status: "error",
      message: "First and last name are required",
    });
  }

  try {
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      status: "error",
      message: "Current and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      status: "error",
      message: "New password must be at least 6 characters",
    });
  }

  try {
    const user = await userModel.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        status: "error",
        message: "Email is already verified",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    user.verificationToken = hashedToken;
    user.verificationTokenExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail(user.email, "Verify Your Email - Profile Elevate AI", verifyUrl);

    return res.status(200).json({
      status: "success",
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
};