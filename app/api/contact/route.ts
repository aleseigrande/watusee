import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@watusee.fun',
      to: ['brichese@gmail.com', 'main@watusee.fun'],
      replyTo: email,
      subject: `[WatUSee Contact] ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a1a; border-radius: 16px;">
          <h1 style="color: #fff; font-size: 20px; margin-bottom: 16px;">New contact message</h1>
          <table style="color: #a0a0b0; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            <tr><td style="padding-right: 12px; font-weight: 600; color: #fff;">From:</td><td>${name}</td></tr>
            <tr><td style="padding-right: 12px; font-weight: 600; color: #fff;">Email:</td><td>${email}</td></tr>
          </table>
          <div style="background: #1a1a2e; border-radius: 12px; padding: 16px; color: #d0d0e0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Contact] Failed to send email:', err?.message || err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
