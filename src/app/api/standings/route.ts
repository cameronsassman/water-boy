import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pool = searchParams.get('pool');

    // Get teams with optimized query
    const teams = await prisma.team.findMany({
      where: pool ? { poolAllocation: pool } : {},
      select: {
        id: true,
        schoolName: true,
        coachName: true,
        managerName: true,
        poolAllocation: true,
        teamLogo: true,
        players: {
          orderBy: { capNumber: 'asc' },
          select: {
            id: true,
            name: true,
            capNumber: true,
          }
        },
        homeMatches: {
          where: {
            matchResult: { completed: true }
          },
          select: {
            matchResult: {
              select: {
                homeScore: true,
                awayScore: true
              }
            }
          }
        },
        awayMatches: {
          where: {
            matchResult: { completed: true }
          },
          select: {
            matchResult: {
              select: {
                homeScore: true,
                awayScore: true
              }
            }
          }
        }
      }
    });

    // Calculate standings
    const standings = teams.map(team => {
      let played = 0;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      // Process home matches
      team.homeMatches.forEach(({ matchResult }) => {
        if (matchResult) {
          played++;
          goalsFor += matchResult.homeScore;
          goalsAgainst += matchResult.awayScore;

          if (matchResult.homeScore > matchResult.awayScore) {
            won++;
          } else if (matchResult.homeScore === matchResult.awayScore) {
            drawn++;
          } else {
            lost++;
          }
        }
      });

      // Process away matches
      team.awayMatches.forEach(({ matchResult }) => {
        if (matchResult) {
          played++;
          goalsFor += matchResult.awayScore;
          goalsAgainst += matchResult.homeScore;

          if (matchResult.awayScore > matchResult.homeScore) {
            won++;
          } else if (matchResult.awayScore === matchResult.homeScore) {
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

    // Sort standings
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