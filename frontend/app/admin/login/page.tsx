'use client';
import { useState } from 'react';
import { ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // HARDCODE URL API UNTUK MEMASTIKAN TIDAK SALAH ENV
    const API_ENDPOINT = '/api/proxy/admin/login';

    console.log("🚀 Login Attempt to:", API_ENDPOINT);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: creds.username, password: creds.password }),
        
        // --- INI YANG PALING PENTING! ---
        credentials: 'include', 
        // --------------------------------
      });

      console.log("📡 Response Status:", res.status);

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        console.log("✅ Login Success! Redirecting...");
        // Paksa reload halaman agar middleware membaca cookie baru
        window.location.href = '/admin-dashboard';
      } else {
        console.error("❌ Login Failed:", data);
        setError(data.error || `Gagal login (${res.status})`);
        setLoading(false);
      }
    } catch (err) {
      console.error("💥 Network Error:", err);
      setError('Gagal terhubung ke server backend.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-sm">
        <div className="flex justify-center mb-6 text-red-500">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Restricted Area</h1>
        <p className="text-gray-400 text-xs text-center mb-6">Mandes Admin Dashboard</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Admin Username"
            autoComplete="username"
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-red-500 outline-none border border-transparent focus:border-red-500 transition"
            value={creds.username}
            onChange={e => setCreds({ ...creds, username: e.target.value })}
          />

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Secret Password"
              autoComplete="current-password"
              className="w-full bg-gray-700 text-white px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-red-500 outline-none border border-transparent focus:border-red-500 transition"
              value={creds.password}
              onChange={e => setCreds({ ...creds, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !creds.username || !creds.password}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition flex justify-center items-center shadow-lg shadow-red-900/50"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'ACCESS DASHBOARD'}
          </button>
        </form>
      </div>
    </div>
  );
}