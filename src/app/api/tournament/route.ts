import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const teams = await prisma.team.findMany({
    include: { players: true, poolTeams: true }
  });
  const pools = await prisma.pool.findMany({
    include: { poolTeams: { include: { team: true } } }
  });
  const matches = await prisma.match.findMany();

  return NextResponse.json({ teams, pools, matches });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  // Optional: handle creating tournament data in bulk
  return NextResponse.json({ message: 'Tournament saved', data });
}
