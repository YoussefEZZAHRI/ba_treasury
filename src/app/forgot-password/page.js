'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError(data.error || 'Erreur serveur');
    } catch {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.jpg" alt="Black Army" width={88} height={88} className="rounded-full border-2 border-red-700 mb-4" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Black Army Treasury</h1>
          <p className="text-sm text-zinc-500 mt-1">Réinitialisation du mot de passe</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-950 border border-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Email envoyé</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Si un compte existe avec cet email, vous recevrez un lien de réinitialisation valide 1 heure.
              </p>
              <Link href="/login" className="text-red-500 hover:text-red-400 text-sm font-medium">
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-950 border border-red-800 text-red-400 rounded-xl text-sm">{error}</div>
              )}
              <p className="text-zinc-400 text-sm mb-5">
                Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-700"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : 'Envoyer le lien'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-zinc-500">
                <Link href="/login" className="text-red-500 hover:text-red-400 font-medium">
                  ← Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
