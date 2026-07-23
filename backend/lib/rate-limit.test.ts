import { describe, expect, test, mock, beforeEach } from 'bun:test';

const mockIncr = mock<(key: string) => Promise<number>>();
const mockExpire = mock<(key: string, seconds: number) => Promise<number>>();
const mockDel = mock<(key: string) => Promise<number>>();

mock.module('./cache', () => ({
  cache: { incr: mockIncr, expire: mockExpire, del: mockDel },
}));

const { checkRateLimit, resetRateLimit, extractClientIp } = await import('./rate-limit');

function mockRequest(headers: Record<string, string>): any {
  return { headers: { get(name: string) { return headers[name] ?? null; } } };
}

beforeEach(() => {
  mockIncr.mockClear();
  mockIncr.mockResolvedValue(1);
  mockExpire.mockClear();
  mockExpire.mockResolvedValue(1);
  mockDel.mockClear();
  mockDel.mockResolvedValue(1);
});

describe('checkRateLimit', () => {
  test('allows request when under the limit', async () => {
    mockIncr.mockResolvedValue(1);
    const result = await checkRateLimit('test-key', 5, 900);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(mockIncr).toHaveBeenCalledWith('test-key');
  });

  test('sets TTL on first attempt', async () => {
    mockIncr.mockResolvedValue(1);
    await checkRateLimit('test-key', 5, 900);
    expect(mockExpire).toHaveBeenCalledWith('test-key', 900);
  });

  test('does not set TTL after first attempt', async () => {
    mockIncr.mockResolvedValue(3);
    await checkRateLimit('test-key', 5, 900);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  test('blocks when exceeding max attempts', async () => {
    mockIncr.mockResolvedValue(6);
    const result = await checkRateLimit('test-key', 5, 900);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('returns correct remaining count', async () => {
    mockIncr.mockResolvedValue(3);
    const result = await checkRateLimit('test-key', 5, 900);
    expect(result.remaining).toBe(2);
  });

  test('allows request when at exactly max attempts', async () => {
    mockIncr.mockResolvedValue(5);
    const result = await checkRateLimit('test-key', 5, 900);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  test('recovers after window expiry', async () => {
    mockIncr.mockResolvedValueOnce(6).mockResolvedValueOnce(1);
    const first = await checkRateLimit('test-key', 5, 900);
    expect(first.allowed).toBe(false);
    const second = await checkRateLimit('test-key', 5, 900);
    expect(second.allowed).toBe(true);
  });

  test('allows request when Redis fails', async () => {
    mockIncr.mockRejectedValue(new Error('Redis connection failed'));
    const result = await checkRateLimit('test-key', 5, 900);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });
});

describe('resetRateLimit', () => {
  test('deletes the rate limit key', async () => {
    mockDel.mockResolvedValue(1);
    await resetRateLimit('test-key');
    expect(mockDel).toHaveBeenCalledWith('test-key');
  });

  test('does not throw on Redis error', async () => {
    mockDel.mockRejectedValue(new Error('Redis error'));
    await expect(resetRateLimit('test-key')).resolves.toBeUndefined();
  });
});

describe('extractClientIp', () => {
  test('extracts IP from x-forwarded-for (first proxy)', () => {
    const req = mockRequest({ 'x-forwarded-for': '200.201.202.203, 10.0.0.1' });
    expect(extractClientIp(req)).toBe('200.201.202.203');
  });

  test('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = mockRequest({ 'x-real-ip': '192.168.1.1' });
    expect(extractClientIp(req)).toBe('192.168.1.1');
  });

  test('uses unknown when no IP headers present', () => {
    const req = mockRequest({});
    expect(extractClientIp(req)).toBe('unknown');
  });

  test('prefers x-forwarded-for over x-real-ip', () => {
    const req = mockRequest({
      'x-forwarded-for': '200.201.202.203',
      'x-real-ip': '192.168.1.1',
    });
    expect(extractClientIp(req)).toBe('200.201.202.203');
  });

  test('handles single IP in x-forwarded-for', () => {
    const req = mockRequest({ 'x-forwarded-for': '200.201.202.203' });
    expect(extractClientIp(req)).toBe('200.201.202.203');
  });

  test('trims whitespace from forwarded IP', () => {
    const req = mockRequest({ 'x-forwarded-for': '  200.201.202.203  ' });
    expect(extractClientIp(req)).toBe('200.201.202.203');
  });

  test('handles IPv6 in x-forwarded-for', () => {
    const req = mockRequest({ 'x-forwarded-for': '::1' });
    expect(extractClientIp(req)).toBe('::1');
  });

  test('handles empty x-forwarded-for', () => {
    const req = mockRequest({ 'x-forwarded-for': '' });
    expect(extractClientIp(req)).toBe('unknown');
  });

  test('handles comma-separated IPv6 addresses', () => {
    const req = mockRequest({ 'x-forwarded-for': '2001:db8::1, 10.0.0.1' });
    expect(extractClientIp(req)).toBe('2001:db8::1');
  });
});
