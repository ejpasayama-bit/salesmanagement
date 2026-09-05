'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OPTION_LIST = [
  { name: '迷惑メール対策オプション', price: 50000 },
  { name: '採用特化ランディングページ（LP）の制作', price: 150000 },
  { name: '業務効率化アプリ・ツールのフルオーダー開発', price: 300000 },
  { name: 'プロによる出張撮影ディレクション', price: 30000 },
  { name: 'IT出張サポート', price: 15000 },
  { name: 'LINE公式アカウントの構築・連携設定', price: 50000 },
];

export default function PartnerPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 🌟 追加：パートナーの会社名を保持するステート
  const [partnerName, setPartnerName] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(0.3);

  const [formData, setFormData] = useState({ 
    client_company: '', 
    client_contact: '', 
    client_email: '', 
    plan_name: '', 
    initial_fee: 0, 
    monthly_fee: 0,
    selected_options: [] as { name: string, price: number }[],
    remarks: ''
  });
  
  const [hasOptions, setHasOptions] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [dbPlans, setDbPlans] = useState<any[]>([]); 
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        const currentUserId = session.user.id;
        setUserId(currentUserId);
        setIsCheckingAuth(false);
        fetchData(currentUserId);
      }
    };
    checkUser();
  }, [router]);

  const fetchData = async (uid: string) => {
    const res = await fetch(`/api/partner/dashboard?userId=${uid}`);
    const data = await res.json();
    
    if (data.success) {
      setDashboardData(data.data);
      if (data.partnerName) {
        setPartnerName(data.partnerName);
      }
      // 🌟 追加：APIから返ってきた報酬率をセット
      if (data.commissionRate !== undefined) {
        setCommissionRate(data.commissionRate);
      }
    }

    const plansRes = await fetch('/api/plans');
    const plansData = await plansRes.json();
    if (plansData.success) setDbPlans(plansData.plans);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return; 

    setIsLoading(true);
    setMessage('送信中...');

    try {
      const finalData = { 
        ...formData, 
        partner_id: userId,
        selected_options: hasOptions ? formData.selected_options : [] 
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage('✅ 案件の登録が完了しました！');
        setFormData({ 
          client_company: '', 
          client_contact: '', 
          client_email: '', 
          plan_name: '', 
          initial_fee: 0, 
          monthly_fee: 0,
          selected_options: [],
          remarks: ''
        });
        setHasOptions(false); 
        fetchData(userId); 
      } else {
        setMessage('❌ エラー: ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleOptionToggle = (option: { name: string, price: number }) => {
    const currentOptions = formData.selected_options;
    const isSelected = currentOptions.some(opt => opt.name === option.name);

    if (isSelected) {
      setFormData({
        ...formData,
        selected_options: currentOptions.filter(opt => opt.name !== option.name)
      });
    } else {
      setFormData({
        ...formData,
        selected_options: [...currentOptions, option]
      });
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">認証情報を確認中...</div>;
  }

  const totalLeads = dashboardData.length;
  const wonLeads = dashboardData.filter(lead => lead.status === 'WON').length;
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  const thisMonthLeads = dashboardData.filter(lead => {
    const date = new Date(lead.created_at);
    return `${date.getFullYear()}年${date.getMonth() + 1}月` === currentMonthKey;
  }).length;

  return (
    <div className="p-10 max-w-6xl mx-auto font-sans">
      {/* 🌟 追加：パートナーへの挨拶文 */}
      <div className="mb-2 flex items-center gap-3">
        <span className="text-gray-600 font-medium text-sm">
          {partnerName ? `${partnerName} 様、お世話になっております。` : 'お世話になっております。'}
        </span>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
          現在の紹介報酬: {commissionRate * 100}%
        </span>
      </div>
      
      <div className="flex justify-between items-center mb-8 relative">
        <h1 className="text-3xl font-bold text-gray-800">パートナー・ダッシュボード</h1>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition shadow-sm"
          >
            <span className="text-lg">⚙</span> 設定
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <Link href="/partner/profile" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 border-b border-gray-100">アカウント設定</Link>
              <Link href="/partner/payments" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 border-b border-gray-100">支払履歴・明細</Link>
              <Link href="/partner/flyers" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 border-b border-gray-100">配布用チラシ請求</Link>
              <Link href="/partner/resources" className="block px-4 py-3 text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 border-b border-gray-100">資料・ガイドライン</Link>
              <button onClick={handleLogout} className="w-full text-left block px-4 py-3 text-red-600 hover:bg-red-50 font-medium">ログアウト</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white border border-gray-200 p-6 rounded-lg shadow-sm h-fit">
          <h2 className="text-xl font-semibold mb-4">新規案件の登録</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">顧客の会社名</label><input type="text" required className="w-full border border-gray-300 rounded p-2" value={formData.client_company} onChange={(e) => setFormData({...formData, client_company: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">担当者名</label><input type="text" required className="w-full border border-gray-300 rounded p-2" value={formData.client_contact} onChange={(e) => setFormData({...formData, client_contact: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">連絡先メールアドレス</label><input type="email" required className="w-full border border-gray-300 rounded p-2" value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value})} /></div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">希望するプラン（仮決定）</label>
              <select 
                className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                onChange={(e) => {
                  const preset = dbPlans.find(p => p.name === e.target.value);
                  if (preset) {
                    setFormData({ ...formData, plan_name: preset.name, initial_fee: preset.initial_fee, monthly_fee: preset.monthly_fee });
                  } else {
                    setFormData({ ...formData, plan_name: '', initial_fee: 0, monthly_fee: 0 }); 
                  }
                }}
              >
                <option value="">未定（とりあえず紹介のみ）</option>
                {dbPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">※合意済みの場合のみ選択してください。</p>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ご希望のオプション（任意）</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="options_toggle" 
                    checked={!hasOptions} 
                    onChange={() => setHasOptions(false)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">なし</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="options_toggle" 
                    checked={hasOptions} 
                    onChange={() => setHasOptions(true)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-blue-700">あり</span>
                </label>
              </div>

              {hasOptions && (
                <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
                  {OPTION_LIST.map((opt, index) => {
                    const isChecked = formData.selected_options.some(o => o.name === opt.name);
                    return (
                      <label key={index} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-white transition border border-transparent hover:border-gray-200">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={isChecked}
                          onChange={() => handleOptionToggle(opt)}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800 block leading-tight">{opt.name}</span>
                          <span className="text-xs text-gray-500 mt-0.5 block">
                            + ¥{opt.price.toLocaleString()}{opt.price >= 150000 ? '〜' : ''}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">備考・引継ぎ事項（任意）</label>
              <textarea 
                rows={3}
                placeholder="お客様からの要望や、紹介にあたっての補足事項などをご記入ください。"
                className="w-full border border-gray-300 rounded p-2 text-sm" 
                value={formData.remarks} 
                onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
              />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded hover:bg-green-700 transition mt-4 disabled:opacity-50">
              {isLoading ? '登録中...' : '案件を登録する'}
            </button>
          </form>
          {message && <p className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded font-medium text-sm">{message}</p>}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm text-center"><p className="text-sm text-gray-500 font-medium mb-1">累計紹介数</p><p className="text-2xl font-bold text-gray-800">{totalLeads} <span className="text-sm font-normal">件</span></p></div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm text-center"><p className="text-sm text-gray-500 font-medium mb-1">累計成約数</p><p className="text-2xl font-bold text-green-600">{wonLeads} <span className="text-sm font-normal">件</span></p></div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm text-center"><p className="text-sm text-gray-500 font-medium mb-1">今月（{currentMonthKey}）</p><p className="text-2xl font-bold text-blue-600">{thisMonthLeads} <span className="text-sm font-normal">件</span></p></div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200"><h2 className="text-xl font-semibold">ご紹介案件の成果・報酬一覧</h2></div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="p-4 font-semibold text-gray-600">紹介日</th>
                  <th className="p-4 font-semibold text-gray-600">ご紹介先</th>
                  <th className="p-4 font-semibold text-gray-600">状況</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">発生報酬</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.map((lead) => {
                  const contract = lead.contracts && lead.contracts[0];
                  const isWon = lead.status === 'WON';
                  const isLost = lead.status === 'LOST';
                  const isStarted = !!lead.started_at;

                  return (
                    <tr key={lead.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isLost ? 'opacity-50' : ''}`}>
                      <td className="p-4 text-gray-500">{new Date(lead.created_at).toLocaleDateString('ja-JP')}</td>
                      <td className="p-4 font-medium">{lead.client_company}</td>
                      <td className="p-4">
                        {isWon ? <span className="text-green-600 font-bold">成約済（決済完了）</span>
                        : isLost ? <span className="text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded">不成立</span>
                        : isStarted ? <span className="text-blue-600 font-bold">着手済・進行中</span>
                        : <span className="text-yellow-600">商談中・請求待ち</span>}
                      </td>
                      <td className="p-4 text-right font-bold text-lg">
                        {contract ? `¥${contract.reward_amount.toLocaleString()}` : '¥0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {dashboardData.length === 0 && <p className="p-8 text-center text-gray-500">紹介案件はまだありません。</p>}
          </div>
        </div>
      </div>
    </div>
  );
}