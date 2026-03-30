'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Lien invalide ou manquant.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) setDone(true);
      else setError(data.error || 'Erreur serveur');
    } catch {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
      {done ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-950 border border-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Mot de passe mis à jour</h2>
          <p className="text-zinc-400 text-sm mb-6">Votre mot de passe a été modifié avec succès.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
          >
            Se connecter
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-950 border border-red-800 text-red-400 rounded-xl text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-700"
                placeholder="••••••••"
                required
                minLength={4}
                disabled={!token}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-700"
                placeholder="••••••••"
                required
                minLength={4}
                disabled={!token}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Mise à jour...
                </>
              ) : 'Enregistrer le mot de passe'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/login" className="text-red-500 hover:text-red-400 font-medium">← Retour à la connexion</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.jpg" alt="Black Army" width={88} height={88} className="rounded-full border-2 border-red-700 mb-4" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Black Army Treasury</h1>
          <p className="text-sm text-zinc-500 mt-1">Nouveau mot de passe</p>
        </div>
        <Suspense fallback={<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-zinc-500 text-center">Chargement...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
