import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { isAdmin } from '@/lib/auth';
const headers = { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173', 'Access-Control-Allow-Methods': 'PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Credentials': 'true' };
const partsFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export function OPTIONS() { return new NextResponse(null, { headers }); }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  const { status } = await request.json();
  if (!['PENDING', 'COMPLETED', 'NO_SHOW'].includes(status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400, headers });
  const { id } = await params;
  const prev = await db.query('SELECT appointment_at FROM appointments WHERE id = $1', [id]);
  const result = await db.query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  if (status === 'NO_SHOW' && prev.rows.length > 0) {
    const local = Object.fromEntries(partsFormatter.formatToParts(new Date(prev.rows[0].appointment_at)).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    await db.query('DELETE FROM available_slots WHERE slot_date = $1 AND slot_time = $2', [`${local.year}-${local.month}-${local.day}`, `${local.hour}:${local.minute}`]);
  }
  await cache.del('appointments');
  return NextResponse.json(result.rows[0], { headers });
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  const { id } = await params;
  const del = await db.query('DELETE FROM appointments WHERE id = $1 RETURNING appointment_at', [id]);
  if (del.rows.length > 0) {
    const local = Object.fromEntries(partsFormatter.formatToParts(new Date(del.rows[0].appointment_at)).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    await db.query('DELETE FROM available_slots WHERE slot_date = $1 AND slot_time = $2', [`${local.year}-${local.month}-${local.day}`, `${local.hour}:${local.minute}`]);
  }
  await cache.del('appointments');
  return new NextResponse(null, { status: 204, headers });
}
