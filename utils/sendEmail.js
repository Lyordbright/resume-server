import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendEmail = async (to, subject, verifyUrl) => {
  try {
    await transporter.sendMail({
      from: `"Profile Elevate AI" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Thanks for signing up! Click the button below to verify your email address.</p>
          <a href="${verifyUrl}" 
             style="display:inline-block; padding:12px 24px; background:#4F46E5; 
                    color:white; text-decoration:none; border-radius:6px; margin:16px 0;">
            Verify Email
          </a>
          <p>Or copy this link into your browser:</p>
          <p>${verifyUrl}</p>
          <p>This link expires in 30 minutes.</p>
        </div>
      `,
    });
    console.log(`[sendEmail] ✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`[sendEmail] ❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};