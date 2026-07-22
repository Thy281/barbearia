import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Informe uma data (?date=YYYY-MM-DD).' }, { status: 400 });
  if (Number.isNaN(new Date(date + 'T12:00:00-03:00').valueOf())) return NextResponse.json({ error: 'Data inválida.' }, { status: 400 });
  const allTimes = Array.from({length:31},(_,i)=>{const h=7+Math.floor(i/2);const m=i%2*30;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')});
  const blocked = await db.query("SELECT slot_time FROM available_slots WHERE slot_date = $1", [date]);
  const blockedSet = new Set(blocked.rows.map((r:{slot_time:string}) => r.slot_time.slice(0,5)));
  const booked = await db.query("SELECT appointment_at FROM appointments WHERE appointment_at::date = $1 AND status != 'NO_SHOW'", [date]);
  const bookedSet = new Set(booked.rows.map((r:{appointment_at:string}) => new Date(r.appointment_at).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false })));
  return NextResponse.json(allTimes.filter(t => !blockedSet.has(t) && !bookedSet.has(t)).map(t => ({ slot_time: t })));
}
