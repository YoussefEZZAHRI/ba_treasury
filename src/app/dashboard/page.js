'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'credit',
    reason: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchBalance();
    }
  }, [status, session, router]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/balances');
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.data);
        setTransactions(data.data.transactions || []);
      } else {
        setError('Failed to fetch balance');
      }
    } catch (error) {
      setError('Error fetching balance');
    }
    setLoading(false);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTransaction,
          userId: session.user.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBalance(prev => ({
          ...prev,
          currentBalance: data.data.balance
        }));
        setTransactions(prev => [data.data.transaction, ...prev]);
        setNewTransaction({ amount: '', type: 'credit', reason: '' });
        setShowAddTransaction(false);
      } else {
        setError(data.error || 'Failed to add transaction');
      }
    } catch (error) {
      setError('Error adding transaction');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Welcome, {session?.user?.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Track your balance and transactions
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => router.push('/analytics')}
              variant="outline"
            >
              Analytics
            </Button>
            {session?.user?.role === 'admin' && (
              <Button 
                onClick={() => router.push('/admin')}
                variant="outline"
              >
                Admin Panel
              </Button>
            )}
            <Button 
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>
                Your current account balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${balance?.currentBalance?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Transactions</CardTitle>
              <CardDescription>
                All time transaction count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {balance?.transactions?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Last 7 days transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {balance?.transactions?.filter(t => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(t.createdAt) > weekAgo;
                }).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Transaction Button */}
        <div className="mb-8">
          <Button 
            onClick={() => setShowAddTransaction(!showAddTransaction)}
            className="w-full sm:w-auto"
          >
            {showAddTransaction ? 'Cancel' : 'Add Transaction'}
          </Button>
        </div>

        {/* Add Transaction Form */}
        {showAddTransaction && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="credit">Credit (+)</option>
                      <option value="debit">Debit (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Reason</label>
                    <input
                      type="text"
                      value={newTransaction.reason}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Salary, Groceries"
                      required
                    />
                  </div>
                </div>
                <Button type="submit">Add Transaction</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              {transactions.length} transactions total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No transactions yet. Add your first transaction above!
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.reason}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(transaction.createdAt).toLocaleDateString()} • 
                        by {transaction.userId?.name || 'Unknown User'}
                      </p>
                    </div>
                    <div className={`font-bold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}${transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
