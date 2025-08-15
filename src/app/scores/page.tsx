import { useState, useEffect } from 'react';
import { tournamentUtils, MatchWithTeams } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import MatchCard from '../../components/guests/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Users, Trophy, RefreshCw, CheckCircle, Clock, AlertCircle, Target, Award, Trash2 } from 'lucide-react';

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

  const handleClearMatches = async () => {
    if (!confirm('Are you sure you want to clear all matches and results? This action cannot be undone.')) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      tournamentUtils.clearPoolMatches();
      loadMatchData();
    } catch (error) {
      console.error('Error clearing matches:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearResults = async () => {
    if (!confirm('Are you sure you want to clear all saved match results and scorecards? Matches will remain but all scores will be reset. This action cannot be undone.')) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear all match results but keep the matches
      storageUtils.clearPoolMatchResults();
      
      // Reset match completion status
      const tournament = storageUtils.getTournament();
      tournament.matches.forEach(match => {
        if (match.stage === 'pool') {
          match.completed = false;
          match.homeScore = undefined;
          match.awayScore = undefined;
        }
      });
      storageUtils.saveTournament(tournament);
      
      loadMatchData();
    } catch (error) {
      console.error('Error clearing results:', error);
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
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p>Loading tournament data...</p>
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
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateMatches}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
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
                
                {tournamentStats && tournamentStats.completedMatches > 0 && (
                  <Button
                    onClick={handleClearResults}
                    disabled={isGenerating}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Results
                  </Button>
                )}
                
                <Button
                  onClick={handleClearMatches}
                  disabled={isGenerating}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
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
          {/* Pool Status Cards */}
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
                        className={`h-2 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${completion}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{stats.completed} complete</span>
                      <span>{stats.pending} pending</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pool Matches Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="A">Pool A</TabsTrigger>
              <TabsTrigger value="B">Pool B</TabsTrigger>
              <TabsTrigger value="C">Pool C</TabsTrigger>
              <TabsTrigger value="D">Pool D</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                    All Pool Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allMatches.length > 0 ? (
                      allMatches.map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match}
                          showPool={true}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No matches found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {['A', 'B', 'C', 'D'].map(poolId => (
              <TabsContent key={poolId} value={poolId}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full ${getPoolColor(poolId)}`}></div>
                      Pool {poolId} Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {poolMatches[poolId]?.length > 0 ? (
                        poolMatches[poolId].map(match => (
                          <MatchCard 
                            key={match.id} 
                            match={match}
                            showPool={false}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No matches found for Pool {poolId}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Completion Status */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Pool Stage Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                {['A', 'B', 'C', 'D'].map(poolId => {
                  const matches = poolMatches[poolId] || [];
                  const stats = getMatchStats(matches);
                  const completion = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                  
                  return (
                    <div key={poolId}>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPoolColor(poolId)}`}></div>
                        Pool {poolId}
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Matches:</span>
                          <span>{stats.completed}/{stats.total} ({completion}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Teams:</span>
                          <span>{tournamentUtils.getTeamsByPool(poolId).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className={completion === 100 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                            {completion === 100 ? 'Complete' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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