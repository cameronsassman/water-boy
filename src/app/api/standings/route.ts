// app/api/standings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60; // Cache for 1 minute

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const pool = searchParams.get('pool');

    console.log(`[Standings] Starting calculation for pool: ${pool || 'all'}`);

    // SINGLE optimized query - no nested includes!
    const teams = await prisma.team.findMany({
      where: pool ? { poolAllocation: pool } : {},
      select: {
        id: true,
        schoolName: true,
        poolAllocation: true,
        teamLogo: true,
        coachName: true,
        // Only get match IDs and scores - no nested team data!
        homeMatches: {
          where: {
            matchResult: {
              completed: true
            }
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
            matchResult: {
              completed: true
            }
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

    console.log(`[Standings] Fetched ${teams.length} teams in ${Date.now() - startTime}ms`);

    // Calculate standings in memory (fast)
    const standings = teams.map(team => {
      let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

      // Process home matches
      team.homeMatches.forEach(match => {
        if (match.matchResult) {
          played++;
          goalsFor += match.matchResult.homeScore;
          goalsAgainst += match.matchResult.awayScore;

          if (match.matchResult.homeScore > match.matchResult.awayScore) won++;
          else if (match.matchResult.homeScore === match.matchResult.awayScore) drawn++;
          else lost++;
        }
      });

      // Process away matches
      team.awayMatches.forEach(match => {
        if (match.matchResult) {
          played++;
          goalsFor += match.matchResult.awayScore;
          goalsAgainst += match.matchResult.homeScore;

          if (match.matchResult.awayScore > match.matchResult.homeScore) won++;
          else if (match.matchResult.awayScore === match.matchResult.homeScore) drawn++;
          else lost++;
        }
      });

      const goalDifference = goalsFor - goalsAgainst;
      const points = (won * 3) + drawn;

      return {
        team: {
          id: team.id,
          schoolName: team.schoolName,
          poolAllocation: team.poolAllocation,
          teamLogo: team.teamLogo,
          coachName: team.coachName
        },
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

    const totalTime = Date.now() - startTime;
    console.log(`[Standings] Completed in ${totalTime}ms`);

    const headers = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    };

    return NextResponse.json({ standings }, { headers });
  } catch (error) {
    console.error('Error calculating standings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}