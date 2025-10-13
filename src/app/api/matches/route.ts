import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeTeamId, awayTeamId, poolId, stage, day, timeSlot, arena, round } = body;

    console.log('Creating match:', { homeTeamId, awayTeamId, poolId, stage, day, timeSlot, arena });

    // Validate teams exist
    const homeTeam = await prisma.team.findUnique({ where: { id: homeTeamId } });
    const awayTeam = await prisma.team.findUnique({ where: { id: awayTeamId } });

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 }
      );
    }

    // Check if teams are the same
    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        { error: 'Home and away teams cannot be the same' },
        { status: 400 }
      );
    }

    // For pool stage, validate teams are in the same pool
    if (stage === 'pool' && homeTeam.poolAllocation !== awayTeam.poolAllocation) {
      return NextResponse.json(
        { error: 'Teams must be in the same pool for pool stage matches' },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        poolId: stage === 'pool' ? poolId : null,
        stage,
        day,
        timeSlot,
        arena,
        round: round || null,
        completed: false
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    });

    console.log('Match created successfully:', match.id);
    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: {
          include: {
            players: {
              orderBy: { capNumber: 'asc' }
            }
          }
        },
        awayTeam: {
          include: {
            players: {
              orderBy: { capNumber: 'asc' }
            }
          }
        },
        matchResult: true
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