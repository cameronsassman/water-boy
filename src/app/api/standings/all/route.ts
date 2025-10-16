import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const poolIds = ['A', 'B', 'C', 'D'];
    
    // Simple debug version - get everything and log it
    const teams = await prisma.team.findMany({
      where: {
        poolAllocation: { in: poolIds }
      },
      include: {
        players: true,
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

    // Log what we found
    console.log('=== DEBUG TEAM DATA ===');
    teams.forEach(team => {
      console.log(`Team: ${team.schoolName} (Pool ${team.poolAllocation})`);
      console.log(`  Home matches: ${team.homeMatches.length}`);
      console.log(`  Away matches: ${team.awayMatches.length}`);
      
      const completedHome = team.homeMatches.filter(m => m.matchResult?.completed);
      const completedAway = team.awayMatches.filter(m => m.matchResult?.completed);
      
      console.log(`  Completed home: ${completedHome.length}`);
      console.log(`  Completed away: ${completedAway.length}`);
      
      completedHome.forEach(match => {
        console.log(`    Home match: ${match.matchResult?.homeScore}-${match.matchResult?.awayScore}`);
      });
      completedAway.forEach(match => {
        console.log(`    Away match: ${match.matchResult?.awayScore}-${match.matchResult?.homeScore}`);
      });
    });

    // Calculate standings (simple version)
    const standings: { [key: string]: any[] } = {};
    const completionStatus: { [key: string]: boolean } = {};
    const teamCounts: { [key: string]: number } = {};

    for (const poolId of poolIds) {
      const poolTeams = teams.filter(team => team.poolAllocation === poolId);
      teamCounts[poolId] = poolTeams.length;

      const poolStandings = poolTeams.map(team => {
        let played = 0;
        let won = 0;
        let drawn = 0;
        let lost = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;

        // Home matches
        team.homeMatches.forEach(match => {
          if (match.matchResult?.completed) {
            played++;
            goalsFor += match.matchResult.homeScore;
            goalsAgainst += match.matchResult.awayScore;

            if (match.matchResult.homeScore > match.matchResult.awayScore) won++;
            else if (match.matchResult.homeScore === match.matchResult.awayScore) drawn++;
            else lost++;
          }
        });

        // Away matches
        team.awayMatches.forEach(match => {
          if (match.matchResult?.completed) {
            played++;
            goalsFor += match.matchResult.awayScore;
            goalsAgainst += match.matchResult.homeScore;

            if (match.matchResult.awayScore > match.matchResult.homeScore) won++;
            else if (match.matchResult.awayScore === match.matchResult.homeScore) drawn++;
            else lost++;
          }
        });

        const points = (won * 3) + drawn;
        const goalDifference = goalsFor - goalsAgainst;

        console.log(`Standings for ${team.schoolName}: P${played} W${won} D${drawn} L${lost} GF${goalsFor} GA${goalsAgainst} GD${goalDifference} PTS${points}`);

        return {
          team: {
            id: team.id,
            schoolName: team.schoolName,
            coachName: team.coachName,
            managerName: team.managerName,
            poolAllocation: team.poolAllocation,
            teamLogo: team.teamLogo,
            players: team.players
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

      poolStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      standings[poolId] = poolStandings;
      completionStatus[poolId] = await checkPoolCompletion(poolId);
    }

    return NextResponse.json({
      standings,
      completionStatus,
      teamCounts,
      totalTeams: teams.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in standings/all API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings data' },
      { status: 500 }
    );
  }
}

async function checkPoolCompletion(poolId: string): Promise<boolean> {
  try {
    const [totalMatches, completedMatches] = await Promise.all([
      prisma.match.count({
        where: { poolId, stage: 'POOL' }
      }),
      prisma.match.count({
        where: { 
          poolId, 
          stage: 'POOL',
          matchResult: { completed: true }
        }
      })
    ]);

    return totalMatches > 0 && totalMatches === completedMatches;
  } catch (error) {
    return false;
  }
}