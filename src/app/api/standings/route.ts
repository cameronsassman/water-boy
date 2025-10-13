// app/api/standings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pool = searchParams.get('pool');

    // Get all teams in the specified pool
    const teams = await prisma.team.findMany({
      where: pool ? { poolAllocation: pool } : {},
      include: {
        players: {
          orderBy: { capNumber: 'asc' }
        },
        homeMatches: {
          include: {
            matchResult: true
          }
        },
        awayMatches: {
          include: {
            matchResult: true
          }
        }
      }
    });

    // Calculate standings for each team
    const standings = teams.map(team => {
      let played = 0;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      // Process home matches
      team.homeMatches.forEach(match => {
        if (match.matchResult && match.matchResult.completed) {
          played++;
          goalsFor += match.matchResult.homeScore;
          goalsAgainst += match.matchResult.awayScore;

          if (match.matchResult.homeScore > match.matchResult.awayScore) {
            won++;
          } else if (match.matchResult.homeScore === match.matchResult.awayScore) {
            drawn++;
          } else {
            lost++;
          }
        }
      });

      // Process away matches
      team.awayMatches.forEach(match => {
        if (match.matchResult && match.matchResult.completed) {
          played++;
          goalsFor += match.matchResult.awayScore;
          goalsAgainst += match.matchResult.homeScore;

          if (match.matchResult.awayScore > match.matchResult.homeScore) {
            won++;
          } else if (match.matchResult.awayScore === match.matchResult.homeScore) {
            drawn++;
          } else {
            lost++;
          }
        }
      });

      const goalDifference = goalsFor - goalsAgainst;
      const points = (won * 3) + drawn;

      return {
        team,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points
      };
    });

    // Sort standings by points, then goal difference, then goals for
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    return NextResponse.json({ standings });
  } catch (error) {
    console.error('Error calculating standings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}