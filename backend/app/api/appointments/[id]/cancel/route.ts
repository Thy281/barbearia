import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.query("UPDATE appointments SET status = 'NO_SHOW' WHERE id = $1", [id]);
  await cache.del('appointments');
  return NextResponse.json({ ok: true });
}
