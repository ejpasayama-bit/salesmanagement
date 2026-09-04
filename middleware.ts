import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const adminSubdomain = 'fuk4y4-83rh2.sales-partner.biz';
  const mainDomain = 'sales-partner.biz';

  // 【メインドメインのブロック】/admin や /api/admin を完全に遮断
  if (hostname === mainDomain && (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin'))) {
    return new NextResponse('404 Not Found', { status: 404 });
  }

  // 【管理者サブドメインの処理】
  if (hostname === adminSubdomain) {
    // トップにアクセスした場合は /admin へ飛ばす
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // ログイン画面と認証用API自体は誰でもアクセスできるようにスルーする
    if (url.pathname === '/admin/login' || url.pathname === '/api/admin/auth') {
      return NextResponse.next();
    }

    // 🔒 Cookieによる認証チェック
    const adminSession = req.cookies.get('admin_session')?.value;
    
    if (adminSession !== 'true') {
      // APIにアクセスしようとした場合はエラーを返す
      if (url.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // 画面にアクセスしようとした場合はログイン画面へリダイレクト
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// 🌟 matcherの変更: apiフォルダもミドルウェアの監視対象に含める
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};