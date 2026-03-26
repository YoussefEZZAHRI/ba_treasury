'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importing, setImporting] = useState(false);
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

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;
    setImporting(true);
    setError('');
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      for (const row of rows) {
        const type = String(row.Type || '').toLowerCase() === 'credit' ? 'credit' : 'debit';
        const amount = parseFloat(row.Amount);
        const reason = String(row.Reason || '').trim();
        if (!amount || !reason) continue;
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, amount, reason, userId: session.user.id }),
        });
        const result = await res.json();
        if (result.success) {
          setBalance(prev => ({ ...prev, currentBalance: result.data.balance }));
          setTransactions(prev => [result.data.transaction, ...prev]);
        }
      }
    } catch (err) {
      setError('Failed to import transactions from Excel.');
    }
    setImporting(false);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    const rows = transactions.map((t) => ({
      Date: new Date(t.createdAt).toLocaleDateString(),
      Type: t.type === 'credit' ? 'Credit' : 'Debit',
      Amount: t.amount,
      Reason: t.reason,
      User: t.userId?.name || 'Unknown',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'BA_treasury_report.xlsx');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!session?.user?.id) return;
    setShowConfirm(false);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTransaction, userId: session.user.id }),
      });
      const data = await response.json();
      if (data.success) {
        setBalance(prev => ({ ...prev, currentBalance: data.data.balance }));
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const currentBalance = balance?.currentBalance ?? 0;
  const weekAgoCount = balance?.transactions?.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.createdAt) > weekAgo;
  }).length || 0;

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Top Nav */}
      <header className="border-b border-zinc-800 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Black Army" width={72} height={72} className="rounded-full border-2 border-red-700" />
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Black Army Treasury
              </h1>
              <p className="text-sm font-bold tracking-widest uppercase">
                <span className="text-red-500">à la vie </span>
                <span className="text-green-500">à la mort</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-bold bg-gradient-to-r from-red-500 via-white to-green-500 bg-clip-text text-transparent">
              Hi, {session?.user?.name}
            </span>
            <Button
              onClick={() => router.push('/analytics')}
              variant="outline"
              className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm"
            >
              Analytics
            </Button>
            {session?.user?.role === 'admin' && (
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                className="border-green-700 bg-black text-green-500 hover:bg-green-950 text-sm"
              >
                Admin
              </Button>
            )}
            <Button
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="outline"
              className="border-red-800 bg-black text-red-500 hover:bg-red-950 text-sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">

        {error && (
          <div className="p-4 bg-red-950 border border-red-800 text-red-400 rounded-xl">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Balance */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/20 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Current Balance</p>
            <p className={`text-4xl font-extrabold mt-2 ${currentBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {currentBalance.toFixed(2)} <span className="text-2xl">DH</span>
            </p>
            <p className="text-xs text-zinc-600 mt-1">Treasury account</p>
          </div>

          {/* Total Transactions */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/40 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Total Transactions</p>
            <p className="text-4xl font-extrabold mt-2 text-white">
              {balance?.transactions?.length || 0}
            </p>
            <p className="text-xs text-zinc-600 mt-1">All time</p>
          </div>

          {/* Recent Activity */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-900/20 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Recent Activity</p>
            <p className="text-4xl font-extrabold mt-2 text-white">{weekAgoCount}</p>
            <p className="text-xs text-zinc-600 mt-1">Last 7 days</p>
          </div>
        </div>

        {/* Add Transaction */}
        {!showAddTransaction && (
          <div>
            <Button
              onClick={() => setShowAddTransaction(true)}
              className="bg-red-700 text-white hover:bg-red-600 font-semibold px-6 py-2 rounded-xl transition-all"
            >
              + Add Transaction
            </Button>
          </div>
        )}

        {showAddTransaction && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-white">New Transaction</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Amount (DH)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Type</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-700"
                  >
                    <option value="credit" className="bg-black">Credit (+)</option>
                    <option value="debit" className="bg-black">Debit (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Reason</label>
                  <input
                    type="text"
                    value={newTransaction.reason}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-700"
                    placeholder="e.g., Salary, Groceries"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-red-700 text-white hover:bg-red-600 font-semibold px-6 rounded-xl">
                  Add Transaction
                </Button>
                <Button type="button" onClick={() => setShowAddTransaction(false)} className="bg-zinc-800 text-white hover:bg-zinc-700 font-semibold px-6 rounded-xl">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
              <p className="text-sm text-zinc-500">{transactions.length} transactions total</p>
            </div>
            <div className="flex gap-2">
              <label>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
                <Button
                  variant="outline"
                  asChild
                  disabled={importing}
                  className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm cursor-pointer"
                >
                  <span>{importing ? 'Importing...' : '⬆ Import Excel'}</span>
                </Button>
              </label>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={transactions.length === 0}
                className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm"
              >
                ⬇ Export Excel
              </Button>
            </div>
          </div>

          <div className="divide-y divide-zinc-800">
            {transactions.length === 0 ? (
              <p className="text-zinc-600 text-center py-12">No transactions yet. Add your first one!</p>
            ) : (
              transactions.map((transaction, index) => (
                <div key={index} className="flex justify-between items-center px-6 py-4 hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <p className="font-medium text-white">{transaction.reason}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(transaction.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}by {transaction.userId?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className={`text-lg font-bold tabular-nums ${transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'credit' ? '+' : '-'}{transaction.amount} DH
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Confirm Transaction</h2>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Type</span>
                <span className={`font-semibold ${newTransaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                  {newTransaction.type === 'credit' ? 'Credit' : 'Debit'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Amount</span>
                <span className="font-bold text-white">{newTransaction.amount} DH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Reason</span>
                <span className="text-white">{newTransaction.reason}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1 border-zinc-700 bg-black text-white hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-red-700 text-white hover:bg-red-600 font-semibold"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
