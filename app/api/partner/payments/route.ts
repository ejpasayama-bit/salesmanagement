import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 🌟 追加：パートナーの会社名を安全なルートで取得（RLS回避）
    const { data: partnerData } = await supabase
      .from('partners')
      .select('company_name')
      .eq('id', userId)
      .single();

    const partnerName = partnerData?.company_name || '';

    // パートナー自身の案件で、支払ステータスが「PAID」のものだけを抽出
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id, client_company, plan_name, created_at,
        contracts!inner ( reward_amount, partner_payment_status, updated_at )
      `)
      .eq('partner_id', userId)
      .eq('contracts.partner_payment_status', 'PAID')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = data.map(lead => {
      const contract = Array.isArray(lead.contracts) ? lead.contracts[0] : lead.contracts;
      
      return {
        id: lead.id,
        client_company: lead.client_company,
        plan_name: lead.plan_name,
        introduced_at: lead.created_at,
        reward_amount: contract?.reward_amount || 0,
        paid_at: contract?.updated_at || null,
      };
    });

    // 🌟 修正：partnerName も一緒に画面へ返す
    return NextResponse.json({ success: true, data: formattedData, partnerName });
  } catch (error: any) {
    console.error('Payments Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}