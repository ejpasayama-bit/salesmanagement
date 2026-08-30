// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Cloudflare Pagesのプレビュー用URLや、開発中のlocalhostは許可
  const isLocal = hostname.includes('localhost');
  const isCloudflarePages = hostname.endsWith('.pages.dev');

  // 🌟 管理者用の秘密のサブドメイン
  const adminSubdomain = 'fuk4y4-83rh2.sales-partner.biz';
  // 🌟 メインの利用者用ドメイン
  const mainDomain = 'sales-partner.biz';

  // 【最重要セキュリティ】
  // メインドメイン（sales-partner.biz）で /admin にアクセスされたら強制的に 404 を返す
  if (hostname === mainDomain && url.pathname.startsWith('/admin')) {
    return new NextResponse('404 Not Found', { status: 404 });
  }

  // 秘密のサブドメインにルート (/) でアクセスした時、自動で /admin に飛ばす
  if (hostname === adminSubdomain && url.pathname === '/') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};