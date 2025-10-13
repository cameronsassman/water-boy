import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, homeScore, awayScore, completed } = body;

    // Check if result already exists
    const existingResult = await prisma.matchResult.findUnique({
      where: { matchId }
    });

    let result;
    if (existingResult) {
      // Update existing result
      result = await prisma.matchResult.update({
        where: { id: existingResult.id },
        data: {
          homeScore,
          awayScore,
          completed
        }
      });
    } else {
      // Create new result - only include fields that exist in MatchResult model
      result = await prisma.matchResult.create({
        data: {
          matchId,
          homeScore,
          awayScore,
          completed
        }
      });
    }

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

    const result = await prisma.matchResult.findUnique({
      where: { matchId }
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