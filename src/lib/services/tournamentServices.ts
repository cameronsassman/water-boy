// src/lib/services/tournamentServices.ts
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
  // Simple method that definitely works
  static async getPoolStandings(poolId: string): Promise<TeamStanding[]> {
    try {
      const teams = await prisma.team.findMany({
        where: { 
          poolAllocation: poolId
        },
        include: {
          players: true
        }
      })

      // Return basic standings without complex calculations for now
      return teams.map(team => ({
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      }))
    } catch (error) {
      console.error('Error getting pool standings:', error)
      return []
    }
  }

  // Simple tournament stats
  static async getTournamentStats() {
    try {
      const totalMatches = await prisma.match.count().catch(() => 0)
      const completedMatches = await prisma.match.count({
        where: { completed: true }
      }).catch(() => 0)
      const totalTeams = await prisma.team.count().catch(() => 0)

      return {
        totalMatches,
        completedMatches,
        pendingMatches: totalMatches - completedMatches,
        totalTeams,
        totalGoals: 0,
        averageGoalsPerMatch: 0
      }
    } catch (error) {
      return {
        totalMatches: 0,
        completedMatches: 0,
        pendingMatches: 0,
        totalTeams: 0,
        totalGoals: 0,
        averageGoalsPerMatch: 0
      }
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
      return []
    }
  }

  // Get all pool standings
  static async getAllPoolStandings() {
    try {
      const pools = ['A', 'B', 'C', 'D']
      const allStandings: { [poolId: string]: TeamStanding[] } = {}

      for (const poolId of pools) {
        allStandings[poolId] = await this.getPoolStandings(poolId)
      }

      return allStandings
    } catch (error) {
      return { A: [], B: [], C: [], D: [] }
    }
  }
}