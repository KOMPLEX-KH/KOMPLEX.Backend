import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
    }
});


// send otp to user email
export const sendOtpEmail = async(email: string , otp: string): Promise<void> =>{
    const mailOptions = {
        from: {
            name: 'KOMPLEX Educational Platform',
            address: process.env.GMAIL_EMAIL as string,
        },
        to: email,
        subject: 'Password Reset OTP - KOMPLEX',
        html: `
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
         `,      
    };

    try{
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent successfully to ${email}`);
    }catch(err){
        console.error('Failed to send OTP email:', err);
        throw new Error('Failed to send OTP email');
    }
}