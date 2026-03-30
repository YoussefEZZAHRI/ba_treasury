'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

function proofImageExtension(src) {
  const m = typeof src === 'string' && src.match(/^data:image\/(\w+);/);
  if (!m) return 'jpg';
  return m[1] === 'jpeg' ? 'jpg' : m[1];
}

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
  const [zones, setZones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [proofPreview, setProofPreview] = useState(null);
  const [proofSaveHint, setProofSaveHint] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'credit',
    reason: '',
    category: '',
    zone: '',
    proofImage: null,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchBalance();
      fetchZonesAndCategories();
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!proofPreview) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setProofPreview(null);
        setProofSaveHint(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [proofPreview]);

  const fetchZonesAndCategories = async () => {
    const [zRes, cRes] = await Promise.all([
      fetch('/api/zones'),
      fetch('/api/categories'),
    ]);
    const [zData, cData] = await Promise.all([zRes.json(), cRes.json()]);
    if (zData.success) setZones(zData.data);
    if (cData.success) setCategories(cData.data);
  };

  const resizeImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 600;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

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
    const rows = filteredTransactions.map((t) => ({
      Date: new Date(t.createdAt).toLocaleDateString(),
      Type: t.type === 'credit' ? 'Credit' : 'Debit',
      Amount: t.amount,
      Reason: t.reason,
      Category: t.category || 'Autres',
      Zone: t.zone || 'Autres',
      User: t.userId?.name || 'Unknown',
    }));
  rows.push(
    {},
    { Date: 'Totals', Type: 'Transactions Count', Amount: filteredTransactions.length },
    { Date: 'Totals', Type: 'Total Credits', Amount: filteredTotalCredits },
    { Date: 'Totals', Type: 'Total Debits', Amount: filteredTotalDebits },
    { Date: 'Totals', Type: 'Net Total', Amount: filteredNetTotal }
  );
  const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'BA_treasury_report.xlsx');
  };

  const closeProofModal = () => {
    setProofPreview(null);
    setProofSaveHint(false);
  };

  const saveProofImage = () => {
    if (!proofPreview?.src) return;
    const { src, reason } = proofPreview;
    const ext = proofImageExtension(src);
    const safe = String(reason || 'preuve')
      .replace(/[^\w\d\u00C0-\u024f\s-]+/gi, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 48) || 'preuve';
    const filename = `preuve_${safe}_${Date.now()}.${ext}`;
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setProofSaveHint(true);
    window.setTimeout(() => setProofSaveHint(false), 2500);
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
        setNewTransaction({ amount: '', type: 'credit', reason: '', category: '', zone: '', proofImage: null });
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

  const filteredTransactions = transactions
    .filter(t => !filterCategory || t.category === filterCategory)
    .filter(t => !filterZone || t.zone === filterZone)
    .filter(t => !filterType || t.type === filterType)
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'date') { valA = new Date(a.createdAt); valB = new Date(b.createdAt); }
      else if (sortBy === 'amount') { valA = a.amount; valB = b.amount; }
      else if (sortBy === 'category') { valA = a.category || ''; valB = b.category || ''; }
      else if (sortBy === 'zone') { valA = a.zone || ''; valB = b.zone || ''; }
      else { valA = 0; valB = 0; }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const filteredTotalCredits = filteredTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const filteredTotalDebits = filteredTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const filteredNetTotal = filteredTotalCredits - filteredTotalDebits;

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="text-zinc-600 ml-1">↕</span>;
    return <span className="text-red-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const weekAgoCount = transactions.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.createdAt) > weekAgo;
  }).length;

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Top Nav */}
      <header className="border-b border-zinc-800 bg-black sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="Black Army" width={52} height={52} className="rounded-full border-2 border-red-700" />
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
              Black Army<br className="sm:hidden" /><span className="hidden sm:inline"> </span>Treasury
            </h1>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm font-bold bg-gradient-to-r from-red-500 via-white to-green-500 bg-clip-text text-transparent">
              Hi, {session?.user?.name}
            </span>
            <Button onClick={() => router.push('/analytics')} variant="outline" className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">Analytics</Button>
            <Button onClick={() => router.push('/zones')} variant="outline" className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">Par Zone</Button>
            <Button onClick={() => router.push('/ventes')} variant="outline" className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">Ventes</Button>
            {session?.user?.role === 'admin' && (
              <Button onClick={() => router.push('/admin')} variant="outline" className="border-green-700 bg-black text-green-500 hover:bg-green-950 text-sm">Admin</Button>
            )}
            <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" className="border-red-800 bg-black text-red-500 hover:bg-red-950 text-sm">Sign Out</Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg border border-zinc-700 text-zinc-300"
            onClick={() => setShowMobileMenu(m => !m)}
          >
            {showMobileMenu ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 flex flex-col gap-2">
            <p className="text-sm font-bold bg-gradient-to-r from-red-500 via-white to-green-500 bg-clip-text text-transparent mb-1">
              Hi, {session?.user?.name}
            </p>
            {[
              { label: 'Analytics', path: '/analytics' },
              { label: 'Par Zone', path: '/zones' },
              { label: 'Ventes', path: '/ventes' },
              ...(session?.user?.role === 'admin' ? [{ label: 'Admin', path: '/admin', green: true }] : []),
            ].map(item => (
              <button
                key={item.path}
                onClick={() => { router.push(item.path); setShowMobileMenu(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border ${item.green ? 'border-green-800 text-green-400' : 'border-zinc-700 text-zinc-300'} bg-black`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border border-red-900 text-red-400 bg-black mt-1"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">

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
              {transactions.length}
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
                    placeholder="e.g., Cotisation, Tifo..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Catégorie</label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-700"
                    required
                  >
                    <option value="" className="bg-black">-- Sélectionner --</option>
                    {categories.map(c => (
                      <option key={c._id} value={c.name} className="bg-black">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Zone</label>
                  <select
                    value={newTransaction.zone}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, zone: e.target.value }))}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-700"
                    required
                  >
                    <option value="" className="bg-black">-- Sélectionner --</option>
                    {zones.map(z => (
                      <option key={z._id} value={z.name} className="bg-black">{z.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Preuve (image)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const resized = await resizeImage(file);
                      setNewTransaction(prev => ({ ...prev, proofImage: resized }));
                    }}
                    className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-lg text-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-zinc-300 file:text-sm"
                  />
                  {newTransaction.proofImage && (
                    <Image
                      src={newTransaction.proofImage}
                      alt="preview"
                      width={64}
                      height={64}
                      unoptimized
                      className="mt-2 h-16 w-auto max-w-full rounded-lg object-cover border border-zinc-700"
                    />
                  )}
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
              <p className="text-sm text-zinc-500">
                {filteredTransactions.length === transactions.length
                  ? `${transactions.length} transactions`
                  : `${filteredTransactions.length} / ${transactions.length} transactions`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                Count: {filteredTransactions.length}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-green-950 text-green-400">
                Credits: +{filteredTotalCredits.toFixed(2)} DH
              </span>
              <span className="px-2.5 py-1 rounded-full bg-red-950 text-red-400">
                Debits: -{filteredTotalDebits.toFixed(2)} DH
              </span>
              <span className={`px-2.5 py-1 rounded-full ${filteredNetTotal >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                Net: {filteredNetTotal >= 0 ? '+' : ''}{filteredNetTotal.toFixed(2)} DH
              </span>
            </div>
            <div className="flex gap-2">
              <label>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
                <Button variant="outline" asChild disabled={importing} className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm cursor-pointer">
                  <span className="flex items-center gap-2">
                    {importing ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    )}
                    {importing ? 'Importing...' : 'Import Excel'}
                  </span>
                </Button>
              </label>
              <Button variant="outline" onClick={handleExportExcel} disabled={filteredTransactions.length === 0} className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export Excel
                </span>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-950/50">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-black border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-700"
            >
              <option value="">Toutes catégories</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
            <select
              value={filterZone}
              onChange={e => setFilterZone(e.target.value)}
              className="px-3 py-1.5 bg-black border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-700"
            >
              <option value="">Toutes zones</option>
              {zones.map(z => <option key={z._id} value={z.name}>{z.name}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-black border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-700"
            >
              <option value="">Tous types</option>
              <option value="credit">Crédit</option>
              <option value="debit">Débit</option>
            </select>
            {(filterCategory || filterZone || filterType) && (
              <button
                onClick={() => { setFilterCategory(''); setFilterZone(''); setFilterType(''); }}
                className="px-3 py-1.5 text-xs text-red-400 border border-red-900 rounded-lg hover:bg-red-950 transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-zinc-800">
            {transactions.length === 0 ? (
              <p className="text-zinc-600 text-center py-12 px-4">No transactions yet. Add your first one!</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-zinc-600 text-center py-12 px-4">Aucun résultat pour ces filtres.</p>
            ) : filteredTransactions.map((t, i) => (
              <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{t.reason}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {t.userId?.name ? ` · ${t.userId.name}` : ''}
                  </p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {t.category && <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{t.category}</span>}
                    {t.zone && <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{t.zone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.proofImage && (
                    <img src={t.proofImage} alt="preuve" className="h-9 w-9 rounded-lg object-cover border border-zinc-700 cursor-pointer" onClick={() => setProofPreview(t.proofImage)} />
                  )}
                  <span className={`font-bold text-sm tabular-nums ${t.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'credit' ? '+' : '-'}{t.amount} DH
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="text-zinc-600 text-center py-12">No transactions yet. Add your first one!</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-zinc-600 text-center py-12">Aucun résultat pour ces filtres.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-xs">
                    <th className="text-left px-6 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('date')}>
                      Date <SortIcon col="date" />
                    </th>
                    <th className="text-left px-6 py-3">Raison</th>
                    <th className="text-left px-6 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('category')}>
                      Catégorie <SortIcon col="category" />
                    </th>
                    <th className="text-left px-6 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('zone')}>
                      Zone <SortIcon col="zone" />
                    </th>
                    <th className="text-left px-6 py-3">Par</th>
                    <th className="text-center px-4 py-3">Preuve</th>
                    <th className="text-right px-6 py-3 cursor-pointer hover:text-white" onClick={() => toggleSort('amount')}>
                      Montant <SortIcon col="amount" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredTransactions.map((t, i) => (
                    <tr key={i} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-3 text-zinc-400 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 text-white font-medium max-w-[180px] truncate">{t.reason}</td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full whitespace-nowrap">{t.category || '—'}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full whitespace-nowrap">{t.zone || '—'}</span>
                      </td>
                      <td className="px-6 py-3 text-zinc-500 text-xs whitespace-nowrap">{t.userId?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-center">
                        {t.proofImage ? (
                          <button
                            type="button"
                            onClick={() => setProofPreview({ src: t.proofImage, reason: t.reason })}
                            className="mx-auto block rounded-lg border border-zinc-700 overflow-hidden ring-offset-2 ring-offset-black focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 hover:border-red-700/60 transition-colors"
                            aria-label="Voir la preuve"
                          >
                            <Image src={t.proofImage} alt="preuve" width={36} height={36} unoptimized className="h-9 w-9 object-cover" />
                          </button>
                        ) : (
                          <span className="text-zinc-700">—</span>
                        )}
                      </td>
                      <td className={`px-6 py-3 text-right font-bold tabular-nums whitespace-nowrap ${t.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'credit' ? '+' : '-'}{t.amount} DH
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-600 bg-zinc-800/50">
                    <td colSpan={6} className="px-6 py-3 text-left text-zinc-200 font-bold uppercase tracking-wider text-xs">
                      Total
                      <span className="ml-2 font-normal normal-case text-zinc-500">
                        ({filteredTransactions.length} {filteredTransactions.length === 1 ? 'ligne' : 'lignes'})
                      </span>
                      <span className="ml-4 font-semibold text-green-500">+{filteredTotalCredits.toFixed(2)} DH</span>
                      <span className="mx-2 text-zinc-600">·</span>
                      <span className="font-semibold text-red-400">-{filteredTotalDebits.toFixed(2)} DH</span>
                    </td>
                    <td className={`px-6 py-3 text-right font-extrabold tabular-nums whitespace-nowrap ${filteredNetTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      Net {filteredNetTotal >= 0 ? '+' : ''}{filteredNetTotal.toFixed(2)} DH
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Preuve — lightbox */}
      {proofPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/88 backdrop-blur-md"
          onClick={closeProofModal}
          role="presentation"
        >
          <div
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black shadow-[0_0_0_1px_rgba(220,38,38,0.15),0_25px_80px_-12px_rgba(0,0,0,0.85)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="proof-modal-title"
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-zinc-800/90 bg-zinc-900/60">
              <div className="min-w-0 flex-1">
                <h3 id="proof-modal-title" className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-500">
                  Preuve
                </h3>
                {proofPreview.reason ? (
                  <p className="mt-1 text-sm text-zinc-300 font-medium truncate" title={proofPreview.reason}>
                    {proofPreview.reason}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-zinc-500">Pièce jointe à la transaction</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeProofModal}
                className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition-all hover:border-red-800 hover:bg-red-950/40 hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-black/50 min-h-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofPreview.src}
                alt="Preuve en grand"
                className="max-h-[min(70vh,720px)] w-auto max-w-full h-auto rounded-xl border border-zinc-800 object-contain shadow-2xl"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-zinc-800/90 bg-zinc-900/70">
              {proofSaveHint ? (
                <p className="text-sm text-green-400 font-medium order-2 sm:order-1">Téléchargement lancé</p>
              ) : (
                <p className="text-xs text-zinc-500 order-2 sm:order-1">Enregistrer télécharge l’image sur votre appareil.</p>
              )}
              <div className="flex flex-wrap gap-3 justify-end order-1 sm:order-2">
                <button
                  type="button"
                  onClick={closeProofModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={saveProofImage}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-900/60 bg-gradient-to-r from-red-900/90 to-red-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-950/40 transition-all hover:from-red-800 hover:to-red-700 hover:border-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Download className="h-4 w-4" strokeWidth={2.5} />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Catégorie</span>
                <span className="text-white">{newTransaction.category || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Zone</span>
                <span className="text-white">{newTransaction.zone || '—'}</span>
              </div>
              {newTransaction.proofImage && (
                <div className="pt-1">
                  <span className="text-zinc-500 text-sm block mb-1">Preuve</span>
                  <Image
                    src={newTransaction.proofImage}
                    alt="preuve"
                    width={320}
                    height={80}
                    unoptimized
                    className="h-20 w-auto max-w-full rounded-lg object-cover border border-zinc-700"
                  />
                </div>
              )}
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
