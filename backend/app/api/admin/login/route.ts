import { NextRequest, NextResponse } from 'next/server';
import { sessionToken, validPassword } from '@/lib/auth';
import { checkRateLimit, resetRateLimit, extractClientIp } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 60 * 15;

export async function POST(request: NextRequest) {
  const clientIp = extractClientIp(request);
  const attemptsKey = `admin-login:${clientIp}`;
  const { allowed, remaining } = await checkRateLimit(attemptsKey, MAX_ATTEMPTS, WINDOW_SECONDS);
  if (!allowed) return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
  const { password } = await request.json();
  if (typeof password !== 'string' || !validPassword(password)) return NextResponse.json({ error: 'Senha inválida.' }, { status: 401 });
  await resetRateLimit(attemptsKey);
  const response = NextResponse.json({ ok: true });
  const isHttps = request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:';
  response.cookies.set('admin_session', sessionToken(), { httpOnly: true, sameSite: 'strict', secure: isHttps, path: '/', maxAge: 60 * 10 });
  return response;
}
