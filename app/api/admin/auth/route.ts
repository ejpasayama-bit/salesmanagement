import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    
    // 🌟 管理者用のIDとパスワード
    const ADMIN_USER = 'fuk4y4';
    const ADMIN_PASS = 'super_secret_83rh2';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const response = NextResponse.json({ success: true });
      
      // ログイン成功の証拠としてCookieを発行（30日間有効）
      response.cookies.set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
      return response;
    }
    
    return NextResponse.json({ error: '認証失敗' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
  }
}