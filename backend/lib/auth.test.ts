import { beforeEach, describe, expect, test } from 'bun:test';
import { createHmac } from 'crypto';
import { validPassword } from './auth';

describe('validPassword', () => {
  beforeEach(() => {
    const testPassword = 'test-admin-password';
    const sessionSecret = 'test-session-secret-with-at-least-32-characters';
    process.env.ADMIN_SESSION_SECRET = sessionSecret;
    process.env.ADMIN_PASSWORD_HASH = createHmac('sha256', sessionSecret).update(testPassword).digest('hex');
  });

  test('accepts the configured password', () => {
    expect(validPassword('test-admin-password')).toBe(true);
  });

  test('rejects a different password', () => {
    expect(validPassword('senha-errada')).toBe(false);
  });

  test('fails closed when the session secret is missing', () => {
    delete process.env.ADMIN_SESSION_SECRET;
    expect(() => validPassword('test-admin-password')).toThrow('ADMIN_SESSION_SECRET');
  });
});
