import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Balance from '@/models/Balance';
import { initializeAdmin } from '@/lib/initAdmin';

// GET /api/analytics - Get analytics data with optional date filtering
export async function GET(request) {
  try {
    await connectDB();
    
    // Initialize admin user on first API call
    await initializeAdmin();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const balance = await Balance.getGlobalBalance();
    
    if (!balance) {
      return NextResponse.json({
        success: true,
        data: {
          dailyData: [],
          summary: {
            totalCredits: 0,
            totalDebits: 0,
            netChange: 0,
            transactionCount: 0
          }
        }
      });
    }

    let filteredTransactions = balance.transactions;

    // Filter by date range if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      
      filteredTransactions = balance.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= start && transactionDate <= end;
      });
    }

    // Group transactions by date
    const dailyData = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt).toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          credits: 0,
          debits: 0,
          netChange: 0,
          transactionCount: 0
        };
      }
      
      if (transaction.type === 'credit') {
        dailyData[date].credits += transaction.amount;
        dailyData[date].netChange += transaction.amount;
      } else {
        dailyData[date].debits += transaction.amount;
        dailyData[date].netChange -= transaction.amount;
      }
      
      dailyData[date].transactionCount += 1;
    });

    // Convert to array and sort by date
    const dailyDataArray = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate cumulative balance
    let cumulativeBalance = 0;
    const dailyDataWithCumulative = dailyDataArray.map(day => {
      cumulativeBalance += day.netChange;
      return {
        ...day,
        cumulativeBalance: cumulativeBalance
      };
    });

    // Calculate summary statistics
    const summary = {
      totalCredits: filteredTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalDebits: filteredTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0),
      netChange: filteredTransactions.reduce((sum, t) => {
        return sum + (t.type === 'credit' ? t.amount : -t.amount);
      }, 0),
      transactionCount: filteredTransactions.length
    };

    // Get monthly data for trend analysis
    const monthlyData = {};
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          credits: 0,
          debits: 0,
          netChange: 0,
          transactionCount: 0
        };
      }
      
      if (transaction.type === 'credit') {
        monthlyData[monthKey].credits += transaction.amount;
        monthlyData[monthKey].netChange += transaction.amount;
      } else {
        monthlyData[monthKey].debits += transaction.amount;
        monthlyData[monthKey].netChange -= transaction.amount;
      }
      
      monthlyData[monthKey].transactionCount += 1;
    });

    const monthlyDataArray = Object.values(monthlyData).sort((a, b) => 
      a.month.localeCompare(b.month)
    );

    return NextResponse.json({
      success: true,
      data: {
        dailyData: dailyDataWithCumulative,
        monthlyData: monthlyDataArray,
        summary,
        currentBalance: balance.currentBalance
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
