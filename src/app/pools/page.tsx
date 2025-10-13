'use client';

import { useState, useEffect } from 'react';
import PoolStandings from '@/components/guests/pool-standings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, RefreshCw, Trophy, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

interface Team {
  id: string;
  schoolName: string;
  coachName: string;
  managerName: string;
  poolAllocation: string;
  teamLogo?: string;
  players: any[];
}

interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface PoolData {
  [key: string]: TeamStanding[];
}

export default function PoolsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [poolStandings, setPoolStandings] = useState<PoolData>({});
  const [totalTeams, setTotalTeams] = useState(0);
  const [poolTeamCounts, setPoolTeamCounts] = useState<{[key: string]: number}>({});
  const [poolCompletionStatus, setPoolCompletionStatus] = useState<{[key: string]: boolean}>({});
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSelectedTab, setMobileSelectedTab] = useState('overview');
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPoolData();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const loadPoolData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all pool standings
      const response = await fetch('/api/standings');
      
      if (!response.ok) {
        throw new Error('Failed to load pool data');
      }

      const data = await response.json();
      
      // Process the data for each pool
      const standings: PoolData = {};
      const teamCounts: {[key: string]: number} = {};
      const completionStatus: {[key: string]: boolean} = {};

      const poolIds = ['A', 'B', 'C', 'D'];
      let totalTeamsCount = 0;

      for (const poolId of poolIds) {
        const poolResponse = await fetch(`/api/standings?pool=${poolId}`);
        if (poolResponse.ok) {
          const poolData = await poolResponse.json();
          standings[poolId] = poolData.standings || [];
          teamCounts[poolId] = standings[poolId].length;
          totalTeamsCount += standings[poolId].length;
          
          // Check if pool stage is complete (all matches played)
          completionStatus[poolId] = await checkPoolCompletion(poolId);
        }
      }

      setPoolStandings(standings);
      setPoolTeamCounts(teamCounts);
      setTotalTeams(totalTeamsCount);
      setPoolCompletionStatus(completionStatus);

    } catch (error) {
      console.error('Error loading pool data:', error);
      setError('Failed to load pool data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPoolCompletion = async (poolId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/matches?poolId=${poolId}&stage=pool`);
      
      if (!response.ok) {
        return false;
      }

      const matches = await response.json();
      
      if (matches.length === 0) {
        return false;
      }

      // Check if all pool matches are completed
      return matches.every((match: any) => match.completed);
    } catch (error) {
      console.error('Error checking pool completion:', error);
      return false;
    }
  };

  const getAllPoolsComplete = (): boolean => {
    return Object.values(poolCompletionStatus).every(status => status);
  };

  const MobileDropdown = () => (
    <div className="relative w-full mb-4">
      <button
        onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
        className="w-full flex items-center justify-between p-4 bg-white border-2 border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
      >
        <span className="font-semibold text-blue-800">
          {mobileSelectedTab === 'overview' ? 'Overview' : `Pool ${mobileSelectedTab}`}
        </span>
        {isMobileDropdownOpen ? (
          <ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </button>
      
      {isMobileDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-blue-200 rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              setMobileSelectedTab('overview');
              setIsMobileDropdownOpen(false);
            }}
            className={`w-full text-left px-4 py-3 border-b border-blue-100 hover:bg-blue-50 transition-colors ${
              mobileSelectedTab === 'overview' ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'
            }`}
          >
            Overview
          </button>
          {['A', 'B', 'C', 'D'].map(poolId => (
            <button
              key={poolId}
              onClick={() => {
                setMobileSelectedTab(poolId);
                setIsMobileDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-3 border-b border-blue-100 hover:bg-blue-50 transition-colors ${
                mobileSelectedTab === poolId ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-700'
              }`}
            >
              Pool {poolId}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-lg">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={loadPoolData} variant="outline" className="border-red-300 text-red-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allPoolsComplete = getAllPoolsComplete();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
            Tournament Pools
          </h1>
        </div>
        <p className="text-gray-600 text-base sm:text-lg">Track team progress and pool standings</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={loadPoolData}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {totalTeams} Teams Total
          </Badge>
        </div>
        
        {allPoolsComplete && (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            All Pools Complete
          </Badge>
        )}
      </div>

      {/* Completion Banner */}
      {allPoolsComplete && (
        <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-1">Pool Stage Complete!</h3>
                  <p className="text-green-700 text-xs sm:text-sm">All pool matches have been played. Ready for knockout stage.</p>
                </div>
              </div>
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto">
                <div className="text-center xs:text-right text-xs sm:text-sm mb-2 xs:mb-0 xs:mr-4">
                  <div className="text-green-800 font-medium">Top 4 advance to Cup</div>
                  <div className="text-blue-800 font-medium">Bottom 3 advance to Festival</div>
                </div>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full xs:w-auto text-white text-xs sm:text-sm">
                  View Brackets
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Dropdown */}
      {isMobile && <MobileDropdown />}

      {/* Tabs Section */}
      <Tabs 
        defaultValue="overview" 
        value={isMobile ? mobileSelectedTab : undefined}
        onValueChange={isMobile ? setMobileSelectedTab : undefined}
        className="w-full"
      >
        {!isMobile && (
          <TabsList className="w-full grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 bg-blue-100 rounded-xl border border-blue-200">
            <TabsTrigger 
              value="overview" 
              className="text-xs sm:text-sm py-2 px-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              Overview
            </TabsTrigger>
            {['A', 'B', 'C', 'D'].map(poolId => (
              <TabsTrigger 
                key={poolId}
                value={poolId} 
                className="text-xs sm:text-sm py-2 px-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg transition-all"
              >
                Pool {poolId}
                {poolTeamCounts[poolId] > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-white text-blue-600">
                    {poolTeamCounts[poolId]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 sm:mt-6 focus:outline-none">
          <div className="space-y-6">
            {/* Pool Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {['A', 'B', 'C', 'D'].map(poolId => {
                const standings = poolStandings[poolId] || [];
                const isComplete = poolCompletionStatus[poolId] || false;
                const teamCount = poolTeamCounts[poolId] || 0;
                
                return (
                  <Card key={poolId} className={`border-2 shadow-lg ${
                    isComplete ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                            {poolId}
                          </div>
                          <CardTitle className="text-base sm:text-lg text-blue-800">Pool {poolId}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {isComplete && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                              Complete
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 text-xs">
                            {teamCount} teams
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {teamCount === 0 ? (
                        <div className="text-center py-6 text-blue-500">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No teams allocated</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {standings.slice(0, 4).map((standing, index) => (
                            <div key={standing.team.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  index < 4 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="truncate text-sm font-medium text-gray-900" title={standing.team.schoolName}>
                                  {standing.team.schoolName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm flex-shrink-0 ml-2">
                                <span className="font-bold text-blue-600">{standing.points}</span>
                                <span className="text-xs text-gray-500">pts</span>
                              </div>
                            </div>
                          ))}
                          
                          {standings.length > 4 && (
                            <div className="text-center text-xs text-gray-500 pt-2 border-t border-blue-100">
                              +{standings.length - 4} more teams
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        {/* Individual Pool Tabs */}
        {['A', 'B', 'C', 'D'].map(poolId => (
          <TabsContent key={poolId} value={poolId} className="mt-4 sm:mt-6 focus:outline-none">
            <PoolStandings 
              poolId={poolId}
              poolName={`Pool ${poolId}`}
              standings={poolStandings[poolId] || []}
            />
          </TabsContent>
        ))}
      </Tabs>
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