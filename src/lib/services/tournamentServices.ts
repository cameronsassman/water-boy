import { prisma } from '@/lib/prisma'

export interface TeamStanding {
  team: any
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export class TournamentService {
  // Get pool standings
  static async getPoolStandings(poolId: string): Promise<TeamStanding[]> {
    const teams = await prisma.team.findMany({
      where: { poolId },
      include: {
        players: true,
        homeMatches: {
          include: { result: true }
        },
        awayMatches: {
          include: { result: true }
        }
      }
    })

    const standings: TeamStanding[] = []

    for (const team of teams) {
      const allMatches = [...team.homeMatches, ...team.awayMatches].filter(match => 
        match.completed && match.poolId === poolId
      )

      let played = 0
      let won = 0
      let drawn = 0
      let lost = 0
      let goalsFor = 0
      let goalsAgainst = 0

      for (const match of allMatches) {
        if (!match.result) continue
        
        played++
        
        const isHomeTeam = match.homeTeamId === team.id
        const teamScore = isHomeTeam ? match.result.homeScore : match.result.awayScore
        const opponentScore = isHomeTeam ? match.result.awayScore : match.result.homeScore

        goalsFor += teamScore
        goalsAgainst += opponentScore

        if (teamScore > opponentScore) won++
        else if (teamScore < opponentScore) lost++
        else drawn++
      }

      const goalDifference = goalsFor - goalsAgainst
      const points = (won * 3) + drawn

      standings.push({
        team,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points
      })
    }

    // Sort standings
    return standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference
      if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor
      return a.team.schoolName.localeCompare(b.team.schoolName)
    })
  }

  // Get player statistics
  static async getPlayerStats() {
    return await prisma.playerStat.groupBy({
      by: ['playerId'],
      _sum: {
        goals: true,
        kickOuts: true,
        yellowCards: true,
        redCards: true
      },
      _count: {
        matchId: true
      }
    })
  }

  // Generate pool fixtures
  static async generatePoolFixtures(poolId: string) {
    const teams = await prisma.team.findMany({
      where: { poolId }
    })

    const fixtures = []
    const timeSlots = this.getTimeSlots()

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          poolId,
          stage: 'POOL' as const
        })
      }
    }

    // Save fixtures to database
    for (const fixture of fixtures) {
      await prisma.match.create({
        data: fixture
      })
    }

    return fixtures
  }

  private static getTimeSlots() {
    // Your time slot logic here
    return ['08:00', '08:20', '08:40', '09:00', '09:20', '09:40']
  }
}