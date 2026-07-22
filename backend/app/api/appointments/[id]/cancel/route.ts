import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { hashCancellationToken } from '@/lib/cancellation';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.token !== 'string' || !body.token) return NextResponse.json({ error: 'Token de cancelamento inválido.' }, { status: 400 });
  const result = await db.query("UPDATE appointments SET status = 'NO_SHOW' WHERE id = $1 AND cancel_token_hash = $2 AND status = 'PENDING' RETURNING id", [id, hashCancellationToken(body.token)]);
  if (result.rowCount !== 1) return NextResponse.json({ error: 'Agendamento não encontrado ou não pode ser cancelado.' }, { status: 404 });
  await cache.del('appointments');
  return NextResponse.json({ ok: true });
}
