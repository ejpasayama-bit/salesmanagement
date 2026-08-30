'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PartnerProfilePage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 🌟 修正：パスワード入力用のステートを追加
  const [formData, setFormData] = useState({
    company_name: '', contact_name: '', phone_number: '', postal_code: '', address: '',
    bank_name: '', branch_name: '', account_type: '普通', account_number: '', account_name: '', email: '', password: ''
  });
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        const currentUserId = session.user.id;
        setUserId(currentUserId);
        setIsCheckingAuth(false);
        fetchProfile(currentUserId);
      }
    };
    checkUser();
  }, [router]);

  const fetchProfile = async (uid: string) => {
    try {
      const res = await fetch(`/api/partner/profile?userId=${uid}`);
      const data = await res.json();
      
      if (data.success && data.profile) {
        const p = data.profile;
        setFormData({
          company_name: p.company_name || '', contact_name: p.contact_name || '', phone_number: p.phone_number || '',
          postal_code: p.postal_code || '', address: p.address || '', bank_name: p.bank_name || '', branch_name: p.branch_name || '',
          account_type: p.account_type || '普通', account_number: p.account_number || '', account_name: p.account_name || '', 
          email: p.email || '', password: '' // パスワードは取得しないので空にしておく
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    setMessage('保存中...');

    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...formData })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage('✅ プロフィールを更新しました！');
        // パスワード入力欄を空に戻す
        setFormData(prev => ({ ...prev, password: '' }));
      } else {
        setMessage('❌ エラー: ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center text-gray-500">認証情報を確認中...</div>;

  return (
    <div className="p-10 max-w-4xl mx-auto font-sans">
      <div className="mb-6">
        <Link href="/partner" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit transition">
          <span>←</span> ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">アカウント設定（プロフィール）</h1>

      {message && (
        <div className={`mb-6 p-4 rounded font-medium ${message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">基本情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-gray-700 mb-1">会社名 / 屋号</label><input type="text" required className="w-full border rounded p-2" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">担当者名</label><input type="text" className="w-full border rounded p-2" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">電話番号</label><input type="text" className="w-full border rounded p-2" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">郵便番号</label><input type="text" className="w-full border rounded p-2" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">住所</label><input type="text" className="w-full border rounded p-2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
          </div>
        </div>

        {/* 🌟 追加：ログイン・セキュリティ情報の編集セクション */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">ログイン・セキュリティ情報</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-blue-700 mb-1">ログイン用メールアドレス</label>
              <input type="email" required className="w-full border rounded p-2 border-blue-300 bg-blue-50 focus:outline-none focus:border-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <p className="text-xs text-gray-500 mt-1">※変更すると次回のログインから新しいアドレスが必要になります。</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-red-600 mb-1">新しいパスワード (変更する場合のみ入力)</label>
              <input type="text" className="w-full border rounded p-2 border-red-200 bg-red-50 focus:outline-none focus:border-red-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="変更しない場合は空欄のまま" />
              <p className="text-xs text-gray-500 mt-1">※セキュリティ上の理由から、現在のパスワードは表示されません。</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">振込先口座情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-gray-700 mb-1">銀行名</label><input type="text" className="w-full border rounded p-2" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">支店名</label><input type="text" className="w-full border rounded p-2" value={formData.branch_name} onChange={e => setFormData({...formData, branch_name: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">口座種別</label><select className="w-full border rounded p-2 bg-white" value={formData.account_type} onChange={e => setFormData({...formData, account_type: e.target.value})}><option value="普通">普通</option><option value="当座">当座</option></select></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">口座番号</label><input type="text" className="w-full border rounded p-2" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">口座名義 (カナ)</label><input type="text" className="w-full border rounded p-2" value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})} /></div>
          </div>
        </div>

        <div className="pt-6 text-right">
          <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow transition disabled:opacity-50">
            {isLoading ? '保存中...' : '設定を保存する'}
          </button>
        </div>
      </form>
    </div>
  );
}