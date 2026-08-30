import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // 🌟 修正：リクエストURLから userId を取得
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 🌟 修正：partner_id が一致する案件だけを取得する（フィルタリング）
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        contracts ( payment_status, reward_amount )
      `)
      .eq('partner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedData = data.map(lead => ({
      ...lead,
      contracts: lead.contracts ? (Array.isArray(lead.contracts) ? lead.contracts : [lead.contracts]) : []
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error('Dashboard Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}