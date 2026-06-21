import crypto from "crypto";
import userModel from "../models/userModel.js";

// Allowed client redirect origins (whitelist to prevent open redirect)
const ALLOWED_CLIENT_URLS = (process.env.ALLOWED_CLIENT_URLS || "")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

/**
 * Validates that a redirect URL is in the whitelist.
 * @param {string} url
 * @returns {boolean}
 */
const isSafeRedirectUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ALLOWED_CLIENT_URLS.some((allowed) => {
      const allowedParsed = new URL(allowed);
      return parsed.origin === allowedParsed.origin;
    });
  } catch {
    return false;
  }
};

/**
 * GET /api/auth/verify-email/:token
 *
 * Verifies a user's email address using a time-limited, hashed token.
 * - Hashes the incoming raw token with SHA-256 before DB lookup
 * - Clears the token after successful verification to prevent reuse
 * - Optionally redirects to CLIENT_URL if configured and whitelisted
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // 1. Validate token presence and basic format
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Verification token is missing or invalid.",
      });
    }

    // 2. Hash the raw token (tokens are stored hashed in DB)
    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    // 3. Find user with matching token that has not yet expired
    const user = await userModel.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() }, // use Date object for consistency
    });

    // 4. No user found — token is invalid or expired
    if (!user) {
      console.warn(`[verifyEmail] Invalid or expired token attempt.`);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token. Please request a new one.",
      });
    }

    // 5. Already verified — clear any leftover token fields just in case
    if (user.emailVerified) {
      // Clean up stale token data if it somehow still exists
      if (user.verificationToken || user.verificationTokenExpires) {
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
      }

      console.info(`[verifyEmail] Already verified: ${user.email}`);
      return res.status(200).json({
        success: true,
        message: "Your email is already verified. You can log in.",
      });
    }

    // 6. Mark email as verified and clear token fields
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    console.info(`[verifyEmail] Email verified successfully: ${user.email}`);

    // 7. Optional redirect (only if CLIENT_URL is set and whitelisted)
    const clientUrl = process.env.CLIENT_URL;
    const redirectUrl = clientUrl ? `${clientUrl}/email-verified` : null;

    if (redirectUrl && isSafeRedirectUrl(redirectUrl)) {
      return res.redirect(redirectUrl);
    }

    // 8. JSON response fallback
    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("[verifyEmail] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};