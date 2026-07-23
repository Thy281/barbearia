import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { isAdmin } from '@/lib/auth';
import { createCancellationToken, hashCancellationToken } from '@/lib/cancellation';

const headers = { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Credentials': 'true' };
export function OPTIONS() { return new NextResponse(null, { headers }); }
const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
const services = new Set(['Corte clássico', 'Corte + barba', 'Barba completa', 'Pezinho']);
const partsFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400, headers });
  const { name, phone, service, appointmentAt } = body;
  if (![name, phone, service, appointmentAt].every(value => typeof value === 'string' && value.trim())) return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400, headers });
  if (!phoneRegex.test(phone.trim())) return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400, headers });
  const date = new Date(appointmentAt);
  if (Number.isNaN(date.valueOf()) || date <= new Date()) return NextResponse.json({ error: 'Escolha um horário futuro.' }, { status: 400, headers });
  if (!services.has(service)) return NextResponse.json({ error: 'Serviço inválido.' }, { status: 400, headers });
  const local = Object.fromEntries(partsFormatter.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  const slotDate = `${local.year}-${local.month}-${local.day}`;
  const slotTime = `${local.hour}:${local.minute}`;
  const minutes = Number(local.hour) * 60 + Number(local.minute);
  if (Number(local.minute) % 30 !== 0 || minutes < 420 || minutes > 1320) return NextResponse.json({ error: 'Horário indisponível.' }, { status: 400, headers });
  const blocked = await db.query('SELECT EXISTS (SELECT 1 FROM available_slots WHERE slot_date = $1 AND slot_time = $2) AS blocked', [slotDate, slotTime]);
  if (blocked.rows[0].blocked) return NextResponse.json({ error: 'Horário indisponível.' }, { status: 409, headers });
  const cancellationToken = createCancellationToken();
  let result;
  try { result = await db.query('INSERT INTO appointments (customer_name, phone, service, appointment_at, cancel_token_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, customer_name, phone, service, appointment_at, status, created_at', [name.trim(), phone.trim(), service, date, hashCancellationToken(cancellationToken)]); }
  catch (error: unknown) { if ((error as { code?: string }).code === '23505') return NextResponse.json({ error: 'Este horário acabou de ser reservado.' }, { status: 409, headers }); throw error; }
  await db.query('INSERT INTO available_slots (slot_date, slot_time) VALUES ($1, $2) ON CONFLICT DO NOTHING', [slotDate, slotTime]);
  await cache.del('appointments');
  return NextResponse.json({ ...result.rows[0], cancellationToken }, { status: 201, headers });
}
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  const cached = await cache.get('appointments');
  if (cached) return new NextResponse(cached, { headers: { ...headers, 'Content-Type': 'application/json' } });
  const result = await db.query('SELECT * FROM appointments ORDER BY appointment_at ASC');
  const body = JSON.stringify(result.rows);
  await cache.set('appointments', body, 'EX', 30);
  return new NextResponse(body, { headers: { ...headers, 'Content-Type': 'application/json' } });
}
