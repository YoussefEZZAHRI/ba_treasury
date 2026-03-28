import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TransactionCategory from '@/models/TransactionCategory';

const DEFAULT_CATEGORIES = ['Adhésion', 'Animation', 'Vente de produit', 'Autres'];

export async function GET() {
  try {
    await connectDB();

    // Upsert all default categories (adds missing ones without removing existing)
    for (const name of DEFAULT_CATEGORIES) {
      await TransactionCategory.findOneAndUpdate({ name }, { name }, { upsert: true });
    }

    const categories = await TransactionCategory.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
