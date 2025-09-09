import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const teams = await prisma.team.findMany({ include: { players: true } });
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const team = await prisma.team.create({
    data: {
      id: data.id,
      schoolName: data.schoolName,
      coachName: data.coachName,
      managerName: data.managerName,
      poolId: data.poolId || null,
      players: { create: data.players || [] }
    }
  });
  return NextResponse.json(team);
}
