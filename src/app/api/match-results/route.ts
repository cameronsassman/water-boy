// app/api/match-results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache for GET requests (5 minutes)
export const revalidate = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, homeTeamId, awayTeamId, homeScore, awayScore, completed } = body;

    // Use upsert to avoid separate check + create/update
    const result = await prisma.matchResult.upsert({
      where: { matchId },
      update: {
        homeScore,
        awayScore,
        completed,
        updatedAt: new Date()
      },
      create: {
        matchId,
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        completed
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving match result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Optimized query - only select needed fields
    const result = await prisma.matchResult.findUnique({
      where: { matchId },
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        completed: true,
        match: {
          select: {
            id: true,
            day: true,
            timeSlot: true,
            arena: true,
            homeTeam: {
              select: {
                id: true,
                schoolName: true,
                teamLogo: true
              }
            },
            awayTeam: {
              select: {
                id: true,
                schoolName: true,
                teamLogo: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching match result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}