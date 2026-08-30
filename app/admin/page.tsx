'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [issuedLeadIds, setIssuedLeadIds] = useState<Set<string>>(new Set());
  
  const [confirmingLead, setConfirmingLead] = useState<any | null>(null);
  const [previewingEstimate, setPreviewingEstimate] = useState<any | null>(null);
  const [startingLead, setStartingLead] = useState<any | null>(null);
  const [startDate, setStartDate] = useState('');

  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ 
    client_company: '', 
    client_contact: '', 
    client_email: '', 
    plan_name: '', 
    delivery_deadline: '', 
    initial_fee: 0, 
    monthly_fee: 0,
    selected_options: [] as { name: string, price: number }[],
    remarks: ''
  });

  const [filterStatus, setFilterStatus] = useState('ALL'); 
  const [filterPayment, setFilterPayment] = useState('ALL'); 
  const [filterDateType, setFilterDateType] = useState('created_at'); 
  const [inputYear, setInputYear] = useState('ALL');
  const [inputMonth, setInputMonth] = useState('ALL');
  const [appliedYear, setAppliedYear] = useState('ALL');
  const [appliedMonth, setAppliedMonth] = useState('ALL');

  const now = new Date();
  const years = Array.from({ length: 9 }, (_, i) => now.getFullYear() - 7 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const fetchData = async () => {
    const leadsRes = await fetch('/api/leads');
    const leadsData = await leadsRes.json();
    if (leadsData.success) setLeads(leadsData.leads);

    const plansRes = await fetch('/api/plans');
    const plansData = await plansRes.json();
    if (plansData.success) setDbPlans(plansData.plans);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (leadId: string, updates: any, successMessage: string) => {
    setLoadingId(leadId);
    try {
      const res = await fetch('/api/admin/update-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, updates })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${successMessage}`);
        fetchData(); 
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    setLoadingId(editingLead.id);
    try {
      const res = await fetch('/api/admin/update-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead_id: editingLead.id, 
          updates: { 
            client_company: editForm.client_company,
            client_contact: editForm.client_contact,
            client_email: editForm.client_email,
            plan_name: editForm.plan_name, 
            delivery_deadline: editForm.delivery_deadline,
            initial_fee: editForm.initial_fee,
            monthly_fee: editForm.monthly_fee,
            selected_options: editForm.selected_options,
            remarks: editForm.remarks
          } 
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${editForm.client_company} の情報を更新しました`);
        setEditingLead(null); 
        fetchData();
      } else {
        setMessage('❌ エラー: ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setLoadingId(null);
    }
  };

  const executeCreateInvoice = async () => {
    if (!confirmingLead) return;
    setLoadingId(confirmingLead.id);
    setMessage(`${confirmingLead.client_company} 宛ての請求書を送信中...`);
    const currentLead = confirmingLead;
    setConfirmingLead(null); 

    try {
      const res = await fetch('/api/stripe/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: currentLead.id,
          email: currentLead.client_email,
          company_name: currentLead.client_company,
          initial_fee: currentLead.initial_fee,
          monthly_fee: currentLead.monthly_fee
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${currentLead.client_company} へ請求書を送信し、入金処理を待機しています`);
        setIssuedLeadIds(prev => new Set(prev).add(currentLead.id));
        fetchData();
      } else {
        setMessage('❌ エラー: ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setLoadingId(null);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const paymentStatus = lead.contracts?.[0]?.payment_status || 'UNPAID';
    const matchStatus = filterStatus === 'ALL' || lead.status === filterStatus;
    const matchPayment = filterPayment === 'ALL' || 
                         (filterPayment === 'PAID' && paymentStatus === 'PAID_BY_CLIENT') ||
                         (filterPayment === 'UNPAID' && paymentStatus !== 'PAID_BY_CLIENT');
    
    let matchDate = true;
    if (appliedYear !== 'ALL' && appliedMonth !== 'ALL') {
      const targetDateStr = lead[filterDateType]; 
      if (!targetDateStr) {
        matchDate = false; 
      } else {
        const d = new Date(targetDateStr);
        if (d.getFullYear() !== Number(appliedYear) || d.getMonth() + 1 !== Number(appliedMonth)) {
          matchDate = false;
        }
      }
    }
    return matchStatus && matchPayment && matchDate;
  });

  return (
    <div className="p-10 max-w-7xl mx-auto font-sans relative">
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">管理者ダッシュボード（総合管理）</h1>
        
        <div className="flex items-center gap-3">
          <Link href="/admin/partners" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-lg shadow transition flex items-center gap-2">
            <span className="text-xl">👥</span> パートナー管理
          </Link>
          <Link href="/admin/settings" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-5 rounded-lg border border-gray-300 shadow-sm transition flex items-center gap-2">
            <span className="text-xl">⚙</span> メール設定
          </Link>
          <Link href="/admin/payments" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-lg shadow transition flex items-center gap-2">
            <span className="text-xl">💰</span> 紹介料の支払管理へ
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm mb-6 space-y-4">
        <div className="flex gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600">進行状況:</label>
            <select className="border border-gray-300 rounded p-1 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">すべて</option>
              <option value="PENDING">商談中・未成約</option>
              <option value="WON">成約済</option>
              <option value="LOST">不成立</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600">入金状況:</label>
            <select className="border border-gray-300 rounded p-1 text-sm" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
              <option value="ALL">すべて</option>
              <option value="PAID">支払済のみ</option>
              <option value="UNPAID">未払いのみ</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <label className="text-sm font-semibold text-gray-600">年月絞り込み:</label>
          <select className="border border-gray-300 rounded p-1 text-sm bg-gray-50" value={filterDateType} onChange={e => setFilterDateType(e.target.value)}>
            <option value="created_at">紹介日</option>
            <option value="estimate_sent_at">見積日</option>
            <option value="started_at">着手日</option>
            <option value="invoiced_at">請求日</option>
            <option value="client_paid_at">支払日</option>
          </select>
          <span className="text-gray-400">で</span>
          <select className="border border-gray-300 rounded p-1 text-sm" value={inputYear} onChange={e => setInputYear(e.target.value)}>
            <option value="ALL">全期間</option>
            {years.map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select className="border border-gray-300 rounded p-1 text-sm" value={inputMonth} onChange={e => setInputMonth(e.target.value)} disabled={inputYear === 'ALL'}>
            <option value="ALL">全て</option>
            {months.map(m => <option key={m} value={m}>{m}月</option>)}
          </select>
          
          <button onClick={() => { setAppliedYear(inputYear); setAppliedMonth(inputMonth); }} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-1 px-3 rounded text-sm transition ml-2 shadow-sm">
            適用
          </button>
          <button onClick={() => { setInputYear('ALL'); setInputMonth('ALL'); setAppliedYear('ALL'); setAppliedMonth('ALL'); }} className="text-xs text-blue-600 underline hover:text-blue-800 ml-2">
            リセット
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 border rounded font-medium ${message.includes('❌') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 font-semibold text-gray-700">紹介日 / 紹介者</th>
              <th className="p-3 font-semibold text-gray-700">顧客情報 (プラン/納期/金額)</th>
              <th className="p-3 font-semibold text-gray-700 text-center">入金</th>
              <th className="p-3 font-semibold text-gray-700 text-center">進行アクション</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => {
              const contract = lead.contracts?.[0];
              const isPaid = contract?.payment_status === 'PAID_BY_CLIENT';
              const isLoading = loadingId === lead.id;
              const isIssued = !!lead.invoiced_at || issuedLeadIds.has(lead.id); 
              const isLost = lead.status === 'LOST';
              
              const initialFee = lead.initial_fee || 0;
              const monthlyFee = lead.monthly_fee || 0;
              const isEstimateReady = lead.plan_name && lead.delivery_deadline && (initialFee > 0 || monthlyFee > 0);

              let isOverdue = false;
              let dueDateString = "";
              if (isIssued && lead.stripe_due_date) {
                const dueDate = new Date(lead.stripe_due_date);
                const today = new Date();
                isOverdue = today > dueDate && !isPaid; 
                dueDateString = dueDate.toLocaleDateString('ja-JP');
              }

              return (
                <tr key={lead.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isLost ? 'opacity-60 bg-gray-50' : ''}`}>
                  <td className="p-3">
                    <div className="text-xs text-gray-500 mb-1">{new Date(lead.created_at).toLocaleDateString('ja-JP')}</div>
                    <div className="font-semibold text-blue-900">{lead.partners?.company_name || '不明'}</div>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-gray-800 text-base flex items-center gap-2">
                      {lead.client_company}
                      {isLost && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">不成立</span>}
                    </div>
                    <div className="text-xs text-gray-500">{lead.client_contact} ({lead.client_email})</div>
                    <div className="mt-2 text-xs flex gap-2 items-center flex-wrap">
                      <span className="bg-gray-100 px-2 py-1 rounded border">プラン: {lead.plan_name || '未設定'}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded border">納期: {lead.delivery_deadline || '未設定'}</span>
                      <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-200">
                        初期: ¥{initialFee.toLocaleString()} / 月額: ¥{monthlyFee.toLocaleString()}
                      </span>
                      {lead.started_at && (
                        <span className="bg-purple-50 text-purple-800 px-2 py-1 rounded border border-purple-200 font-bold">
                          着手済: {new Date(lead.started_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                      
                      {!isLost && (
                        <button 
                          onClick={() => {
                            setEditingLead(lead);
                            setEditForm({ 
                              client_company: lead.client_company,
                              client_contact: lead.client_contact,
                              client_email: lead.client_email,
                              plan_name: lead.plan_name || '', 
                              delivery_deadline: lead.delivery_deadline || '',
                              initial_fee: initialFee,
                              monthly_fee: monthlyFee,
                              selected_options: lead.selected_options || [],
                              remarks: lead.remarks || ''
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 underline ml-2"
                        >
                          編集
                        </button>
                      )}
                    </div>
                    {lead.remarks && (
                      <div className="mt-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200 max-w-lg whitespace-pre-wrap">
                        <span className="font-bold">📝 備考：</span>{lead.remarks}
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-center align-middle">
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">
                        ☑ 支払済
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium">-</span>
                    )}
                  </td>

                  <td className="p-3">
                    {isLost ? (
                      <div className="text-center text-gray-400 text-xs font-bold">処理終了</div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center justify-center gap-2">
                          {lead.estimate_status === 'SENT' ? (
                            <span className="text-xs font-bold text-gray-500 border px-2 py-1 rounded bg-gray-100 w-16 text-center" title={`見積日: ${lead.estimate_sent_at ? new Date(lead.estimate_sent_at).toLocaleDateString() : '不明'}`}>見積済</span>
                          ) : (
                            <button 
                              onClick={() => {
                                if (!isEstimateReady) { alert('見積書を作成するには、先に「編集」からプラン・納期・金額を設定してください。'); return; }
                                setPreviewingEstimate(lead);
                              }}
                              disabled={isLoading}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1 px-3 rounded transition disabled:opacity-50"
                            >
                              見積作成
                            </button>
                          )}

                          {lead.status !== 'WON' && lead.estimate_status === 'SENT' && !lead.started_at && (
                            <div className="flex items-center ml-1 pl-1 border-l border-gray-300 gap-1">
                              <button onClick={() => { setStartingLead(lead); setStartDate(new Date().toISOString().split('T')[0]); }} disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded transition">着手(YES)</button>
                              <button onClick={() => { if(window.confirm(`${lead.client_company} を「不成立」として処理しますか？この操作は取り消せません。`)) { handleUpdateStatus(lead.id, { status: 'LOST' }, '不成立として記録しました'); } }} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded transition">不成立(NO)</button>
                            </div>
                          )}

                          {lead.delivery_status === 'DELIVERED' ? (
                            <span className="text-xs font-bold text-green-600 border border-green-300 px-2 py-1 rounded bg-green-50 ml-1">納品済</span>
                          ) : (
                            <button onClick={() => handleUpdateStatus(lead.id, { delivery_status: 'DELIVERED' }, '納品完了として記録しました')} disabled={isLoading || !lead.started_at} className={`text-xs font-bold py-1 px-3 rounded transition ml-1 ${!lead.started_at ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>納品完了</button>
                          )}
                          
                          {isIssued ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-gray-600 border border-gray-300 px-2 py-1 rounded bg-gray-50">請求済</span>
                              <button 
                                onClick={() => setConfirmingLead(lead)} 
                                disabled={isLoading || lead.status === 'WON'} 
                                className="text-xs font-bold py-1 px-3 rounded bg-gray-500 hover:bg-gray-600 text-white transition disabled:opacity-50 ml-1"
                              >
                                {isLoading ? '処理中...' : '再発行'}
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setConfirmingLead(lead)} 
                              disabled={isLoading || lead.status === 'WON' || lead.estimate_status !== 'SENT'} 
                              className={`text-xs font-bold py-1 px-3 rounded transition ml-1 disabled:opacity-50 disabled:cursor-not-allowed ${lead.status === 'WON' ? 'bg-gray-300 text-gray-500' : lead.estimate_status !== 'SENT' ? 'bg-gray-300 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                              {isLoading ? '処理中...' : '請求発行'}
                            </button>
                          )}
                        </div>
                        
                        {isIssued && dueDateString && (
                          <div className="mt-1 text-right">
                            {isOverdue ? (
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                ⚠️ 期限超過 ({dueDateString} 迄)
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                支払期限: {dueDateString}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {previewingEstimate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">見積書の送信プレビュー</h2>
            <div className="border border-gray-300 rounded p-5 mb-6 bg-white space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">宛先</span><span className="font-bold">{previewingEstimate.client_company} 御中</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">ご提案プラン</span><span className="font-bold text-blue-700">{previewingEstimate.plan_name}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">納品予定日</span><span className="font-bold">{previewingEstimate.delivery_deadline}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-gray-500">初期費用 (税抜)</span><span className="font-bold">¥{(previewingEstimate.initial_fee || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">月額保守費 (税抜)</span><span className="font-bold">¥{(previewingEstimate.monthly_fee || 0).toLocaleString()} / 月</span></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPreviewingEstimate(null)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">キャンセル</button>
              <button onClick={() => { handleUpdateStatus(previewingEstimate.id, { estimate_status: 'SENT', estimate_sent_at: new Date().toISOString() }, '見積書を送信しました'); setPreviewingEstimate(null); }} className="px-4 py-2 bg-yellow-500 rounded text-white font-bold hover:bg-yellow-600">確定して送信する</button>
            </div>
          </div>
        </div>
      )}

      {startingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">着手日 (YES) の決定</h2>
            <div className="mb-6"><input type="date" className="w-full border border-gray-300 rounded p-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setStartingLead(null)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">キャンセル</button>
              <button onClick={() => { if(!startDate) return; handleUpdateStatus(startingLead.id, { started_at: startDate }, '着手日を記録しました'); setStartingLead(null); }} className="px-4 py-2 bg-green-500 rounded text-white font-bold hover:bg-green-600">確定する</button>
            </div>
          </div>
        </div>
      )}

      {editingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 my-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">情報編集 ({editingLead.client_company})</h2>
            <div className="space-y-4 mb-6">
              
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">顧客の会社名</label>
                  <input type="text" className="w-full border rounded p-2 text-sm" value={editForm.client_company} onChange={(e) => setEditForm({...editForm, client_company: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">担当者名</label>
                  <input type="text" className="w-full border rounded p-2 text-sm" value={editForm.client_contact} onChange={(e) => setEditForm({...editForm, client_contact: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">連絡先メールアドレス</label>
                  <input type="email" className="w-full border rounded p-2 text-sm" value={editForm.client_email} onChange={(e) => setEditForm({...editForm, client_email: e.target.value})} />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-4">
                <label className="block text-xs font-bold text-blue-800 mb-2">⚡ プリセットから呼び出す（自動入力）</label>
                <select className="w-full border border-blue-300 rounded p-2 text-sm bg-white" onChange={(e) => {
                  const preset = dbPlans.find(p => p.name === e.target.value);
                  if(preset) setEditForm({ ...editForm, plan_name: preset.name, initial_fee: preset.initial_fee, monthly_fee: preset.monthly_fee });
                }}>
                  <option value="">-- 選択してください --</option>
                  {dbPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 mb-1">契約プラン名</label><input type="text" className="w-full border rounded p-2" value={editForm.plan_name} onChange={(e) => setEditForm({...editForm, plan_name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">納品予定日</label><input type="date" className="w-full border rounded p-2" value={editForm.delivery_deadline} onChange={(e) => setEditForm({...editForm, delivery_deadline: e.target.value})} /></div>
              <div className="pt-2 border-t mt-2"><label className="block text-sm font-medium text-gray-700 mb-1">初期費用 (見積額)</label><input type="number" className="w-full border rounded p-2" value={editForm.initial_fee} onChange={(e) => setEditForm({...editForm, initial_fee: Number(e.target.value)})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">月額保守費 (見積額)</label><input type="number" className="w-full border rounded p-2" value={editForm.monthly_fee} onChange={(e) => setEditForm({...editForm, monthly_fee: Number(e.target.value)})} /></div>
              
              <div className="pt-4 border-t mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">追加オプション</label>
                {editForm.selected_options?.map((opt, index) => (
                  <div key={index} className="flex gap-2 mb-2 items-center">
                    <input 
                      type="text" 
                      className="flex-1 border rounded p-2 text-sm" 
                      value={opt.name} 
                      onChange={(e) => {
                        const newOpts = [...editForm.selected_options];
                        newOpts[index].name = e.target.value;
                        setEditForm({...editForm, selected_options: newOpts});
                      }} 
                    />
                    <input 
                      type="number" 
                      className="w-32 border rounded p-2 text-sm" 
                      value={opt.price} 
                      onChange={(e) => {
                        const newOpts = [...editForm.selected_options];
                        newOpts[index].price = Number(e.target.value);
                        setEditForm({...editForm, selected_options: newOpts});
                      }} 
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const newOpts = editForm.selected_options.filter((_, i) => i !== index);
                        setEditForm({...editForm, selected_options: newOpts});
                      }}
                      className="text-red-500 hover:bg-red-50 px-2 py-1 rounded font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <select 
                  className="w-full border border-gray-300 rounded p-2 text-sm mt-2" 
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [name, priceStr] = e.target.value.split('|');
                    const currentOptions = editForm.selected_options || [];
                    setEditForm({
                      ...editForm,
                      selected_options: [...currentOptions, { name, price: Number(priceStr) }]
                    });
                    e.target.value = ""; 
                  }}
                >
                  <option value="">＋ 公式オプションを追加...</option>
                  <option value="迷惑メール対策オプション|50000">迷惑メール対策オプション (50,000円)</option>
                  <option value="採用特化ランディングページ（LP）の制作|150000">採用特化LP制作 (150,000円〜)</option>
                  <option value="業務効率化アプリ・ツールのフルオーダー開発|300000">業務効率化アプリ開発 (300,000円〜)</option>
                  <option value="プロによる出張撮影ディレクション|30000">出張撮影ディレクション (30,000円)</option>
                  <option value="IT出張サポート|15000">IT出張サポート (15,000円)</option>
                  <option value="LINE公式アカウントの構築・連携設定|50000">LINE公式アカウント構築 (50,000円)</option>
                  <option value="カスタムオプション|0">その他のカスタムオプション</option>
                </select>
              </div>

              <div className="pt-4 border-t mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">備考・引継ぎ事項</label>
                <textarea 
                  rows={4}
                  className="w-full border border-gray-300 rounded p-2 text-sm" 
                  value={editForm.remarks} 
                  onChange={(e) => setEditForm({...editForm, remarks: e.target.value})} 
                  placeholder="パートナーからの要望や、社内用のメモなどを入力"
                />
              </div>

            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingLead(null)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">キャンセル</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 rounded text-white font-bold hover:bg-blue-700">保存する</button>
            </div>
          </div>
        </div>
      )}

      {confirmingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">請求内容の最終確認</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 space-y-2 text-sm">
              <p><span className="text-gray-500 w-24 inline-block">送信先:</span> <span className="font-semibold">{confirmingLead.client_company}</span></p>
              <hr className="my-2 border-gray-200" />
              <p><span className="text-gray-500 w-24 inline-block">初期費用:</span> <span className="font-semibold text-lg text-blue-700">¥{(confirmingLead.initial_fee || 0).toLocaleString()}</span></p>
              <p><span className="text-gray-500 w-24 inline-block">月額保守費:</span> <span>¥{(confirmingLead.monthly_fee || 0).toLocaleString()} / 月</span></p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmingLead(null)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">キャンセル</button>
              <button onClick={executeCreateInvoice} className="px-4 py-2 bg-blue-600 rounded text-white font-bold hover:bg-blue-700">確定して送信する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}