import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.pathname.split('/').slice(-1)[0];
  const result = await prisma.matchResult.findUnique({ where: { matchId } });
  if (!result) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  return NextResponse.json(result);
}
