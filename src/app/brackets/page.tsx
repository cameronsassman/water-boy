'use client';

import { useState, useEffect } from 'react';
import { tournamentUtils, KnockoutBracketWithTeams } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import MatchCard from '@/components/guests/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, Users, Target, Award, Calendar, CheckCircle, 
  Clock, RefreshCw, AlertCircle, Play, Crown, Medal
} from 'lucide-react';

export default function BracketsPage() {
  const [poolStageComplete, setPoolStageComplete] = useState(false);
  const [knockoutGenerated, setKnockoutGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cupBracket, setCupBracket] = useState<KnockoutBracketWithTeams | null>(null);
  const [totalTeams, setTotalTeams] = useState(0);

  useEffect(() => {
    loadBracketData();
  }, []);

  const loadBracketData = () => {
    try {
      const teams = storageUtils.getTeams();
      setTotalTeams(teams.length);
      
      const poolComplete = tournamentUtils.isPoolStageComplete();
      const knockoutExists = tournamentUtils.areKnockoutBracketsGenerated();
      
      setPoolStageComplete(poolComplete);
      setKnockoutGenerated(knockoutExists);
      
      if (knockoutExists) {
        const bracket = tournamentUtils.getCupBracketWithTeams();
        setCupBracket(bracket);
      }
    } catch (error) {
      console.error('Error loading bracket data:', error);
    }
  };

  const handleGenerateKnockout = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate generation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      tournamentUtils.generateCupBracket();
      loadBracketData();
    } catch (error) {
      console.error('Error generating knockout bracket:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading state initially
  if (totalTeams === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p>Loading tournament data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="text-gold-600" />
              Tournament Brackets
            </h1>
            <p className="text-gray-600 mt-2">
              Knockout stage brackets and cup progression
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {totalTeams} Teams
            </Badge>
            
            {poolStageComplete && !knockoutGenerated && (
              <Button
                onClick={handleGenerateKnockout}
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
                    <Play className="w-4 h-4 mr-2" />
                    Generate Knockout
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={loadBracketData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Pool Stage Not Complete */}
      {!poolStageComplete && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-orange-400" />
            <h3 className="text-xl font-semibold mb-2">Pool Stage In Progress</h3>
            <p className="text-gray-600 mb-4">
              Complete all pool matches before the knockout stage can begin.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Top 4 teams from each pool will advance to the Cup Round of 16</p>
              <p>Bottom 3 teams will participate in Festival matches</p>
              
              <div className="flex items-center justify-center gap-2 mt-4 text-blue-700 bg-blue-50 p-3 rounded-lg">
                <Clock className="w-5 h-5" />
                <span className="text-sm">
                  Pool matches must be completed by administrators before knockout generation
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pool Complete - Ready for Knockout */}
      {poolStageComplete && !knockoutGenerated && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-semibold mb-2">Ready for Knockout Stage!</h3>
            <p className="text-gray-600 mb-6">
              All pool matches are complete. Generate the knockout brackets to continue the tournament.
            </p>
            
            {/* Pool Qualifiers Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {['A', 'B', 'C', 'D'].map(poolId => {
                const qualifiers = tournamentUtils.getPoolQualifiers(poolId);
                return (
                  <div key={poolId} className="p-4 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${getPoolColor(poolId)}`}>
                      {poolId}
                    </div>
                    <div className="font-semibold mb-2">Pool {poolId} Qualifiers</div>
                    <div className="space-y-1 text-sm">
                      {qualifiers.slice(0, 4).map((team, index) => (
                        <div key={team.id} className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="truncate" title={team.schoolName}>
                            {team.schoolName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-sm text-gray-500 space-y-2">
              <p>Expected bracket format: A vs D pools, B vs C pools</p>
              <p>A1 vs D4, A2 vs D3, A3 vs D2, A4 vs D1</p>
              <p>B1 vs C4, B2 vs C3, B3 vs C2, B4 vs C1</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knockout Brackets Generated */}
      {knockoutGenerated && cupBracket && (
        <div className="space-y-8">
          {/* Tournament Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-600">16</div>
                <div className="text-sm text-gray-600">Cup Teams</div>
                <div className="text-xs text-gray-500">Round of 16</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">1</div>
                <div className="text-sm text-gray-600">Champion</div>
                <div className="text-xs text-gray-500">Cup Winner</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Medal className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">12</div>
                <div className="text-sm text-gray-600">Festival Teams</div>
                <div className="text-xs text-gray-500">Bottom 3 per pool</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">
                  {cupBracket.roundOf16.filter(m => m.completed).length}
                </div>
                <div className="text-sm text-gray-600">R16 Complete</div>
                <div className="text-xs text-gray-500">of 8 matches</div>
              </CardContent>
            </Card>
          </div>

          {/* Cup Bracket */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Cup Bracket
                </span>
                <Badge variant="outline">Top 4 from each pool</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Round of 16 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">16</div>
                  Round of 16
                  <Badge variant="secondary" className="ml-2">
                    {cupBracket.roundOf16.filter(m => m.completed).length}/8 complete
                  </Badge>
                </h3>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* A vs D Side */}
                  <div>
                    <h4 className="text-md font-medium mb-3 text-center">Pool A vs Pool D</h4>
                    <div className="grid gap-3">
                      {cupBracket.roundOf16.slice(0, 4).map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match}
                          showPool={false}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* B vs C Side */}
                  <div>
                    <h4 className="text-md font-medium mb-3 text-center">Pool B vs Pool C</h4>
                    <div className="grid gap-3">
                      {cupBracket.roundOf16.slice(4, 8).map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match}
                          showPool={false}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quarter Finals */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">8</div>
                  Quarter Finals
                  <Badge variant="secondary" className="ml-2">
                    {cupBracket.quarterFinals.filter(m => m.completed).length}/4 matches
                  </Badge>
                </h3>
                
                {cupBracket.quarterFinals.length > 0 ? (
                  <div className="grid lg:grid-cols-2 gap-4">
                    {cupBracket.quarterFinals.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match}
                        showPool={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Quarter Finals will be generated after Round of 16 completion</p>
                    <p className="text-sm">Complete all Round of 16 matches to progress</p>
                  </div>
                )}
              </div>

              {/* Semi Finals */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  Semi Finals
                  <Badge variant="secondary" className="ml-2">
                    {cupBracket.semiFinals.filter(m => m.completed).length}/2 matches
                  </Badge>
                </h3>
                
                {cupBracket.semiFinals.length > 0 ? (
                  <div className="grid lg:grid-cols-2 gap-4">
                    {cupBracket.semiFinals.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match}
                        showPool={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Semi Finals will be generated after Quarter Finals completion</p>
                  </div>
                )}
              </div>

              {/* Finals */}
              <div className="border-t pt-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Cup Final */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Crown className="w-6 h-6 text-yellow-500" />
                      Cup Final
                    </h3>
                    
                    {cupBracket.final ? (
                      <MatchCard 
                        match={cupBracket.final}
                        showPool={false}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Crown className="w-12 h-12 mx-auto mb-3 opacity-50 text-yellow-600" />
                        <p className="font-medium text-yellow-800">Cup Final</p>
                        <p className="text-sm">Winner of Semi Final 1 vs Winner of Semi Final 2</p>
                      </div>
                    )}
                  </div>

                  {/* Third Place */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Medal className="w-6 h-6 text-orange-500" />
                      Third Place
                    </h3>
                    
                    {cupBracket.thirdPlace ? (
                      <MatchCard 
                        match={cupBracket.thirdPlace}
                        showPool={false}
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-orange-50 rounded-lg border border-orange-200">
                        <Medal className="w-12 h-12 mx-auto mb-3 opacity-50 text-orange-600" />
                        <p className="font-medium text-orange-800">Third Place</p>
                        <p className="text-sm">Loser of Semi Final 1 vs Loser of Semi Final 2</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Path Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Tournament Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Cup Path (Top 4 per pool)
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Round of 16: A vs D pools, B vs C pools</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Quarter Finals: 8 teams remaining</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      <span>Semi Finals: 4 teams remaining</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      <span>Final: Championship match</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Additional Competitions
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span>Plate: For Round of 16 losers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                      <span>Shield: For Plate losers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                      <span>Festival: Bottom 3 per pool + early exits</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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