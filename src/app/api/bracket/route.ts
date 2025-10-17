// app/api/bracket/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');

    const where: any = {
      stage: { in: ['cup', 'plate', 'shield', 'playoff'] }
    };

    if (stage) {
      where.stage = stage;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        matchResult: true
      },
      orderBy: [
        { stage: 'asc' },
        { day: 'asc' },
        { timeSlot: 'asc' }
      ]
    });

    // Organize matches for bracket display
    const bracketMatches = matches.map(match => ({
      ...match,
      homeScore: match.matchResult?.homeScore || 0,
      awayScore: match.matchResult?.awayScore || 0,
      completed: match.matchResult?.completed || false
    }));

    return NextResponse.json(bracketMatches);
  } catch (error) {
    console.error('Error fetching bracket matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}