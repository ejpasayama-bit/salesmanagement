// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // 🌟 管理者用の秘密のサブドメイン
  const adminSubdomain = 'fuk4y4-83rh2.sales-partner.biz';
  // 🌟 メインの利用者用ドメイン
  const mainDomain = 'sales-partner.biz';

  // 【ブロック機能】
  // メインドメイン（sales-partner.biz）で /admin にアクセスされたら強制的に 404 を返す
  if (hostname === mainDomain && url.pathname.startsWith('/admin')) {
    return new NextResponse('404 Not Found', { status: 404 });
  }

  // 【管理者サブドメインの処理】
  if (hostname === adminSubdomain) {
    // 親切設計: ルート (/) にアクセスした時、自動で /admin に飛ばす
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // 🔒 ここからBasic認証の処理（管理者サブドメイン全体に適用）
    const basicAuth = req.headers.get('authorization');

    // 🌟 管理者用のIDとパスワード（必ずご自身のものに変更してください）
    const ADMIN_USER = 'fuk4y4';
    const ADMIN_PASS = 'super_secret_83rh2';

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // IDとパスワードが一致すれば、そのまま画面を表示
      if (user === ADMIN_USER && pwd === ADMIN_PASS) {
        return NextResponse.next();
      }
    }

    // 認証情報がない、または間違っている場合はアクセスを弾く
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  // 上記以外の通常のアクセス（一般利用者のパートナー画面など）はそのまま通す
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};