export type Match = {
    homeTeam: string;
    awayTeam: string;
    homeGoals: number;
    awayGoals: number;
    pool: string;
  };
  
  export type TeamStats = {
    team: string;
    wins: number;
    draws: number;
    losses: number;
    gamesPlayed: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  };
  
  export function calculateStandings(matches: Match[]): Record<string, TeamStats[]> {
    const standings: Record<string, Record<string, TeamStats>> = {};
  
    matches.forEach(({ homeTeam, awayTeam, homeGoals, awayGoals, pool }) => {
      if (!standings[pool]) standings[pool] = {};
  
      const teamStats = (name: string) => {
        if (!standings[pool][name]) {
          standings[pool][name] = {
            team: name,
            wins: 0,
            draws: 0,
            losses: 0,
            gamesPlayed: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          };
        }
        return standings[pool][name];
      };
  
      const home = teamStats(homeTeam);
      const away = teamStats(awayTeam);
  
      home.gamesPlayed++;
      away.gamesPlayed++;
  
      home.goalsFor += homeGoals;
      home.goalsAgainst += awayGoals;
  
      away.goalsFor += awayGoals;
      away.goalsAgainst += homeGoals;
  
      if (homeGoals > awayGoals) {
        home.wins++; home.points += 3;
        away.losses++;
      } else if (homeGoals < awayGoals) {
        away.wins++; away.points += 3;
        home.losses++;
      } else {
        home.draws++; home.points += 1;
        away.draws++; away.points += 1;
      }
  
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    });
  
    const sorted: Record<string, TeamStats[]> = {};
    for (const pool in standings) {
      sorted[pool] = Object.values(standings[pool]).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goalDifference - a.goalDifference;
      });
    }
  
    return sorted;
  }
  