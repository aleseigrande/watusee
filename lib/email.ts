import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.AUTH_URL || 'https://watusee.fun'}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"WatUSee" <${process.env.SMTP_FROM || 'noreply@watusee.fun'}>`,
      to: email,
      subject: 'Reset your WatUSee password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a1a; border-radius: 16px;">
          <h1 style="color: #fff; font-size: 24px; margin-bottom: 16px;">Reset your password</h1>
          <p style="color: #a0a0b0; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Someone requested a password reset for your WatUSee account. If it was you, click the button below to set a new password. If you didn't request this, ignore this email.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #6B4EFF; color: #fff; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Reset Password
          </a>
          <p style="color: #606070; font-size: 12px; margin-top: 24px;">
            This link expires in 1 hour.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err: any) {
    console.error('[Email] Failed to send password reset:', err?.message || err);
    return false;
  }
}
