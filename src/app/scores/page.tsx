import { useState, useEffect } from 'react';
import { tournamentUtils, MatchWithTeams } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import MatchCard from '../../components/guests/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Users, Trophy, RefreshCw, CheckCircle, Clock, AlertCircle, Target, Award } from 'lucide-react';

export default function MatchDisplay() {
  const [isAllocated, setIsAllocated] = useState(false);
  const [matchesGenerated, setMatchesGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [poolMatches, setPoolMatches] = useState<{[key: string]: MatchWithTeams[]}>({});
  const [totalTeams, setTotalTeams] = useState(0);
  const [allMatches, setAllMatches] = useState<MatchWithTeams[]>([]);
  const [tournamentStats, setTournamentStats] = useState<any>(null);

  useEffect(() => {
    loadMatchData();
  }, []);

  const loadMatchData = () => {
    try {
      const allocated = tournamentUtils.arePoolsAllocated();
      const generated = tournamentUtils.arePoolMatchesGenerated();
      const teams = storageUtils.getTeams();
      
      setIsAllocated(allocated);
      setMatchesGenerated(generated);
      setTotalTeams(teams.length);

      if (generated) {
        const matches = {
          A: getPoolMatchesWithTeams('A'),
          B: getPoolMatchesWithTeams('B'),
          C: getPoolMatchesWithTeams('C'),
          D: getPoolMatchesWithTeams('D')
        };
        setPoolMatches(matches);
        
        // Combine all matches for "All" tab
        const combined = Object.values(matches).flat();
        setAllMatches(combined);

        // Get tournament statistics
        const stats = tournamentUtils.getTournamentStats();
        setTournamentStats(stats);
      }
    } catch (error) {
      console.error('Error loading match data:', error);
    }
  };

  const getPoolMatchesWithTeams = (poolId: string): MatchWithTeams[] => {
    try {
      const matches = tournamentUtils.getPoolMatches(poolId);
      return matches.map(match => tournamentUtils.getMatchWithTeams(match));
    } catch (error) {
      console.error(`Error loading matches for pool ${poolId}:`, error);
      return [];
    }
  };

  const handleGenerateMatches = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate generation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      tournamentUtils.generatePoolMatches();
      loadMatchData();
    } catch (error) {
      console.error('Error generating matches:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getMatchStats = (matches: MatchWithTeams[]) => {
    const completed = matches.filter(m => m.completed).length;
    const pending = matches.length - completed;
    return { completed, pending, total: matches.length };
  };

  // Show loading state initially
  if (totalTeams === 0 && !isAllocated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading tournament data...</h2>
        </div>
      </div>
    );
  }

  // Pool allocation required
  if (!isAllocated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="text-blue-600" />
            Pool Fixtures
          </h1>
          <p className="text-gray-600 mt-2">View and manage tournament fixtures</p>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Pool Allocation Required</h3>
            <p className="text-gray-600 mb-4">
              {totalTeams} teams are registered but need to be allocated into pools before fixtures can be generated.
            </p>
            <p className="text-sm text-gray-500">
              Go to the Pools page to allocate teams into pools first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="text-blue-600" />
              Pool Fixtures
            </h1>
            <p className="text-gray-600 mt-2">
              Round-robin matches for all pool stages
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {totalTeams} Teams
            </Badge>
            
            {!matchesGenerated && (
              <Button
                onClick={handleGenerateMatches}
                disabled={isGenerating}
                className="min-w-40"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Generate Fixtures
                  </>
                )}
              </Button>
            )}

            {matchesGenerated && (
              <Button
                onClick={handleGenerateMatches}
                disabled={isGenerating}
                variant="outline"
                className="min-w-40"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Re-generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-generate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tournament Progress Stats */}
      {matchesGenerated && tournamentStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{tournamentStats.completedMatches}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">{tournamentStats.pendingMatches}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{tournamentStats.totalGoals}</div>
              <div className="text-sm text-gray-600">Total Goals</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{tournamentStats.averageGoalsPerMatch}</div>
              <div className="text-sm text-gray-600">Avg/Match</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Matches Not Generated */}
      {!matchesGenerated && (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarDays className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">Ready to Generate Fixtures</h3>
            <p className="text-gray-600 mb-4">
              Teams are allocated into pools. Generate the round-robin fixtures for pool play.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Each team will play 6 matches (one against every other team in their pool)</p>
              <p>Expected total matches: ~{Math.floor((totalTeams / 4) * 21)} matches</p>
              
              {totalTeams !== 28 && (
                <div className="flex items-center justify-center gap-2 mt-4 text-orange-700 bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">
                    Optimal setup is 28 teams (7 per pool). Currently have {totalTeams} teams.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Fixtures */}
      {matchesGenerated && (
        <>
          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {['A', 'B', 'C', 'D'].map(poolId => {
              const matches = poolMatches[poolId] || [];
              const stats = getMatchStats(matches);
              const completion = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              
              return (
                <Card key={poolId}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                      {poolId}
                    </div>
                    <div className="font-semibold mb-1">Pool {poolId}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {stats.total} matches
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getPoolProgressColor(poolId)}`}
                        style={{ width: `${completion}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {stats.completed}
                      </div>
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="w-3 h-3" />
                        {stats.pending}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Fixtures Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Matches ({allMatches.length})</TabsTrigger>
              <TabsTrigger value="A">Pool A ({(poolMatches.A || []).length})</TabsTrigger>
              <TabsTrigger value="B">Pool B ({(poolMatches.B || []).length})</TabsTrigger>
              <TabsTrigger value="C">Pool C ({(poolMatches.C || []).length})</TabsTrigger>
              <TabsTrigger value="D">Pool D ({(poolMatches.D || []).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      All Pool Matches
                    </span>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{allMatches.length} matches</Badge>
                      {tournamentStats && (
                        <Badge variant="secondary">
                          {Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100)}% complete
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allMatches.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {allMatches.map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          showPool={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No matches generated yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {['A', 'B', 'C', 'D'].map(poolId => (
              <TabsContent key={poolId} value={poolId} className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                          {poolId}
                        </div>
                        Pool {poolId} Fixtures
                      </span>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{(poolMatches[poolId] || []).length} matches</Badge>
                        {(poolMatches[poolId] || []).length > 0 && (
                          <Badge variant="secondary">
                            {getMatchStats(poolMatches[poolId] || []).completed} completed
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(poolMatches[poolId] || []).length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {(poolMatches[poolId] || []).map(match => (
                          <MatchCard 
                            key={match.id} 
                            match={match}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No matches in this pool</p>
                        <p className="text-sm">Generate fixtures to see matches</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}

function getPoolColor(poolId: string): string {
  const colors = {
    'A': 'bg-blue-600',
    'B': 'bg-green-600', 
    'C': 'bg-orange-600',
    'D': 'bg-purple-600'
  };
  return colors[poolId as keyof typeof colors] || 'bg-gray-600';
}

function getPoolProgressColor(poolId: string): string {
  const colors = {
    'A': 'bg-blue-500',
    'B': 'bg-green-500', 
    'C': 'bg-orange-500',
    'D': 'bg-purple-500'
  };
  return colors[poolId as keyof typeof colors] || 'bg-gray-500';
}