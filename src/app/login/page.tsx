'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!phone) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (res.ok) window.location.href = '/';
    else setError(data.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] p-4">
      <div className="card p-6 w-full max-w-sm">
        <h1 className="text-lg font-bold text-[#3d342b] text-center mb-6">账单管理</h1>
        <label className="text-xs text-[#6b5d52] block mb-1">手机号</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="输入手机号即可登录"
          className="bg-[#f5f2ed] border-0 rounded-[10px] px-3.5 py-2.5 text-sm text-[#3d342b] w-full mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
        <button
          onClick={login}
          disabled={loading}
          className="w-full py-2.5 bg-[#f59e0b] hover:bg-amber-500 text-white font-medium rounded-[10px] text-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? '登录中...' : '登录'}
        </button>
        {error && (
          <p className="mt-3 text-xs text-[#e25c3b] text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
