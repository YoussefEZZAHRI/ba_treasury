import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Balance from '@/models/Balance';

// GET /api/transactions/sales - Sales (Vente de produit) grouped by zone
export async function GET() {
  try {
    await connectDB();
    const balance = await Balance.getGlobalBalance();

    if (!balance) {
      return NextResponse.json({ success: true, data: { byZone: {}, total: { count: 0, amount: 0 } } });
    }

    const sales = balance.transactions.filter(t => t.category === 'Vente de produit');

    const byZone = {};
    for (const t of sales) {
      const zone = t.zone || 'Autres';
      if (!byZone[zone]) byZone[zone] = { count: 0, amount: 0, transactions: [] };
      byZone[zone].count += 1;
      byZone[zone].amount += t.amount;
      byZone[zone].transactions.push(t);
    }

    const total = {
      count: sales.length,
      amount: sales.reduce((s, t) => s + t.amount, 0),
    };

    return NextResponse.json({ success: true, data: { byZone, total } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
