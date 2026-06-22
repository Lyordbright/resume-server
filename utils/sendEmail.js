import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, verifyUrl) => {
  try {
    await resend.emails.send({
      from: "ProFile ElevateAI <onboarding@resend.dev>",
      to,
      subject,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 2rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; margin: 0 0 1rem;">ProFile ElevateAI</h2>
          <p style="color: #374151; font-size: 15px;">Thanks for signing up! Click the button below to verify your email address.</p>
          <a href="${verifyUrl}" style="display:inline-block; margin: 1.5rem 0; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 500;">
            Verify Email
          </a>
          <p style="color: #94a3b8; font-size: 13px;">Or copy this link into your browser:</p>
          <p style="color: #2563eb; font-size: 13px; word-break: break-all;">${verifyUrl}</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 2rem;">This link expires in 30 minutes.</p>
        </div>
      `,
    });
    console.log(`[sendEmail] ✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`[sendEmail] ❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};