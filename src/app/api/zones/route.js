import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Zone from '@/models/Zone';

const DEFAULT_ZONES = [
  'TMR', 'TMS', 'PRD', 'A.Auda', 'H.R', 'TFZ',
  'Nord', 'TKM', 'C.V', 'CMD', 'EU', 'CA', 'South', 'Gharb', 'Autres'
];

export async function GET() {
  try {
    await connectDB();

    // Auto-seed if empty
    const count = await Zone.countDocuments();
    if (count === 0) {
      await Zone.insertMany(DEFAULT_ZONES.map(name => ({ name })));
    }

    const zones = await Zone.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: zones });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
