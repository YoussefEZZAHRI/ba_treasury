'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function VentesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedZone, setExpandedZone] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status, router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/transactions/sales');
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError('Impossible de charger les ventes');
    } catch {
      setError('Erreur lors du chargement');
    }
    setLoading(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-medium">Chargement des ventes...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const byZone = data?.byZone || {};
  const total = data?.total || { count: 0, amount: 0 };
  const zones = Object.keys(byZone).sort();

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-black sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="Black Army" width={52} height={52} className="rounded-full border-2 border-red-700" />
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white">Ventes de Produits</h1>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm font-bold bg-gradient-to-r from-red-500 via-white to-green-500 bg-clip-text text-transparent">
              Hi, {session?.user?.name}
            </span>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">Dashboard</Button>
            <Button onClick={() => router.push('/zones')} variant="outline" className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">Par Zone</Button>
            <Button onClick={() => router.push('/analytics')} variant="outline" className="border-zinc-700 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white text-sm">Analytics</Button>
            {session?.user?.role === 'admin' && (
              <Button onClick={() => router.push('/admin')} variant="outline" className="border-green-700 bg-black text-green-500 hover:bg-green-950 text-sm">Admin</Button>
            )}
            <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" className="border-red-800 bg-black text-red-500 hover:bg-red-950 text-sm">Sign Out</Button>
          </div>
          <button className="md:hidden p-2 rounded-lg border border-zinc-700 text-zinc-300" onClick={() => setShowMobileMenu(m => !m)}>
            {showMobileMenu
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            }
          </button>
        </div>
        {showMobileMenu && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 flex flex-col gap-2">
            <p className="text-sm font-bold bg-gradient-to-r from-red-500 via-white to-green-500 bg-clip-text text-transparent mb-1">Hi, {session?.user?.name}</p>
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Par Zone', path: '/zones' },
              { label: 'Analytics', path: '/analytics' },
              ...(session?.user?.role === 'admin' ? [{ label: 'Admin', path: '/admin', green: true }] : []),
            ].map(item => (
              <button key={item.path} onClick={() => { router.push(item.path); setShowMobileMenu(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border ${item.green ? 'border-green-800 text-green-400' : 'border-zinc-700 text-zinc-300'} bg-black`}>
                {item.label}
              </button>
            ))}
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium border border-red-900 text-red-400 bg-black mt-1">Sign Out</button>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">

        {error && <div className="p-4 bg-red-950 border border-red-800 text-red-400 rounded-xl">{error}</div>}

        {/* Global Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-900/20 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <p className="text-sm text-zinc-500 uppercase tracking-wider">Total Ventes</p>
            <p className="text-4xl font-extrabold mt-2 text-white">{total.count}</p>
            <p className="text-xs text-zinc-600 mt-1">toutes zones confondues</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-900/20 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <p className="text-sm text-zinc-500 uppercase tracking-wider">Montant Total</p>
            <p className="text-4xl font-extrabold mt-2 text-green-500">{total.amount.toFixed(2)} <span className="text-2xl">DH</span></p>
            <p className="text-xs text-zinc-600 mt-1">toutes zones confondues</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/40 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
            <p className="text-sm text-zinc-500 uppercase tracking-wider">Zones actives</p>
            <p className="text-4xl font-extrabold mt-2 text-white">{zones.length}</p>
            <p className="text-xs text-zinc-600 mt-1">avec au moins 1 vente</p>
          </div>
        </div>

        {/* Zone Summary Table */}
        {zones.length > 0 && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">Résumé par Zone</h2>
              <p className="text-sm text-zinc-500">Nombre de ventes et montant total par zone</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium uppercase tracking-wider">Zone</th>
                    <th className="text-center px-6 py-3 text-zinc-500 font-medium uppercase tracking-wider">Nb Ventes</th>
                    <th className="text-right px-6 py-3 text-zinc-500 font-medium uppercase tracking-wider">Montant</th>
                    <th className="text-right px-6 py-3 text-zinc-500 font-medium uppercase tracking-wider">% du total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {zones.map(zone => (
                    <tr
                      key={zone}
                      className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedZone(expandedZone === zone ? null : zone)}
                    >
                      <td className="px-6 py-4 font-semibold text-white flex items-center gap-2">
                        <svg className={`w-3 h-3 text-zinc-500 transition-transform ${expandedZone === zone ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {zone}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-zinc-800 text-white px-3 py-1 rounded-full font-bold">{byZone[zone].count}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-500">{byZone[zone].amount.toFixed(2)} DH</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600 rounded-full"
                              style={{ width: `${total.amount > 0 ? (byZone[zone].amount / total.amount * 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-zinc-400 text-xs w-10 text-right">
                            {total.amount > 0 ? (byZone[zone].amount / total.amount * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="border-t-2 border-zinc-700 bg-zinc-800/30">
                    <td className="px-6 py-4 font-extrabold text-white">TOTAL</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-red-900/50 text-white px-3 py-1 rounded-full font-bold">{total.count}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-green-400 text-base">{total.amount.toFixed(2)} DH</td>
                    <td className="px-6 py-4 text-right text-zinc-500">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expanded Zone Detail */}
        {expandedZone && byZone[expandedZone] && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Détail — {expandedZone}</h2>
                <p className="text-sm text-zinc-500">{byZone[expandedZone].count} ventes · {byZone[expandedZone].amount.toFixed(2)} DH</p>
              </div>
              <button onClick={() => setExpandedZone(null)} className="text-zinc-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="divide-y divide-zinc-800">
              {byZone[expandedZone].transactions
                .slice()
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((t, i) => (
                  <div key={i} className="flex justify-between items-center px-6 py-3 hover:bg-zinc-800/30 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{t.reason}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}{t.userId?.name || 'Unknown'}
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
                      <span className="font-bold text-green-500 tabular-nums">+{t.amount} DH</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {zones.length === 0 && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-12 text-center">
            <p className="text-zinc-500 text-lg mb-2">Aucune vente enregistrée.</p>
            <p className="text-zinc-600 text-sm">Ajoutez une transaction avec la catégorie « Vente de produit » depuis le dashboard.</p>
          </div>
        )}
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
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
