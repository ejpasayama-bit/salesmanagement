'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  
  const initialFormState = {
    email: '', password: '', company_name: '', contact_name: '', phone_number: '', postal_code: '', address: '',
    bank_name: '', branch_name: '', account_type: '普通', account_number: '', account_name: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  
  const [editingPartner, setEditingPartner] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(initialFormState);

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/partners');
      const data = await res.json();
      if (data.success) setPartners(data.partners);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('作成中...');

    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setMessage('✅ パートナーのアカウントを発行しました！');
        setFormData(initialFormState);
        fetchPartners();
      } else {
        setMessage('❌ エラー: ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePartner = async () => {
    if (!editingPartner) return;
    setIsLoading(true);
    setMessage('更新中...');

    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPartner.id, ...editForm })
      });
      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${editForm.company_name} の情報を更新しました`);
        setEditingPartner(null);
        fetchPartners();
      } else {
        setMessage('❌ エラー: ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePartner = async (id: string, name: string) => {
    if (!window.confirm(`⚠️ 本当に「${name}」のアカウントを削除しますか？\n（この操作は取り消せません。また、紐づく紹介データに影響が出る可能性があります）`)) return;
    
    setIsLoading(true);
    setMessage('削除中...');

    try {
      const res = await fetch('/api/admin/partners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();

      if (data.success) {
        setMessage(`✅ ${name} のアカウントを削除しました`);
        fetchPartners();
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
    <div className="p-10 max-w-7xl mx-auto font-sans relative">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit transition">
          <span>←</span> 総合管理ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">パートナー管理・アカウント発行</h1>

      {message && (
        <div className={`mb-6 p-4 rounded font-medium ${message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 左側：新規パートナー作成フォーム (4カラム分) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit lg:col-span-4">
          <h2 className="text-xl font-bold mb-4 text-gray-800">新規パートナー追加</h2>
          <form onSubmit={handleCreatePartner} className="space-y-4 text-sm">
            <div><label className="block font-bold text-gray-700 mb-1">会社名 / 屋号</label><input type="text" required className="w-full border rounded p-2" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} /></div>
            <div><label className="block font-bold text-gray-700 mb-1">担当者名</label><input type="text" className="w-full border rounded p-2" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} /></div>
            
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block font-bold text-gray-700 mb-1">電話番号</label><input type="text" className="w-full border rounded p-2" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
              <div><label className="block font-bold text-gray-700 mb-1">郵便番号</label><input type="text" className="w-full border rounded p-2" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} placeholder="例: 123-4567" /></div>
            </div>
            <div><label className="block font-bold text-gray-700 mb-1">住所</label><input type="text" className="w-full border rounded p-2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>

            <div className="pt-2 border-t border-gray-200">
              <label className="block font-bold text-gray-700 mb-1">ログイン用メールアドレス</label><input type="email" required className="w-full border rounded p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">初期パスワード</label><input type="text" required className="w-full border rounded p-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="例: password123" />
            </div>

            <div className="pt-4 border-t">
              <p className="font-bold text-gray-700 mb-2">振込先口座情報 (任意)</p>
              <div className="space-y-3">
                <div><label className="block text-xs text-gray-600 mb-1">銀行名</label><input type="text" className="w-full border rounded p-2" value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})} placeholder="例: みずほ銀行" /></div>
                <div><label className="block text-xs text-gray-600 mb-1">支店名</label><input type="text" className="w-full border rounded p-2" value={formData.branch_name} onChange={e => setFormData({...formData, branch_name: e.target.value})} placeholder="例: 渋谷支店" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-xs text-gray-600 mb-1">口座種別</label><select className="w-full border rounded p-2 bg-white" value={formData.account_type} onChange={e => setFormData({...formData, account_type: e.target.value})}><option value="普通">普通</option><option value="当座">当座</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-1">口座番号</label><input type="text" className="w-full border rounded p-2" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} placeholder="1234567" /></div>
                </div>
                <div><label className="block text-xs text-gray-600 mb-1">口座名義 (カナ)</label><input type="text" className="w-full border rounded p-2" value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})} placeholder="例: カ) テストパートナー" /></div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition mt-4 disabled:opacity-50">
              {isLoading ? '発行中...' : 'アカウントを発行する'}
            </button>
          </form>
        </div>

        {/* 右側：登録済みパートナー一覧 (8カラム分) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">登録済みパートナー一覧</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-600 text-xs">
                  <th className="pb-3 px-2 font-bold w-24">登録日</th>
                  <th className="pb-3 px-2 font-bold">パートナー情報</th>
                  <th className="pb-3 px-2 font-bold">振込先口座</th>
                  <th className="pb-3 px-2 font-bold text-center w-24">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-2 text-xs text-gray-500 whitespace-nowrap align-top">
                      {new Date(p.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="py-4 px-2 align-top">
                      <div className="font-bold text-gray-800 text-base mb-1">{p.company_name}</div>
                      <div className="text-gray-600 text-xs mb-1">担当: {p.contact_name || '-'} / TEL: {p.phone_number || '-'}</div>
                      <div className="text-blue-600 text-xs break-all">{p.email}</div>
                    </td>
                    <td className="py-4 px-2 text-xs text-gray-600 align-top max-w-xs">
                      {p.bank_name ? (
                        <div>
                          <p className="font-semibold text-gray-800">{p.bank_name} {p.branch_name}</p>
                          <p>({p.account_type}) {p.account_number}</p>
                          <p className="text-gray-400 mt-1">{p.account_name}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded">未登録</span>
                      )}
                    </td>
                    <td className="py-4 px-2 align-top text-center">
                      <div className="flex flex-col gap-2 justify-center">
                        <button 
                          onClick={() => {
                            setEditingPartner(p);
                            setEditForm({
                              email: p.email, password: '', 
                              company_name: p.company_name, contact_name: p.contact_name || '', phone_number: p.phone_number || '', postal_code: p.postal_code || '', address: p.address || '',
                              bank_name: p.bank_name || '', branch_name: p.branch_name || '', account_type: p.account_type || '普通', account_number: p.account_number || '', account_name: p.account_name || ''
                            });
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1 px-3 rounded border border-gray-300 transition"
                        >
                          編集
                        </button>
                        <button 
                          onClick={() => handleDeletePartner(p.id, p.company_name)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-1 px-3 rounded border border-red-200 transition"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {partners.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-400">登録されているパートナーはありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🌟 編集用ポップアップ (パスワード追加 & ボタン順変更) */}
      {editingPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 my-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">情報編集 ({editingPartner.company_name})</h2>
            <div className="space-y-4 mb-6 text-sm">
              
              <div><label className="block font-bold text-gray-700 mb-1">会社名 / 屋号</label><input type="text" className="w-full border rounded p-2" value={editForm.company_name} onChange={e => setEditForm({...editForm, company_name: e.target.value})} /></div>
              <div><label className="block font-bold text-gray-700 mb-1">担当者名</label><input type="text" className="w-full border rounded p-2" value={editForm.contact_name} onChange={e => setEditForm({...editForm, contact_name: e.target.value})} /></div>
              
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block font-bold text-gray-700 mb-1">電話番号</label><input type="text" className="w-full border rounded p-2" value={editForm.phone_number} onChange={e => setEditForm({...editForm, phone_number: e.target.value})} /></div>
                <div><label className="block font-bold text-gray-700 mb-1">郵便番号</label><input type="text" className="w-full border rounded p-2" value={editForm.postal_code} onChange={e => setEditForm({...editForm, postal_code: e.target.value})} /></div>
              </div>
              <div><label className="block font-bold text-gray-700 mb-1">住所</label><input type="text" className="w-full border rounded p-2" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} /></div>

              <div className="pt-2 border-t border-gray-200">
                <label className="block font-bold text-blue-700 mb-1">ログイン用メールアドレス</label>
                <input type="email" required className="w-full border rounded p-2 border-blue-300 bg-blue-50" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                <p className="text-xs text-gray-500 mt-1">※変更すると次回のログインから新しいアドレスが必要になります。</p>
              </div>

              {/* 🌟 修正：パスワード入力欄を追加 */}
              <div>
                <label className="block font-bold text-red-600 mb-1">新しいパスワード (変更する場合のみ入力)</label>
                <input type="text" className="w-full border rounded p-2 border-red-200 bg-red-50" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} placeholder="変更しない場合は空欄" />
              </div>

              <div className="pt-4 border-t">
                <p className="font-bold text-gray-700 mb-2">振込先口座情報</p>
                <div className="space-y-3">
                  <div><label className="block text-xs text-gray-600 mb-1">銀行名</label><input type="text" className="w-full border rounded p-2" value={editForm.bank_name} onChange={e => setEditForm({...editForm, bank_name: e.target.value})} /></div>
                  <div><label className="block text-xs text-gray-600 mb-1">支店名</label><input type="text" className="w-full border rounded p-2" value={editForm.branch_name} onChange={e => setEditForm({...editForm, branch_name: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-gray-600 mb-1">口座種別</label><select className="w-full border rounded p-2 bg-white" value={editForm.account_type} onChange={e => setEditForm({...editForm, account_type: e.target.value})}><option value="普通">普通</option><option value="当座">当座</option></select></div>
                    <div><label className="block text-xs text-gray-600 mb-1">口座番号</label><input type="text" className="w-full border rounded p-2" value={editForm.account_number} onChange={e => setEditForm({...editForm, account_number: e.target.value})} /></div>
                  </div>
                  <div><label className="block text-xs text-gray-600 mb-1">口座名義 (カナ)</label><input type="text" className="w-full border rounded p-2" value={editForm.account_name} onChange={e => setEditForm({...editForm, account_name: e.target.value})} /></div>
                </div>
              </div>
            </div>
            {/* 🌟 修正：ボタンの順序を 保存 → キャンセル に変更 */}
            <div className="flex justify-end gap-3 flex-row-reverse">
              <button onClick={() => setEditingPartner(null)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">キャンセル</button>
              <button onClick={handleUpdatePartner} disabled={isLoading} className="px-4 py-2 bg-blue-600 rounded text-white font-bold hover:bg-blue-700 disabled:opacity-50">保存する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}