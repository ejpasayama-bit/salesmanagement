'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FlyerRequestPage() {
  const [selectedOption, setSelectedOption] = useState('100');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const fetchData = async () => {
    const res = await fetch('/api/partner/flyers');
    const data = await res.json();
    if (data.success) {
      setHistory(data.requests);
      setProfile(data.profile);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalAmount = selectedOption === 'other' ? Number(customAmount) : Number(selectedOption);

    // 🌟 修正：10部未満の場合はエラーメッセージを出して処理をストップ
    if (selectedOption === 'other' && (!finalAmount || finalAmount < 10)) {
      setMessage('❌ 申し訳ありませんが、チラシは最低10部からご指定ください');
      return;
    }

    setIsLoading(true);
    setMessage('リクエストを送信中...');

    try {
      const res = await fetch('/api/partner/flyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requested_amount: finalAmount })
      });
      const data = await res.json();

      if (data.success) {
        setMessage('✅ チラシの請求を送信しました！');
        setCustomAmount(''); 
        fetchData(); 
      } else {
        setMessage('❌ エラー: ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto font-sans">
      
      <div className="mb-6">
        <Link 
          href="/partner" 
          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit transition"
        >
          <span>←</span> ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">配布用チラシ請求</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm h-fit space-y-6">
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
            <h3 className="text-sm font-bold text-blue-900 mb-1">現在のチラシ送付先</h3>
            {profile && profile.address ? (
              <div className="text-sm text-blue-800 space-y-1">
                <p>〒{profile.postal_code} {profile.address}</p>
                <p>{profile.company_name} （ご担当: {profile.contact_name}様）</p>
                <p className="text-xs text-blue-600 pt-1">
                  ※宛先を変更したい場合は <Link href="/partner/profile" className="underline font-bold">アカウント設定</Link> から変更してください。
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-600">
                ⚠️ 住所が未登録です。<Link href="/partner/profile" className="underline font-bold">アカウント設定</Link> から住所を登録してください。
              </p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">新規請求</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">希望部数</label>
                <select 
                  value={selectedOption} 
                  onChange={e => setSelectedOption(e.target.value)}
                  className="w-full border border-gray-300 rounded p-3 bg-white mb-2"
                >
                  <option value="50">50部</option>
                  <option value="100">100部</option>
                  <option value="200">200部</option>
                  <option value="500">500部</option>
                  <option value="other">その他（手入力）</option>
                </select>

                {selectedOption === 'other' && (
                  <div className="flex items-center gap-2 mt-2 bg-gray-50 p-3 rounded border border-gray-200">
                    {/* 🌟 修正：HTML側でも min="10" にし、入力のヒントも親切に表示 */}
                    <input 
                      type="number" 
                      min="10"
                      required
                      placeholder="例: 150 (最低10部〜)"
                      value={customAmount}
                      onChange={e => setCustomAmount(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded p-2"
                    />
                    <span className="font-medium text-gray-700 whitespace-nowrap">部</span>
                  </div>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading || !profile?.address}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition mt-4 disabled:opacity-50"
              >
                {isLoading ? '送信中...' : 'チラシを請求する'}
              </button>
            </form>
            {message && <p className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded font-medium text-sm">{message}</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-fit">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold">請求履歴</h2>
          </div>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">請求日</th>
                <th className="p-4 font-semibold text-gray-600">部数</th>
                <th className="p-4 font-semibold text-gray-600">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {history.map((req) => (
                <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">{new Date(req.requested_at).toLocaleDateString('ja-JP')}</td>
                  <td className="p-4 font-medium">{req.requested_amount}部</td>
                  <td className="p-4">
                    {req.status === 'SHIPPED' 
                      ? <span className="text-green-600 font-bold">発送済</span> 
                      : <span className="text-yellow-600 font-bold">未発送（準備中）</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p className="p-8 text-center text-gray-500">これまでの請求履歴はありません。</p>}
        </div>
        
      </div>
    </div>
  );
}