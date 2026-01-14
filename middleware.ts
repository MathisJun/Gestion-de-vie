import { NextResponse } from 'next/server';

// AUTHENTIFICATION TEMPORAIREMENT DÉSACTIVÉE
export default function middleware(req: any) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/app/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
