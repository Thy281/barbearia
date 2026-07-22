import { createHash, randomBytes } from 'crypto';

export function createCancellationToken() { return randomBytes(32).toString('base64url'); }
export function hashCancellationToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
