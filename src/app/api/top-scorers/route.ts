// app/api/top-scorers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Single query for total goals
    const totalGoals = await prisma.playerStats.aggregate({
      _sum: { goals: true }
    });

    // Single optimized query for top scorers with team data
    const topScorers = await prisma.playerStats.groupBy({
      by: ['playerId'],
      _sum: { goals: true },
      orderBy: { _sum: { goals: 'desc' } },
      take: limit,
    });

    if (topScorers.length === 0) {
      return NextResponse.json({
        scorers: [],
        totalGoals: 0
      });
    }

    // Single query for player and team data
    const players = await prisma.player.findMany({
      where: { 
        id: { in: topScorers.map(s => s.playerId) } 
      },
      select: {
        id: true,
        name: true,
        capNumber: true,
        team: {
          select: {
            schoolName: true,
            teamLogo: true
          }
        }
      }
    });

    const playerMap = new Map(players.map(p => [p.id, p]));
    
    const scorers = topScorers.map(scorer => {
      const player = playerMap.get(scorer.playerId);
      return {
        playerId: scorer.playerId,
        name: player?.name || 'Unknown',
        capNumber: player?.capNumber || 0,
        totalGoals: scorer._sum.goals || 0,
        team: player?.team || { schoolName: 'Unknown', teamLogo: null }
      };
    });

    return NextResponse.json({
      scorers,
      totalGoals: totalGoals._sum.goals || 0
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { scorers: [], totalGoals: 0 },
      { status: 500 }
    );
  }
}