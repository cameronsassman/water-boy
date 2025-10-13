import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchResultId, playerId, capNumber, goals, kickOuts, yellowCards, redCards } = body;

    // Check if stats already exist
    const existingStats = await prisma.playerStats.findUnique({
      where: {
        matchResultId_playerId: {
          matchResultId,
          playerId
        }
      }
    });

    let stats;
    if (existingStats) {
      // Update existing stats
      stats = await prisma.playerStats.update({
        where: { id: existingStats.id },
        data: {
          goals,
          kickOuts,
          yellowCards,
          redCards
        }
      });
    } else {
      // Create new stats
      stats = await prisma.playerStats.create({
        data: {
          matchResultId,
          playerId,
          capNumber,
          goals,
          kickOuts,
          yellowCards,
          redCards
        }
      });
    }

    return NextResponse.json(stats, { status: 201 });
  } catch (error) {
    console.error('Error saving player stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchResultId = searchParams.get('matchResultId');

    if (!matchResultId) {
      return NextResponse.json(
        { error: 'Match Result ID is required' },
        { status: 400 }
      );
    }

    const stats = await prisma.playerStats.findMany({
      where: { matchResultId },
      include: {
        player: true
      }
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}