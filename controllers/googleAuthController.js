import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

export const googleAuth = async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ status: "error", message: "Google credential is required" });
  }

  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const googleUser = await response.json();

    if (googleUser.error) {
      return res.status(401).json({ status: "error", message: "Invalid Google token" });
    }

    if (googleUser.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ status: "error", message: "Token client mismatch" });
    }

    const { email, given_name, family_name } = googleUser;

    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({
        firstName: given_name || "User",
        lastName: family_name || "",
        email,
        password: `google_${Date.now()}_${Math.random()}`,
        emailVerified: true,
        googleAuth: true,
      });
    } else {
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      status: "success",
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    next(error);
  }
};