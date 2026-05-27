import { NextResponse } from 'next/server';

export async function GET() {
  const available: string[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    available.push('google');
  }
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    available.push('facebook');
  }
  return NextResponse.json({ providers: available });
}
