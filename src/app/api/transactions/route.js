import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Balance from '@/models/Balance';
import User from '@/models/User';

// GET /api/transactions - Get all transactions with user info
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type'); // 'credit' or 'debit'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const balance = await Balance.getGlobalBalance();
    
    if (!balance) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        summary: { currentBalance: 0, totalCredits: 0, totalDebits: 0, transactionCount: 0 }
      });
    }

    let transactions = balance.transactions;

    // Filter by type if provided
    if (type) {
      transactions = balance.getTransactionsByType(type);
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      transactions = balance.getTransactionsByDateRange(start, end);
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
      summary: balance.getBalanceSummary()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Add a new transaction
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { amount, type, reason, userId } = body;

    // Validation
    if (!amount || !type || !reason || !userId) {
      return NextResponse.json(
        { success: false, error: 'Amount, type, reason, and userId are required' },
        { status: 400 }
      );
    }

    if (type !== 'credit' && type !== 'debit') {
      return NextResponse.json(
        { success: false, error: 'Type must be either "credit" or "debit"' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get or create global balance
    const balance = await Balance.getOrCreateGlobalBalance();

    // Add transaction
    await balance.addTransaction(amount, type, reason, userId);

    // Get updated balance with populated user info
    const updatedBalance = await Balance.getGlobalBalance();

    const newTransaction = updatedBalance.transactions[updatedBalance.transactions.length - 1];

    return NextResponse.json({
      success: true,
      data: {
        transaction: newTransaction,
        balance: updatedBalance.currentBalance,
        summary: updatedBalance.getBalanceSummary()
      },
      message: 'Transaction added successfully'
    }, { status: 201 });

  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
