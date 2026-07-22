import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { isAdmin } from '@/lib/auth';

const headers = { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Credentials': 'true' };
export function OPTIONS() { return new NextResponse(null, { headers }); }
const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
export async function POST(request: NextRequest) {
  const { name, phone, service, appointmentAt } = await request.json();
  if (![name, phone, service, appointmentAt].every(value => typeof value === 'string' && value.trim())) return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400, headers });
  if (!phoneRegex.test(phone.trim())) return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400, headers });
  const date = new Date(appointmentAt);
  if (Number.isNaN(date.valueOf()) || date <= new Date()) return NextResponse.json({ error: 'Escolha um horário futuro.' }, { status: 400, headers });
  const result = await db.query('INSERT INTO appointments (customer_name, phone, service, appointment_at) VALUES ($1, $2, $3, $4) RETURNING *', [name.trim(), phone.trim(), service, date]);
  await cache.del('appointments');
  return NextResponse.json(result.rows[0], { status: 201, headers });
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
