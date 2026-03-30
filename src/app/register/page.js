'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const createRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: 'user' }),
      });

      const createData = await createRes.json();
      if (!createData.success) {
        setError(createData.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      try {
        const loginResult = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (loginResult?.error) {
          // Auto sign-in failed (common in PWA standalone mode) — show success and redirect to login
          setSuccess(true);
          setTimeout(() => router.push('/login'), 2000);
        } else {
          router.push('/dashboard');
        }
      } catch {
        // signIn threw — still created the account, redirect to login
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-start justify-center p-4 pt-8 overflow-y-auto">
      <div className="w-full max-w-md pb-8">

        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.jpg"
            alt="Black Army"
            width={88}
            height={88}
            className="rounded-full border-2 border-red-700 mb-4"
          />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Black Army Treasury</h1>
          <p className="text-sm text-zinc-500 mt-1">Créer un compte</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">

          {success && (
            <div className="mb-4 p-3 bg-green-950 border border-green-800 text-green-400 rounded-xl text-sm text-center">
              Compte créé ! Redirection vers la connexion...
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-950 border border-red-800 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Nom</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-700"
                placeholder="Votre nom"
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-700"
                placeholder="email@exemple.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-3 py-2.5 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-700"
                placeholder="••••••••"
                required
                minLength={4}
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
                  Création en cours...
                </>
              ) : 'Créer un compte'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-green-500 hover:text-green-400 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
