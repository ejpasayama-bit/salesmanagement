import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 【GET】クライアントが入金済みの案件と、パートナーの銀行口座情報を取得
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id, client_company,
        partners ( id, company_name, bank_name, branch_name, account_type, account_number, account_name ),
        contracts ( id, reward_amount, payment_status, partner_payment_status, partner_paid_at, created_at )
      `)
      .eq('status', 'WON'); // 成約済み案件のみ取得

    if (error) throw error;

    // 🌟 修正ポイント：データを整形（配列化）してからフロントに渡す
    const formattedData = data.map(lead => ({
      ...lead,
      contracts: lead.contracts ? (Array.isArray(lead.contracts) ? lead.contracts : [lead.contracts]) : []
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 【POST】パートナーへの支払い完了を記録（現状キープ）
export async function POST(req: Request) {
  try {
    // 支払いを完了する契約（contract）のIDリストを受け取る
    const { contract_ids } = await req.json();
    
    const { error } = await supabase
      .from('contracts')
      .update({ 
        partner_payment_status: 'PAID', 
        partner_paid_at: new Date().toISOString() 
      })
      .in('id', contract_ids);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}