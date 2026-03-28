import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Balance from '@/models/Balance';

// GET /api/transactions/by-zone - Get transactions grouped by zone
export async function GET() {
  try {
    await connectDB();
    const balance = await Balance.getGlobalBalance();

    if (!balance) {
      return NextResponse.json({ success: true, data: {} });
    }

    const grouped = {};
    for (const t of balance.transactions) {
      const zone = t.zone || 'Autres';
      if (!grouped[zone]) grouped[zone] = { credits: [], debits: [], totalCredits: 0, totalDebits: 0 };
      if (t.type === 'credit') {
        grouped[zone].credits.push(t);
        grouped[zone].totalCredits += t.amount;
      } else {
        grouped[zone].debits.push(t);
        grouped[zone].totalDebits += t.amount;
      }
    }

    return NextResponse.json({ success: true, data: grouped });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
