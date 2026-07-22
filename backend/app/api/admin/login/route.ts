import { NextRequest, NextResponse } from 'next/server';
import { sessionToken, validPassword } from '@/lib/auth';
import { cache } from '@/lib/cache';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-real-ip') ?? 'unknown';
  const attemptsKey = `admin-login:${clientIp}`;
  const attempts = await cache.incr(attemptsKey);
  if (attempts === 1) await cache.expire(attemptsKey, 60 * 15);
  if (attempts > MAX_ATTEMPTS) return NextResponse.json({ error: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
  const { password } = await request.json();
  if (typeof password !== 'string' || !validPassword(password)) return NextResponse.json({ error: 'Senha inválida.' }, { status: 401 });
  await cache.del(attemptsKey);
  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_session', sessionToken(), { httpOnly: true, sameSite: 'strict', secure: true, path: '/', maxAge: 60 * 60 * 8 });
  return response;
}
