'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Calendar from '@/components/Calendar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, router]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const response = await fetch(`/api/analytics?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      setError('Error fetching analytics data');
    }
    setLoading(false);
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const resetDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const formatCurrency = (value) => `${Number(value).toFixed(2)} DH`;
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

  const tooltipStyle = {
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    color: '#fff',
  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Black Army" width={72} height={72} className="rounded-full border-2 border-red-700" />
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Analytics Dashboard</h1>
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
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm"
            >
              Dashboard
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
          <div className="p-4 bg-red-950 border border-red-800 text-red-400 rounded-xl">{error}</div>
        )}

        {/* Date Range Filter */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-1">Date Range Filter</h2>
          <p className="text-sm text-zinc-500 mb-4">Filter analytics data by date range</p>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-1.5">Start Date</label>
              <Calendar
                value={dateRange.startDate}
                onChange={(v) => handleDateChange('startDate', v)}
                placeholder="Start date"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-1.5">End Date</label>
              <Calendar
                value={dateRange.endDate}
                onChange={(v) => handleDateChange('endDate', v)}
                placeholder="End date"
              />
            </div>
            <Button
              onClick={resetDateRange}
              className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white"
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </div>

        {analyticsData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
                <p className="text-sm text-zinc-500 uppercase tracking-wider">Current Balance</p>
                <p className={`text-2xl font-extrabold mt-2 ${analyticsData.currentBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(analyticsData.currentBalance)}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
                <p className="text-sm text-zinc-500 uppercase tracking-wider">Total Credits</p>
                <p className="text-2xl font-extrabold mt-2 text-green-500">
                  {formatCurrency(analyticsData.summary.totalCredits)}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
                <p className="text-sm text-zinc-500 uppercase tracking-wider">Total Debits</p>
                <p className="text-2xl font-extrabold mt-2 text-red-500">
                  {formatCurrency(analyticsData.summary.totalDebits)}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
                <p className="text-sm text-zinc-500 uppercase tracking-wider">Net Change</p>
                <p className={`text-2xl font-extrabold mt-2 ${analyticsData.summary.netChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(analyticsData.summary.netChange)}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Balance Trend */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-1">Balance Trend</h2>
                <p className="text-sm text-zinc-500 mb-4">Daily balance changes over time</p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis tickFormatter={(v) => `${v} DH`} tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip formatter={(v) => [formatCurrency(v), 'Balance']} labelFormatter={formatDate} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Line type="monotone" dataKey="cumulativeBalance" stroke="#ef4444" strokeWidth={2} name="Balance" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Credits vs Debits */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-1">Daily Credits vs Debits</h2>
                <p className="text-sm text-zinc-500 mb-4">Daily transaction amounts by type</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis tickFormatter={(v) => `${v} DH`} tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip formatter={(v, name) => [formatCurrency(v), name]} labelFormatter={formatDate} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Bar dataKey="credits" fill="#22c55e" name="Credits" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="debits" fill="#ef4444" name="Debits" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Overview */}
            {analyticsData.monthlyData.length > 0 && (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-1">Monthly Overview</h2>
                <p className="text-sm text-zinc-500 mb-4">Monthly transaction summary</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} />
                    <YAxis tickFormatter={(v) => `${v} DH`} tick={{ fontSize: 11, fill: '#71717a' }} />
                    <Tooltip formatter={(v, name) => [formatCurrency(v), name]} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Bar dataKey="credits" fill="#22c55e" name="Credits" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="debits" fill="#ef4444" name="Debits" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Transaction Activity */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-1">Transaction Activity</h2>
              <p className="text-sm text-zinc-500 mb-4">Daily transaction count</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#71717a' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                  <Tooltip formatter={(v) => [v, 'Transactions']} labelFormatter={formatDate} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                  <Line type="monotone" dataKey="transactionCount" stroke="#22c55e" strokeWidth={2} name="Transactions" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {analyticsData && analyticsData.dailyData.length === 0 && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-12 text-center shadow-xl">
            <p className="text-zinc-500 text-lg mb-4">No transaction data found for the selected date range.</p>
            <Button onClick={resetDateRange} className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900" variant="outline">
              View All Data
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
