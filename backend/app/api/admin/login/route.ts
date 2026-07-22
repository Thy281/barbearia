import { NextRequest, NextResponse } from 'next/server';
import { sessionToken, validPassword } from '@/lib/auth';
export async function POST(request: NextRequest) {
  const { password } = await request.json();
  if (typeof password !== 'string' || !validPassword(password)) return NextResponse.json({ error: 'Senha inválida.' }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_session', sessionToken(), { httpOnly: true, sameSite: 'lax', secure: request.headers.get('x-forwarded-proto') === 'https', path: '/', maxAge: 60 * 60 * 8 });
  return response;
}
