import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
const headers = { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Credentials': 'true' };
export function OPTIONS() { return new NextResponse(null, { headers }); }
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  const date = request.nextUrl.searchParams.get('date');
  const month = request.nextUrl.searchParams.get('month');
  if (date) {
    const r = await db.query("SELECT id, slot_date::text AS slot_date, slot_time FROM available_slots WHERE slot_date = $1 ORDER BY slot_time", [date]);
    return NextResponse.json(r.rows, { headers });
  }
  if (month) {
    const start = month + '-01';
    const endDate = new Date(new Date(start + 'T12:00:00-03:00').getTime());
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().slice(0, 10);
    const r = await db.query("SELECT id, slot_date::text AS slot_date, slot_time FROM available_slots WHERE slot_date >= $1 AND slot_date < $2 ORDER BY slot_date, slot_time", [start, end]);
    return NextResponse.json(r.rows, { headers });
  }
  return NextResponse.json({ error: 'Informe ?date= ou ?month=.' }, { status: 400, headers });
}
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  const { slot_date, slot_time } = await request.json();
  if (typeof slot_date !== 'string' || typeof slot_time !== 'string') return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400, headers });
  const result = await db.query('INSERT INTO available_slots (slot_date, slot_time) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *', [slot_date, slot_time]);
  if (!result.rows.length) return NextResponse.json({ error: 'Horário já existe.' }, { status: 409, headers });
  return NextResponse.json(result.rows[0], { status: 201, headers });
}
