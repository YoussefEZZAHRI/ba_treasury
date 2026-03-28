import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Balance from '@/models/Balance';
import { initializeAdmin } from '@/lib/initAdmin';

// GET /api/balances - Get the global balance
export async function GET() {
  try {
    await connectDB();
    
    // Initialize admin user on first API call
    await initializeAdmin();
    
    await Balance.getOrCreateGlobalBalance();
    const balance = await Balance.getGlobalBalance();
    
    return NextResponse.json({
      success: true,
      data: balance
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
