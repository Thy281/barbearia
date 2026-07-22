import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

const secret = () => {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('ADMIN_SESSION_SECRET deve ter ao menos 32 caracteres.');
  return value;
};
export function validPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD_HASH;
  if (!expected) return false;
  const candidate = createHmac('sha256', secret()).update(password).digest('hex');
  return candidate.length === expected.length && timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}
export function sessionToken() { return createHmac('sha256', secret()).update('barbearia-admin').digest('hex'); }
export function isAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  return Boolean(token && token === sessionToken());
}
