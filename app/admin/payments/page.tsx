'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PaymentsAdminPage() {
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredAggregations, setFilteredAggregations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  
  const [confirmingPayment, setConfirmingPayment] = useState<any | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/payments');
    const json = await res.json();
    if (json.success) {
      setAllData(json.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (allData.length === 0) return;

    const targetSalesYear = paymentDate.getMonth() === 0 ? paymentDate.getFullYear() - 1 : paymentDate.getFullYear();
    const targetSalesMonth = paymentDate.getMonth() === 0 ? 11 : paymentDate.getMonth() - 1;

    const grouped = allData.reduce((acc: any, lead: any) => {
      const contract = lead.contracts?.[0];
      const partner = lead.partners;

      if (contract?.payment_status === 'PAID_BY_CLIENT') {
        const salesDate = new Date(contract.created_at);
        
        if (salesDate.getFullYear() === targetSalesYear && salesDate.getMonth() === targetSalesMonth) {
          
          if (!acc[partner.id]) {
            acc[partner.id] = {
              partner,
              totalAmount: 0,
              unpaidContractIds: [],
              leads: [],
              isAllPaid: true
            };
          }

          acc[partner.id].totalAmount += contract.reward_amount;
          acc[partner.id].leads.push({
            company: lead.client_company,
            amount: contract.reward_amount,
            status: contract.partner_payment_status,
            paid_at: contract.partner_paid_at
          });

          if (contract.partner_payment_status !== 'PAID') {
            acc[partner.id].isAllPaid = false;
            acc[partner.id].unpaidContractIds.push(contract.id);
          }
        }
      }
      return acc;
    }, {});

    setFilteredAggregations(Object.values(grouped));
  }, [allData, paymentDate]);

  const executePayment = async () => {
    if (!confirmingPayment) return;
    setIsNotifying(true);
    setMessage(`${confirmingPayment.partner.company_name} へ支払い通知を送信中...`);

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_ids: confirmingPayment.unpaidContractIds })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${confirmingPayment.partner.company_name} の支払い処理と通知が完了しました！`);
        setConfirmingPayment(null);
        fetchPayments(); 
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setIsNotifying(false);
    }
  };

  const handlePrevMonth = () => setPaymentDate(new Date(paymentDate.getFullYear(), paymentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setPaymentDate(new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 1));
  
  const now = new Date();
  const setThisMonth = () => setPaymentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const setNextMonth = () => setPaymentDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));

  // 🌟 修正：税務署対策として「過去7年分」と「未来1年分」の配列に最適化
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 9 }, (_, i) => currentYear - 7 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  const paymentMonthStr = `${paymentDate.getFullYear()}年${paymentDate.getMonth() + 1}月`;
  const salesMonthStr = `${paymentDate.getMonth() === 0 ? paymentDate.getFullYear() - 1 : paymentDate.getFullYear()}年${paymentDate.getMonth() === 0 ? 12 : paymentDate.getMonth()}月`;

  return (
    <div className="p-10 max-w-5xl mx-auto font-sans relative">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit transition">
          <span>←</span> 総合管理ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">紹介料 支払管理（パートナー別）</h1>

      <div className="flex gap-3 mb-4">
        <button onClick={setThisMonth} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded text-sm transition">
          今月 ({now.getMonth() + 1}月) の支払
        </button>
        <button onClick={setNextMonth} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded text-sm transition">
          翌月 ({now.getMonth() === 11 ? 1 : now.getMonth() + 2}月) の支払予定
        </button>
      </div>

      <div className="flex justify-between items-center bg-white p-5 border border-gray-200 rounded-lg shadow-sm mb-8">
        <button onClick={handlePrevMonth} className="px-4 py-2 bg-gray-50 border rounded hover:bg-gray-100 font-bold text-gray-600 transition">
          &lt; 前月
        </button>
        
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <select 
              value={paymentDate.getFullYear()} 
              onChange={(e) => setPaymentDate(new Date(Number(e.target.value), paymentDate.getMonth(), 1))}
              className="border border-gray-300 rounded p-1 text-2xl font-black text-gray-800 hover:bg-gray-50 cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-2xl font-black text-gray-800">年</span>
            
            <select 
              value={paymentDate.getMonth()} 
              onChange={(e) => setPaymentDate(new Date(paymentDate.getFullYear(), Number(e.target.value), 1))}
              className="border border-gray-300 rounded p-1 text-2xl font-black text-gray-800 ml-2 hover:bg-gray-50 cursor-pointer"
            >
              {months.map(m => <option key={m} value={m}>{m + 1}</option>)}
            </select>
            <span className="text-2xl font-black text-gray-800">月 支払い分</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">（対象: {salesMonthStr}1日 〜 末日 の入金完了案件）</p>
        </div>

        <button onClick={handleNextMonth} className="px-4 py-2 bg-gray-50 border rounded hover:bg-gray-100 font-bold text-gray-600 transition">
          次月 &gt;
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded font-bold">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-center py-10 text-gray-500">読み込み中...</p>
      ) : (
        <div className="space-y-6">
          {filteredAggregations.map((agg, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row">
              
              <div className="bg-gray-50 p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{agg.partner.company_name}</h3>
                <div className="bg-white p-3 border border-gray-200 rounded text-sm space-y-1 text-gray-600">
                  <p className="font-semibold text-gray-800 border-b pb-1 mb-2">振込先口座</p>
                  <p>{agg.partner.bank_name || '未登録'} {agg.partner.branch_name}</p>
                  <p>{agg.partner.account_type} {agg.partner.account_number}</p>
                  <p className="font-medium mt-1">名義: {agg.partner.account_name}</p>
                </div>
              </div>

              <div className="p-6 md:w-2/3 flex flex-col justify-center">
                
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-700">{paymentMonthStr}の対象案件</span>
                  <span className="text-2xl font-black text-blue-700">合計: ¥{agg.totalAmount.toLocaleString()}</span>
                </div>
                
                <ul className="text-sm text-gray-700 space-y-2 mb-6 bg-gray-50 p-4 rounded border border-gray-100">
                  {agg.leads.map((item: any, i: number) => (
                    <li key={i} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-semibold">{item.company} 様分</span>
                        {item.status === 'PAID' && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">支払済</span>
                        )}
                      </div>
                      <span className="font-semibold">¥{item.amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-right">
                  {agg.isAllPaid ? (
                    <span className="text-green-600 font-bold bg-green-50 border border-green-200 py-2 px-6 rounded inline-block">
                      ✓ この月の支払いはすべて完了しています
                    </span>
                  ) : (
                    <button 
                      onClick={() => setConfirmingPayment(agg)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition shadow"
                    >
                      未払い分を支払処理 ＆ 通知する
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredAggregations.length === 0 && (
            <p className="text-center text-gray-500 py-12 bg-white border rounded-lg text-lg">
              {paymentMonthStr}にお支払いする対象案件（{salesMonthStr}発生分）はありません。
            </p>
          )}
        </div>
      )}

      {confirmingPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">支払い完了と通知の確認</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 space-y-3 text-sm">
              <p><span className="text-gray-500 w-24 inline-block">パートナー:</span> <span className="font-bold">{confirmingPayment.partner.company_name}</span></p>
              <p><span className="text-gray-500 w-24 inline-block">対象月:</span> <span className="font-bold">{paymentMonthStr} 分</span></p>
              <p><span className="text-gray-500 w-24 inline-block">支払金額:</span> <span className="font-bold text-xl text-blue-700">¥{
                confirmingPayment.leads.filter((l:any)=>l.status !== 'PAID').reduce((sum:number, l:any)=>sum+l.amount, 0).toLocaleString()
              }</span></p>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              システム上で「支払済」として記録し、紹介者へ支払い完了の通知メールを自動送信します。よろしいですか？
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmingPayment(null)} disabled={isNotifying} className="px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition">キャンセル</button>
              <button onClick={executePayment} disabled={isNotifying} className="px-4 py-2 bg-blue-600 rounded font-bold text-white hover:bg-blue-700 transition disabled:opacity-50">
                {isNotifying ? '送信中...' : '通知して完了する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}