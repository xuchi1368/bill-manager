'use client';

import { useState } from 'react';
export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!phone) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (res.ok) setSent(true);
    else setError(data.error);
    setLoading(false);
  }

  async function verifyCode() {
    if (!code) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
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

        {!sent ? (
          <>
            <label className="text-xs text-[#6b5d52] block mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="输入手机号"
              className="bg-[#f5f2ed] border-0 rounded-[10px] px-3.5 py-2.5 text-sm text-[#3d342b] w-full mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full py-2.5 bg-[#f59e0b] hover:bg-amber-500 text-white font-medium rounded-[10px] text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-[#6b5d52] mb-3 text-center">
              验证码已发送至 {phone}
            </p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="输入6位验证码"
              maxLength={6}
              className="bg-[#f5f2ed] border-0 rounded-[10px] px-3.5 py-2.5 text-sm text-[#3d342b] w-full mb-4 text-center tracking-[4px] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              onClick={verifyCode}
              disabled={loading}
              className="w-full py-2.5 bg-[#f59e0b] hover:bg-amber-500 text-white font-medium rounded-[10px] text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? '验证中...' : '登录'}
            </button>
            <button
              onClick={() => { setSent(false); setError(''); }}
              className="w-full mt-2 py-2 text-xs text-[#6b5d52] hover:text-[#3d342b] cursor-pointer"
            >
              更换手机号
            </button>
          </>
        )}

        {error && (
          <p className="mt-3 text-xs text-[#e25c3b] text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
