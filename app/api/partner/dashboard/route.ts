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

    // 🌟 追加：パートナーの会社名を安全な裏側ルートで取得
    const { data: partnerData } = await supabase
      .from('partners')
      .select('company_name')
      .eq('id', userId)
      .single();

    const partnerName = partnerData?.company_name || '';

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

    // 🌟 修正：取得した partnerName も一緒に画面へ返す
    return NextResponse.json({ success: true, data: formattedData, partnerName });
  } catch (error: any) {
    console.error('Dashboard Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}