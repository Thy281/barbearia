import { createHash, randomBytes } from 'crypto';

export function createCancellationToken() { return randomBytes(48).toString('base64url'); }
export function hashCancellationToken(token: string) { return createHash('sha512').update(token).digest('hex'); }
