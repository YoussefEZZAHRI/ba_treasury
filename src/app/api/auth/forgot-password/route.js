import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendResetEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ success: false, error: 'Email requis' }, { status: 400 });

    await connectDB();
    const user = await User.findByEmail(email);

    // Always return success to avoid user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendResetEmail(email, resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
