import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // 🌟 修正：リクエストURLから userId を取得するように変更
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 🌟 修正：ダミーIDではなく、受け取った本物のuserIdで検索
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // 🌟 修正：.single() だと0件の時にPGRST116エラーで落ちるため、.maybeSingle() に変更

    if (error) throw error;
    
    if (!data) {
       return NextResponse.json({ success: true, profile: null });
    }

    // Auth側からメールアドレスも取得して結合
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const profileWithEmail = {
      ...data,
      email: authData?.user?.email || '不明'
    };

    return NextResponse.json({ success: true, profile: profileWithEmail });
  } catch (error: any) {
    console.error('Profile Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}