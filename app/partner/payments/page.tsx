'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PartnerPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    const checkUserAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      // 自身の名前を取得
      const { data: partnerData } = await supabase
        .from('partners')
        .select('company_name')
        .eq('id', session.user.id)
        .single();
      if (partnerData) setPartnerName(partnerData.company_name);

      // 支払履歴を取得
      const res = await fetch(`/api/partner/payments?userId=${session.user.id}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      }
      setIsLoading(false);
    };
    checkUserAndFetch();
  }, [router]);

  // ブラウザの印刷機能を呼び出してPDF保存させる
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto font-sans">
      <div className="mb-6 hide-on-print">
        <Link href="/partner" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit transition">
          <span>←</span> ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800 hide-on-print">支払履歴・明細</h1>

      {payments.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500 hide-on-print">
          現在、お支払い済みの報酬履歴はありません。
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hide-on-print">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50 text-gray-600">
                <th className="p-4 font-bold">お支払日 (確定日)</th>
                <th className="p-4 font-bold">ご紹介案件</th>
                <th className="p-4 font-bold text-right">お支払金額 (税込)</th>
                <th className="p-4 font-bold text-center">明細書</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(payment => (
                <tr key={payment.id} className="hover:bg-blue-50 transition">
                  <td className="p-4 text-gray-700">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('ja-JP') : '-'}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{payment.client_company}</div>
                    <div className="text-xs text-gray-500">紹介日: {new Date(payment.introduced_at).toLocaleDateString('ja-JP')}</div>
                  </td>
                  <td className="p-4 text-right font-bold text-lg text-gray-800">
                    ¥{payment.reward_amount.toLocaleString()}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedPayment(payment)}
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded text-xs font-bold transition"
                    >
                      明細を表示
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🌟 明細書モーダル (印刷用エリア) */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 hide-on-print">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            
            {/* モーダルヘッダー (印刷時は非表示) */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 hide-on-print">
              <h2 className="font-bold text-gray-800 text-lg">支払明細書</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-sm transition">
                  PDFで保存 (印刷)
                </button>
                <button onClick={() => setSelectedPayment(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-bold text-sm transition">
                  閉じる
                </button>
              </div>
            </div>

            {/* 印刷対象エリア */}
            <div className="p-10 overflow-y-auto print-area bg-white">
              <div className="text-center mb-10">
                <h1 className="text-2xl font-bold tracking-widest text-gray-800 border-b-2 border-gray-800 pb-2 inline-block">支払明細書</h1>
              </div>

              <div className="flex justify-between mb-12">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 border-b border-gray-400 pb-1 pr-10 mb-2">
                    {partnerName} 様
                  </h2>
                  <p className="text-sm text-gray-600">下記内容にて、紹介報酬のお支払いが完了いたしました。</p>
                </div>
                <div className="text-right text-sm text-gray-700">
                  <p className="mb-1">発行日: {new Date().toLocaleDateString('ja-JP')}</p>
                  <div className="mt-4">
                    <p className="font-bold text-base">EasyJ Studio</p>
                    <p>〒XXX-XXXX 愛知県刈谷市XXXX</p>
                    <p>適格請求書発行事業者登録番号: TXXXXXXXXXXXXX</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex items-end gap-4 border-b-2 border-blue-800 pb-2">
                <span className="text-gray-600 font-bold">お支払合計金額 (税込)</span>
                <span className="text-3xl font-bold text-gray-900">¥{selectedPayment.reward_amount.toLocaleString()} -</span>
              </div>

              <table className="w-full text-left text-sm border-collapse mb-10">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-400">
                    <th className="p-3 font-bold text-gray-700">内容</th>
                    <th className="p-3 font-bold text-gray-700 text-right">金額</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 text-gray-800">
                      <div>紹介報酬: {selectedPayment.client_company} 様</div>
                      <div className="text-xs text-gray-500">ご契約プラン: {selectedPayment.plan_name || '未定'}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-800">
                      ¥{selectedPayment.reward_amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div className="text-xs text-gray-500 text-center mt-10 pt-4 border-t border-gray-200">
                本明細書はシステムにより自動発行されています。<br/>
                内容についてご不明な点がございましたら、サポートまでお問い合わせください。
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 印刷用のCSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .hide-on-print { display: none !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; box-sizing: border-box; }
        }
      `}} />
    </div>
  );
}