'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function ZonesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'credit' | 'debit'
  const [expandedZone, setExpandedZone] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status, router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/transactions/by-zone');
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError('Failed to load zone data');
    } catch {
      setError('Error loading zone data');
    }
    setLoading(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const zones = Object.keys(data);
  const totalCredits = zones.reduce((s, z) => s + (data[z].totalCredits || 0), 0);
  const totalDebits = zones.reduce((s, z) => s + (data[z].totalDebits || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Black Army" width={72} height={72} className="rounded-full border-2 border-red-700" />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Vue par Zone</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-bold bg-gradient-to-r from-red-500 via-white to-green-500 bg-clip-text text-transparent">
              Hi, {session?.user?.name}
            </span>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">
              Dashboard
            </Button>
            <Button onClick={() => router.push('/analytics')} variant="outline" className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">
              Analytics
            </Button>
            {session?.user?.role === 'admin' && (
              <Button onClick={() => router.push('/admin')} variant="outline" className="border-green-700 bg-black text-green-500 hover:bg-green-950 text-sm">
                Admin
              </Button>
            )}
            <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" className="border-red-800 bg-black text-red-500 hover:bg-red-950 text-sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">

        {error && <div className="p-4 bg-red-950 border border-red-800 text-red-400 rounded-xl">{error}</div>}

        {/* Global Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <p className="text-sm text-zinc-500 uppercase tracking-wider">Total Zones</p>
            <p className="text-4xl font-extrabold mt-2 text-white">{zones.length}</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <p className="text-sm text-zinc-500 uppercase tracking-wider">Total Cotisations</p>
            <p className="text-4xl font-extrabold mt-2 text-green-500">{totalCredits.toFixed(2)} DH</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <p className="text-sm text-zinc-500 uppercase tracking-wider">Total Charges</p>
            <p className="text-4xl font-extrabold mt-2 text-red-500">{totalDebits.toFixed(2)} DH</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'credit', 'debit'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                filter === f
                  ? f === 'credit' ? 'bg-green-700 text-white' : f === 'debit' ? 'bg-red-700 text-white' : 'bg-zinc-700 text-white'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              {f === 'all' ? 'Tout' : f === 'credit' ? 'Cotisations' : 'Charges'}
            </button>
          ))}
        </div>

        {/* Zone Cards */}
        {zones.length === 0 ? (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-12 text-center">
            <p className="text-zinc-500">Aucune transaction enregistrée.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {zones.map(zone => {
              const zd = data[zone];
              const transactions = [
                ...(filter !== 'debit' ? zd.credits : []),
                ...(filter !== 'credit' ? zd.debits : []),
              ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

              return (
                <div key={zone} className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                  {/* Zone Header */}
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setExpandedZone(expandedZone === zone ? null : zone)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-extrabold text-white">{zone}</span>
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {(zd.credits?.length || 0) + (zd.debits?.length || 0)} transactions
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      {filter !== 'debit' && (
                        <span className="text-green-500 font-bold text-sm">+{zd.totalCredits?.toFixed(2)} DH</span>
                      )}
                      {filter !== 'credit' && (
                        <span className="text-red-500 font-bold text-sm">-{zd.totalDebits?.toFixed(2)} DH</span>
                      )}
                      <svg
                        className={`w-4 h-4 text-zinc-500 transition-transform ${expandedZone === zone ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Transactions */}
                  {expandedZone === zone && (
                    <div className="border-t border-zinc-800 divide-y divide-zinc-800">
                      {transactions.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-6">Aucune transaction.</p>
                      ) : transactions.map((t, i) => (
                        <div key={i} className="flex justify-between items-center px-6 py-3 hover:bg-zinc-800/30 gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{t.reason}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' · '}{t.userId?.name || 'Unknown'}
                              {t.category && <span className="ml-2 bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{t.category}</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {t.proofImage && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(t.proofImage)}
                                className="rounded-lg border border-zinc-700 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                                aria-label="Voir la preuve"
                              >
                                <Image src={t.proofImage} alt="preuve" width={36} height={36} unoptimized className="h-9 w-9 object-cover" />
                              </button>
                            )}
                            <span className={`font-bold tabular-nums text-sm ${t.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                              {t.type === 'credit' ? '+' : '-'}{t.amount} DH
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <Image
            src={previewImage}
            alt="preuve"
            width={1600}
            height={1200}
            unoptimized
            className="max-h-[85vh] w-auto max-w-full h-auto rounded-2xl border border-zinc-700 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
