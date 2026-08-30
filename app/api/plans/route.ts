import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 料金が安い順にプランを取得
    const { data, error } = await supabase.from('plans').select('*').order('initial_fee', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ success: true, plans: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}