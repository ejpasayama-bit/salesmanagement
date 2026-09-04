import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
    
    let users: any[] = [];
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (!authError && authData) {
        users = authData.users;
      }
    } catch (e) {
      console.warn("Auth users fetch failed, falling back to partners table email.");
    }
    
    if (error) throw error;

    const partnersWithEmail = data.map(partner => {
      const authUser = users.find(u => u.id === partner.id);
      return { 
        ...partner, 
        email: authUser?.email || partner.email || '不明' 
      };
    });

    return NextResponse.json({ success: true, partners: partnersWithEmail });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      email, password, company_name, contact_name, phone_number, postal_code, address,
      bank_name, branch_name, account_type, account_number, account_name,
      commission_rate // 🌟 追加
    } = body;

    if (!email || !password || !company_name) {
      return NextResponse.json({ error: 'メールアドレス、パスワード、会社名は必須です' }, { status: 400 });
    }

    // サーバー側でも文字数を厳格にチェック
    if (password.length < 6) {
      return NextResponse.json({ error: 'パスワードは6文字以上で設定してください' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, 
      user_metadata: { company_name }
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    const { error: partnerError } = await supabase.from('partners').insert({
      id: userId,
      company_name, contact_name, phone_number, postal_code, address, email, 
      bank_name, branch_name, account_type, account_number, account_name,
      commission_rate: Number(commission_rate) || 0.3 // 🌟 追加（未指定の場合は0.3）
    });

    if (partnerError) {
      await supabase.auth.admin.deleteUser(userId);
      throw partnerError;
    }

    return NextResponse.json({ success: true, partnerId: userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, email, password, company_name, contact_name, phone_number, postal_code, address,
      bank_name, branch_name, account_type, account_number, account_name,
      commission_rate // 🌟 追加
    } = body;

    if (!id) return NextResponse.json({ error: 'IDが不足しています' }, { status: 400 });

    const authUpdateData: any = { user_metadata: { company_name } };
    if (email) authUpdateData.email = email;
    
    if (password && password.trim() !== '') {
      // サーバー側でも文字数を厳格にチェック
      if (password.length < 6) {
        return NextResponse.json({ error: '新しいパスワードは6文字以上で設定してください' }, { status: 400 });
      }
      authUpdateData.password = password;
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdateData);
    
    // エラーを無視せず、失敗としてフロントエンドに返す
    if (authError) {
      return NextResponse.json({ error: `認証情報の更新に失敗しました: ${authError.message}` }, { status: 400 });
    }

    const { error } = await supabase.from('partners').update({
      company_name, contact_name, phone_number, postal_code, address, email,
      bank_name, branch_name, account_type, account_number, account_name,
      commission_rate: Number(commission_rate) || 0.3 // 🌟 追加
    }).eq('id', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'IDが不足しています' }, { status: 400 });

    await supabase.from('partners').delete().eq('id', id);
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}