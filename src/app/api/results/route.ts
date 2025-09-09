import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const results = await prisma.matchResult.findMany();
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const result = await prisma.matchResult.upsert({
    where: { matchId: data.matchId },
    update: {
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      completed: data.completed
    },
    create: {
      matchId: data.matchId,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      completed: data.completed
    }
  });
  return NextResponse.json(result);
}
