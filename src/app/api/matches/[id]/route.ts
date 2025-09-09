import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.pathname.split('/').slice(-1)[0];
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  return NextResponse.json(match);
}

export async function PUT(req: NextRequest) {
  const matchId = req.nextUrl.pathname.split('/').slice(-1)[0];
  const data = await req.json();
  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data
  });
  return NextResponse.json(updatedMatch);
}
