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
    try {
      const teams = await prisma.team.findMany({
        where: { 
          poolAllocation: poolId
        },
        include: {
          players: true,
          homeMatches: {
            include: { 
              result: true,
              homeTeam: true,
              awayTeam: true
            }
          },
          awayMatches: {
            include: { 
              result: true,
              homeTeam: true,
              awayTeam: true
            }
          }
        }
      })

      const standings: TeamStanding[] = []

      for (const team of teams) {
        // Combine home and away matches, filtering for completed pool matches
        const allMatches = [
          ...(team.homeMatches || []).filter(match => 
            match?.completed && 
            match.poolAllocation === poolId &&
            match.result
          ),
          ...(team.awayMatches || []).filter(match => 
            match?.completed && 
            match.poolAllocation === poolId &&
            match.result
          )
        ]

        let played = 0
        let won = 0
        let drawn = 0
        let lost = 0
        let goalsFor = 0
        let goalsAgainst = 0

        for (const match of allMatches) {
          if (!match?.result) continue
          
          played++
          
          const isHomeTeam = match.homeTeamId === team.id
          const teamScore = isHomeTeam ? (match.result.homeScore || 0) : (match.result.awayScore || 0)
          const opponentScore = isHomeTeam ? (match.result.awayScore || 0) : (match.result.homeScore || 0)

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
        return (a.team.schoolName || '').localeCompare(b.team.schoolName || '')
      })
    } catch (error) {
      console.error('Error getting pool standings:', error)
      throw new Error(`Failed to get pool standings for pool ${poolId}`)
    }
  }

  // Get player statistics
  static async getPlayerStats() {
    try {
      return await prisma.playerStat.findMany({
        include: {
          player: {
            include: {
              team: true
            }
          },
          match: true
        }
      })
    } catch (error) {
      console.error('Error getting player stats:', error)
      throw new Error('Failed to get player statistics')
    }
  }

  // Generate pool fixtures
  static async generatePoolFixtures(poolId: string) {
    try {
      const teams = await prisma.team.findMany({
        where: { 
          poolAllocation: poolId
        }
      })

      if (teams.length === 0) {
        throw new Error(`No teams found for pool ${poolId}`)
      }

      if (teams.length < 2) {
        throw new Error(`Need at least 2 teams in pool ${poolId} to generate fixtures`)
      }

      const fixtures = []
      const usedMatchIds = new Set<string>()

      // Generate round-robin fixtures
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const homeTeam = teams[i]
          const awayTeam = teams[j]
          
          if (!homeTeam?.id || !awayTeam?.id) continue
          
          // Create unique match ID
          const matchId = `${poolId}-${homeTeam.id}-${awayTeam.id}`
          
          if (!usedMatchIds.has(matchId)) {
            fixtures.push({
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              poolAllocation: poolId,
              stage: 'POOL' as const,
              day: 1, // Default to day 1
              timeSlot: '08:00', // Default time slot
              arena: 1, // Default arena
              completed: false
            })
            usedMatchIds.add(matchId)
          }
        }
      }

      if (fixtures.length === 0) {
        throw new Error(`No fixtures generated for pool ${poolId}`)
      }

      // Save fixtures to database
      const createdMatches = []
      for (const fixture of fixtures) {
        try {
          // Check if match already exists
          const existingMatch = await prisma.match.findFirst({
            where: {
              homeTeamId: fixture.homeTeamId,
              awayTeamId: fixture.awayTeamId,
              poolAllocation: poolId,
              stage: 'POOL'
            }
          })

          if (!existingMatch) {
            const match = await prisma.match.create({
              data: fixture
            })
            createdMatches.push(match)
          }
        } catch (error) {
          console.error(`Failed to create match: ${fixture.homeTeamId} vs ${fixture.awayTeamId}`, error)
          // Continue with other matches even if one fails
        }
      }

      return createdMatches
    } catch (error) {
      console.error('Error generating pool fixtures:', error)
      throw new Error(`Failed to generate fixtures for pool ${poolId}`)
    }
  }

  // Get all pool standings
  static async getAllPoolStandings(): Promise<{ [poolId: string]: TeamStanding[] }> {
    try {
      const pools = ['A', 'B', 'C', 'D']
      const allStandings: { [poolId: string]: TeamStanding[] } = {}

      for (const poolId of pools) {
        try {
          allStandings[poolId] = await this.getPoolStandings(poolId)
        } catch (error) {
          console.error(`Error getting standings for pool ${poolId}:`, error)
          allStandings[poolId] = []
        }
      }

      return allStandings
    } catch (error) {
      console.error('Error getting all pool standings:', error)
      throw new Error('Failed to get all pool standings')
    }
  }

  // Check if pool stage is complete
  static async isPoolStageComplete(poolId?: string): Promise<boolean> {
    try {
      if (poolId) {
        const matches = await prisma.match.findMany({
          where: {
            poolAllocation: poolId,
            stage: 'POOL'
          }
        })
        
        if (matches.length === 0) return false
        return matches.every(match => match?.completed === true)
      }

      // Check all pools
      const pools = ['A', 'B', 'C', 'D']
      for (const pool of pools) {
        const isComplete = await this.isPoolStageComplete(pool)
        if (!isComplete) return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking pool stage completion:', error)
      return false
    }
  }

  // Get pool qualifiers (top 4 teams)
  static async getPoolQualifiers(poolId: string): Promise<any[]> {
    try {
      const standings = await this.getPoolStandings(poolId)
      return standings.slice(0, 4).map(standing => standing.team)
    } catch (error) {
      console.error(`Error getting qualifiers for pool ${poolId}:`, error)
      throw new Error(`Failed to get pool qualifiers for pool ${poolId}`)
    }
  }

  // Get pool non-qualifiers (remaining teams)
  static async getPoolNonQualifiers(poolId: string): Promise<any[]> {
    try {
      const standings = await this.getPoolStandings(poolId)
      return standings.slice(4).map(standing => standing.team)
    } catch (error) {
      console.error(`Error getting non-qualifiers for pool ${poolId}:`, error)
      throw new Error(`Failed to get pool non-qualifiers for pool ${poolId}`)
    }
  }

  // Get tournament statistics
  static async getTournamentStats() {
    try {
      const totalMatches = await prisma.match.count()
      const completedMatches = await prisma.match.count({
        where: { completed: true }
      })
      const totalTeams = await prisma.team.count()

      const matchResults = await prisma.matchResult.findMany({
        where: { match: { completed: true } }
      })

      const totalGoals = matchResults.reduce((total, result) => {
        return total + (result.homeScore || 0) + (result.awayScore || 0)
      }, 0)

      const averageGoalsPerMatch = completedMatches > 0 
        ? (totalGoals / completedMatches).toFixed(1)
        : '0.0'

      return {
        totalMatches,
        completedMatches,
        pendingMatches: totalMatches - completedMatches,
        totalTeams,
        totalGoals,
        averageGoalsPerMatch: parseFloat(averageGoalsPerMatch)
      }
    } catch (error) {
      console.error('Error getting tournament stats:', error)
      throw new Error('Failed to get tournament statistics')
    }
  }

  // Clear pool matches
  static async clearPoolMatches(poolId?: string) {
    try {
      const whereCondition = poolId 
        ? {
            poolAllocation: poolId,
            stage: 'POOL'
          }
        : { stage: 'POOL' }

      await prisma.match.deleteMany({
        where: whereCondition
      })

      return { success: true, message: poolId ? `Cleared matches for pool ${poolId}` : 'Cleared all pool matches' }
    } catch (error) {
      console.error('Error clearing pool matches:', error)
      throw new Error('Failed to clear pool matches')
    }
  }

  // Get teams by pool
  static async getTeamsByPool(poolId: string) {
    try {
      return await prisma.team.findMany({
        where: {
          poolAllocation: poolId
        },
        include: {
          players: true
        }
      })
    } catch (error) {
      console.error(`Error getting teams for pool ${poolId}:`, error)
      throw new Error(`Failed to get teams for pool ${poolId}`)
    }
  }

  // Check if pools are allocated
  static async arePoolsAllocated(): Promise<boolean> {
    try {
      const teamsWithPools = await prisma.team.count({
        where: {
          poolAllocation: {
            not: null
          }
        }
      })
      return teamsWithPools > 0
    } catch (error) {
      console.error('Error checking pool allocation:', error)
      return false
    }
  }

  private static getTimeSlots(): string[] {
    return [
      '08:00', '08:20', '08:40', 
      '09:00', '09:20', '09:40',
      '10:00', '10:20', '10:40',
      '11:00', '11:20', '11:40',
      '12:00', '12:20', '12:40'
    ]
  }
}