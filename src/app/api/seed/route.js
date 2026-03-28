import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Zone from '@/models/Zone';
import TransactionCategory from '@/models/TransactionCategory';

const ZONES = [
  'TMR', 'TMS', 'PRD', 'A.Auda', 'H.R', 'TFZ',
  'Nord', 'TKM', 'C.V', 'CMD', 'EU', 'CA', 'South', 'Gharb', 'Autres'
];

const CATEGORIES = ['Adhésion', 'Animation', 'Vente de produit', 'Autres'];

// POST /api/seed - Seed zones and categories
export async function POST() {
  try {
    await connectDB();

    for (const name of ZONES) {
      await Zone.findOneAndUpdate({ name }, { name }, { upsert: true });
    }

    for (const name of CATEGORIES) {
      await TransactionCategory.findOneAndUpdate({ name }, { name }, { upsert: true });
    }

    return NextResponse.json({ success: true, message: 'Zones and categories seeded successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
