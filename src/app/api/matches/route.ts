// app/api/matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day');
    const stage = searchParams.get('stage');
    const poolId = searchParams.get('poolId');
    const completed = searchParams.get('completed');

    const where: any = {};

    if (day) where.day = parseInt(day);
    if (stage) where.stage = stage;
    if (poolId) where.poolId = poolId;
    if (completed !== null) where.completed = completed === 'true';

    // Optimized query - don't load players unless specifically needed
    const matches = await prisma.match.findMany({
      where,
      select: {
        id: true,
        day: true,
        timeSlot: true,
        arena: true,
        stage: true,
        round: true,
        completed: true,
        homeTeam: {
          select: {
            id: true,
            schoolName: true,
            teamLogo: true,
            // Only load players if needed for team sheets
            players: {
              select: {
                id: true,
                name: true,
                capNumber: true
              },
              orderBy: { capNumber: 'asc' }
            }
          }
        },
        awayTeam: {
          select: {
            id: true,
            schoolName: true,
            teamLogo: true,
            players: {
              select: {
                id: true,
                name: true,
                capNumber: true
              },
              orderBy: { capNumber: 'asc' }
            }
          }
        },
        matchResult: {
          select: {
            id: true,
            homeScore: true,
            awayScore: true,
            completed: true
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { timeSlot: 'asc' },
        { arena: 'asc' }
      ]
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST remains the same - it's already optimized