import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { isAdmin } from '@/lib/auth';
const headers = { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173', 'Access-Control-Allow-Methods': 'PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Credentials': 'true' };
export function OPTIONS() { return new NextResponse(null, { headers }); }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  const { status } = await request.json();
  if (!['PENDING', 'COMPLETED', 'NO_SHOW'].includes(status)) return NextResponse.json({ error: 'Status inválido.' }, { status: 400, headers });
  const { id } = await params;
  const result = await db.query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  await cache.del('appointments');
  return NextResponse.json(result.rows[0], { headers });
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  const { id } = await params;
  await db.query('DELETE FROM appointments WHERE id = $1', [id]);
  await cache.del('appointments');
  return new NextResponse(null, { status: 204, headers });
}
