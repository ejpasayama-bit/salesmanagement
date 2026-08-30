import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 今回もログイン機能実装まではダミーIDを使用します
const dummyPartnerId = '11111111-1111-1111-1111-111111111111';

// 【GET】これまでの請求履歴＋現在の送付先を取得する処理
export async function GET() {
  try {
    // ① プロフィール（住所など）を取得
    const { data: profile, error: profileError } = await supabase
      .from('partners')
      .select('company_name, contact_name, postal_code, address, phone_number')
      .eq('id', dummyPartnerId)
      .single();

    if (profileError) throw profileError;

    // ② 請求履歴を取得
    const { data: requests, error: reqError } = await supabase
      .from('flyer_requests')
      .select('*')
      .eq('partner_id', dummyPartnerId)
      .order('requested_at', { ascending: false });

    if (reqError) throw reqError;

    return NextResponse.json({ success: true, profile, requests });
  } catch (error: any) {
    console.error('Flyer Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 【POST】新しい請求をデータベースに保存する処理
export async function POST(req: Request) {
  try {
    const { requested_amount } = await req.json();
    
    const { error } = await supabase
      .from('flyer_requests')
      .insert({
        partner_id: dummyPartnerId,
        requested_amount: Number(requested_amount),
        status: 'PENDING' // 初期ステータスは未発送（準備中）
      });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Flyer Request Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}