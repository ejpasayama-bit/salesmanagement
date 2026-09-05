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

    // データの整形
    const formattedData = data.map(lead => ({
      id: lead.id,
      client_company: lead.client_company,
      plan_name: lead.plan_name,
      introduced_at: lead.created_at,
      reward_amount: lead.contracts[0]?.reward_amount || 0,
      paid_at: lead.contracts[0]?.updated_at,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('Payments Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}