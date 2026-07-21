import { beforeEach, describe, expect, test } from 'bun:test';
import { createHmac } from 'crypto';
import { validPassword } from './auth';

describe('validPassword', () => {
  beforeEach(() => {
    const testPassword = 'test-admin-password';
    process.env.ADMIN_SESSION_SECRET = 'test-secret';
    process.env.ADMIN_PASSWORD_HASH = createHmac('sha256', 'test-secret').update(testPassword).digest('hex');
  });

  test('accepts the configured password', () => {
    expect(validPassword('test-admin-password')).toBe(true);
  });

  test('rejects a different password', () => {
    expect(validPassword('senha-errada')).toBe(false);
  });
});
