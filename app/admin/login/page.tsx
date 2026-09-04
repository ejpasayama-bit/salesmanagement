'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (res.ok) {
      window.location.href = '/admin'; // 成功したらダッシュボードへ
    } else {
      setError('ユーザー名またはパスワードが違います');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">システム管理ログイン</h1>
        {error && <p className="text-red-600 bg-red-50 p-2 rounded mb-4 text-sm font-bold text-center">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ユーザー名</label>
            <input 
              type="text" 
              name="username" // 🌟 パスワードマネージャーに認識させるためname属性を指定
              autoComplete="username"
              required
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full border rounded p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">パスワード</label>
            <input 
              type="password" 
              name="password"
              autoComplete="current-password"
              required
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full border rounded p-2" 
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}