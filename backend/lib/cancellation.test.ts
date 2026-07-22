import { describe, expect, test } from 'bun:test';
import { createCancellationToken, hashCancellationToken } from './cancellation';

describe('cancellation tokens', () => {
  test('creates a high-entropy token and a stable hash', () => {
    const token = createCancellationToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(hashCancellationToken(token)).toHaveLength(64);
    expect(hashCancellationToken(token)).toBe(hashCancellationToken(token));
  });
});
