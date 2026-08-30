'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    sender_email: '',
    template_plan_decided: '',
    template_plan_undecided: '',
    tax_rate: 10 // 🌟 追加：初期値を10%に設定
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings({
          ...data.settings,
          tax_rate: data.settings.tax_rate ?? 10 // データベースに値がなければ10を使用
        });
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('保存中...');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ 設定を保存しました！');
      } else {
        setMessage('❌ 保存に失敗しました');
      }
    } catch (err) {
      setMessage('❌ 通信エラー');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto font-sans">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit transition">
          <span>←</span> 総合管理ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">システム設定（メール送信設定）</h1>

      {message && (
        <div className={`mb-6 p-4 rounded font-medium ${message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">基本設定</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">送信元メールアドレス（From）</label>
              <input 
                type="email" 
                required
                className="w-full md:w-1/2 border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none"
                value={settings.sender_email}
                onChange={e => setSettings({...settings, sender_email: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-2">※顧客へ自動送信されるご案内や見積もりメールの送信元になります。</p>
            </div>
            
            {/* 🌟 追加：消費税率の設定項目 */}
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">消費税率（%）</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  required
                  min="0"
                  max="100"
                  className="w-24 border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none text-right"
                  value={settings.tax_rate}
                  onChange={e => setSettings({...settings, tax_rate: Number(e.target.value)})}
                />
                <span className="font-bold text-gray-700">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">※見積書や請求書を生成する際の税計算に使用されます。</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">自動送信テンプレート</h2>
          <p className="text-sm text-gray-600 mb-6">
            紹介者が案件を登録した瞬間に、顧客へ自動送信される初回挨拶メールの文面です。<br/>
            文中に <code>{`{company}`}</code>、<code>{`{name}`}</code>、<code>{`{plan}`}</code> と入力すると、顧客の情報に自動で置き換わります。
          </p>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded border border-blue-100">
              <label className="block text-sm font-bold text-blue-900 mb-2">パターンA：プランが「決定済み」で登録された場合</label>
              <textarea 
                rows={6}
                required
                className="w-full border border-gray-300 rounded p-3 text-sm focus:border-blue-500 focus:outline-none"
                value={settings.template_plan_decided}
                onChange={e => setSettings({...settings, template_plan_decided: e.target.value})}
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded border border-yellow-100">
              <label className="block text-sm font-bold text-yellow-900 mb-2">パターンB：プランが「未定（とりあえず紹介）」の場合</label>
              <textarea 
                rows={6}
                required
                className="w-full border border-gray-300 rounded p-3 text-sm focus:border-blue-500 focus:outline-none"
                value={settings.template_plan_undecided}
                onChange={e => setSettings({...settings, template_plan_undecided: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="text-right">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow transition disabled:opacity-50"
          >
            {isLoading ? '保存中...' : '設定を保存する'}
          </button>
        </div>
      </form>
    </div>
  );
}