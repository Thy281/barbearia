import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { hashCancellationToken } from '@/lib/cancellation';

const partsFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.token !== 'string' || !body.token) return NextResponse.json({ error: 'Token de cancelamento inválido.' }, { status: 400 });
  const result = await db.query("UPDATE appointments SET status = 'NO_SHOW' WHERE id = $1 AND cancel_token_hash = $2 AND status = 'PENDING' RETURNING id, appointment_at", [id, hashCancellationToken(body.token)]);
  if (result.rowCount !== 1) return NextResponse.json({ error: 'Agendamento não encontrado ou não pode ser cancelado.' }, { status: 404 });
  const local = Object.fromEntries(partsFormatter.formatToParts(new Date(result.rows[0].appointment_at)).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  await db.query('DELETE FROM available_slots WHERE slot_date = $1 AND slot_time = $2', [`${local.year}-${local.month}-${local.day}`, `${local.hour}:${local.minute}`]);
  await cache.del('appointments');
  return NextResponse.json({ ok: true });
}
