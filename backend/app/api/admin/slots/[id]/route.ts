import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
const headers = { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173', 'Access-Control-Allow-Methods': 'DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Credentials': 'true' };
export function OPTIONS() { return new NextResponse(null, { headers }); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401, headers });
  const { id } = await params;
  await db.query('DELETE FROM available_slots WHERE id = $1', [id]);
  return new NextResponse(null, { status: 204, headers });
}
