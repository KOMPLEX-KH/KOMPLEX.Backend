import { resend } from "@/app/api/komplex/auth/send-otp/post.js";

export enum EmailType {
    ForgetPassword = "forgetPassword",
    Signup = "signup"
}


export async function sendEmail(to: string, subject: string, type: EmailType , otp?: string) {
  try {

    let html = "";
    switch (type) {
      case EmailType.ForgetPassword:
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="font-size: 16px; margin-bottom: 10px;">Your OTP code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0;">
                  ${otp}
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in <strong>5 minutes</strong></p>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
        `;
        break;
      case EmailType.Signup:
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Welcome to KOMPLEX!</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
              <p style="font-size: 16px;">Thank you for signing up with KOMPLEX Educational Platform.</p>
              <p style="color:#666;font-size:14px;">We're excited to have you on board!</p>
            </div>
          </div>
        `;
        break;
        default:
            break;
    }

    const { data, error } = await resend.emails.send({
      from: "no-reply@komplex.app",
      to,
      subject,
      html,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Email send failed:", err);
    throw err;
  }
}
