'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, Users, Target, Clock, RefreshCw, Crown, 
  Medal, Shield, Zap, AlertCircle, Award
} from 'lucide-react';
import BracketDisplay from '@/components/guests/bracket';

// Types for our brackets
interface MatchWithTeams {
  id: string;
  homeTeam: any;
  awayTeam: any;
  homeScore?: number;
  awayScore?: number;
  completed: boolean;
  stage: string;
  round: string;
  bracketPosition?: number;
}

interface KnockoutBracketWithTeams {
  roundOf16: MatchWithTeams[];
  quarterFinals: MatchWithTeams[];
  semiFinals: MatchWithTeams[];
  final: MatchWithTeams | null;
  thirdPlace: MatchWithTeams | null;
}

interface PlateBracketWithTeams {
  round1: MatchWithTeams[];
  quarterFinals: MatchWithTeams[];
  semiFinals: MatchWithTeams[];
  final: MatchWithTeams | null;
  thirdPlace: MatchWithTeams | null;
}

interface ShieldBracketWithTeams {
  semiFinals: MatchWithTeams[];
  final: MatchWithTeams | null;
  thirdPlace: MatchWithTeams | null;
}

interface PlayoffBracketWithTeams {
  round1: MatchWithTeams[];
  playoff13th14th: MatchWithTeams | null;
  playoff15th16th: MatchWithTeams | null;
}

export default function BracketsPage() {
  const [cupBracket, setCupBracket] = useState<KnockoutBracketWithTeams | null>(null);
  const [plateBracket, setPlateBracket] = useState<PlateBracketWithTeams | null>(null);
  const [shieldBracket, setShieldBracket] = useState<ShieldBracketWithTeams | null>(null);
  const [playoffBracket, setPlayoffBracket] = useState<PlayoffBracketWithTeams | null>(null);
  const [festivalMatches, setFestivalMatches] = useState<MatchWithTeams[]>([]);
  const [totalTeams, setTotalTeams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasKnockoutMatches, setHasKnockoutMatches] = useState(false);

  useEffect(() => {
    loadBracketData();
  }, []);

  const loadBracketData = async () => {
    try {
      setLoading(true);
      
      // Load teams count
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teams = await teamsResponse.json();
        setTotalTeams(teams.length);
      }
      
      // Load all bracket data
      const cupData = await fetchCupBracket();
      const plateData = await fetchPlateBracket();
      const shieldData = await fetchShieldBracket();
      const playoffData = await fetchPlayoffBracket();
      const festivalData = await fetchFestivalMatches();

      setCupBracket(cupData);
      setPlateBracket(plateData);
      setShieldBracket(shieldData);
      setPlayoffBracket(playoffData);
      setFestivalMatches(festivalData);

      // Check if we have any knockout matches
      const hasCupMatches = cupData && (
        cupData.roundOf16.length > 0 || 
        cupData.quarterFinals.length > 0 || 
        cupData.semiFinals.length > 0 || 
        cupData.final !== null
      );
      
      setHasKnockoutMatches(hasCupMatches);

    } catch (error) {
      console.error('Error loading bracket data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCupBracket = async (): Promise<KnockoutBracketWithTeams> => {
    try {
      const response = await fetch('/api/matches?stage=cup');
      if (!response.ok) return {
        roundOf16: [],
        quarterFinals: [],
        semiFinals: [],
        final: null,
        thirdPlace: null
      };
      
      const cupMatches = await response.json();
      const matchesWithTeams = await mapMatchesWithTeams(cupMatches);
      
      // Organize by round
      return {
        roundOf16: matchesWithTeams.filter(m => m.round === 'round-of-16')
          .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        quarterFinals: matchesWithTeams.filter(m => m.round === 'quarter-final')
          .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        semiFinals: matchesWithTeams.filter(m => m.round === 'semi-final')
          .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        final: matchesWithTeams.find(m => m.round === 'final') || null,
        thirdPlace: matchesWithTeams.find(m => m.round === 'third-place') || null
      };
    } catch (error) {
      console.error('Error fetching cup bracket:', error);
      return {
        roundOf16: [],
        quarterFinals: [],
        semiFinals: [],
        final: null,
        thirdPlace: null
      };
    }
  };

  const fetchPlateBracket = async (): Promise<PlateBracketWithTeams> => {
    try {
      const response = await fetch('/api/matches?stage=plate');
      if (!response.ok) return {
        round1: [],
        quarterFinals: [],
        semiFinals: [],
        final: null,
        thirdPlace: null
      };
      
      const plateMatches = await response.json();
      const matchesWithTeams = await mapMatchesWithTeams(plateMatches);
      
      return {
        round1: matchesWithTeams.filter(m => m.round === 'plate-round-1')
          .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        quarterFinals: matchesWithTeams.filter(m => m.round === 'plate-quarter-final')
          .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        semiFinals: matchesWithTeams.filter(m => m.round === 'plate-semi-final')
          .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        final: matchesWithTeams.find(m => m.round === 'plate-final') || null,
        thirdPlace: matchesWithTeams.find(m => m.round === 'plate-third-place') || null
      };
    } catch (error) {
      console.error('Error fetching plate bracket:', error);
      return {
        round1: [],
        quarterFinals: [],
        semiFinals: [],
        final: null,
        thirdPlace: null
      };
    }
  };

  const fetchShieldBracket = async (): Promise<ShieldBracketWithTeams> => {
    try {
      const response = await fetch('/api/matches?stage=shield');
      if (!response.ok) return {
        semiFinals: [],
        final: null,
        thirdPlace: null
      };
      
      const shieldMatches = await response.json();
      const matchesWithTeams = await mapMatchesWithTeams(shieldMatches);
      
      return {
        semiFinals: matchesWithTeams.filter(m => m.round === 'shield-semi-final')
          .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        final: matchesWithTeams.find(m => m.round === 'shield-final') || null,
        thirdPlace: matchesWithTeams.find(m => m.round === 'shield-third-place') || null
      };
    } catch (error) {
      console.error('Error fetching shield bracket:', error);
      return {
        semiFinals: [],
        final: null,
        thirdPlace: null
      };
    }
  };

  const fetchPlayoffBracket = async (): Promise<PlayoffBracketWithTeams> => {
    try {
      const response = await fetch('/api/matches?stage=playoff');
      if (!response.ok) return {
        round1: [],
        playoff13th14th: null,
        playoff15th16th: null
      };
      
      const playoffMatches = await response.json();
      const matchesWithTeams = await mapMatchesWithTeams(playoffMatches);
      
      return {
        round1: matchesWithTeams.filter(m => m.round === 'playoff-round-1')
          .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0)),
        playoff13th14th: matchesWithTeams.find(m => m.round === '13th-14th') || null,
        playoff15th16th: matchesWithTeams.find(m => m.round === '15th-16th') || null
      };
    } catch (error) {
      console.error('Error fetching playoff bracket:', error);
      return {
        round1: [],
        playoff13th14th: null,
        playoff15th16th: null
      };
    }
  };

  const fetchFestivalMatches = async (): Promise<MatchWithTeams[]> => {
    try {
      const response = await fetch('/api/matches?stage=festival');
      if (!response.ok) return [];
      
      const festivalMatches = await response.json();
      return await mapMatchesWithTeams(festivalMatches);
    } catch (error) {
      console.error('Error fetching festival matches:', error);
      return [];
    }
  };

  const mapMatchesWithTeams = async (matches: any[]): Promise<MatchWithTeams[]> => {
    return Promise.all(matches.map(async (match) => {
      // Get match result if available
      let homeScore, awayScore, completed;
      
      if (match.matchResult) {
        homeScore = match.matchResult.homeScore;
        awayScore = match.matchResult.awayScore;
        completed = match.matchResult.completed;
      } else {
        try {
          const resultResponse = await fetch(`/api/match-results?matchId=${match.id}`);
          if (resultResponse.ok) {
            const result = await resultResponse.json();
            homeScore = result?.homeScore;
            awayScore = result?.awayScore;
            completed = result?.completed || false;
          }
        } catch (error) {
          console.error('Error fetching match result:', error);
        }
      }

      return {
        id: match.id,
        homeTeam: match.homeTeam || { id: 'TBD', schoolName: 'TBD' },
        awayTeam: match.awayTeam || { id: 'TBD', schoolName: 'TBD' },
        homeScore,
        awayScore,
        completed: completed || false,
        stage: match.stage,
        round: match.round,
        bracketPosition: match.bracketPosition
      };
    }));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p>Loading tournament brackets...</p>
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
              <Trophy className="text-yellow-600" />
              Tournament Brackets
            </h1>
            <p className="text-gray-600 mt-2">
              Knockout stage brackets and tournament progression
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {totalTeams} Teams
            </Badge>

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

      {/* No Knockout Matches Message */}
      {!hasKnockoutMatches && (
        <Card className="mb-8">
          <CardContent className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Ready to Create Brackets!</h3>
            <p className="text-gray-600 mb-4">
              Use the fixtures form to create knockout matches and build your tournament brackets.
            </p>
            
            <div className="text-sm text-green-600 space-y-1">
              <p>✅ No pool completion validation - you can create any matches immediately</p>
              <p>✅ Create Cup, Plate, Shield, Playoff, and Festival matches</p>
              <p>✅ Use parent match linking for automatic team progression</p>
              <p>✅ Set bracket positions for proper visualization</p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Quick Start Guide:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. Go to Fixtures page and create matches</p>
                <p>2. Start with Cup Round of 16 matches</p>
                <p>3. Use bracket positions 1-8 for proper display</p>
                <p>4. Create subsequent rounds with parent match links</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Overview */}
      {hasKnockoutMatches && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">
                {cupBracket?.roundOf16.length || 0}
              </div>
              <div className="text-sm text-gray-600">Cup Teams</div>
              <div className="text-xs text-gray-500">Round of 16</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {plateBracket?.round1.length || 0}
              </div>
              <div className="text-sm text-gray-600">Plate Teams</div>
              <div className="text-xs text-gray-500">Round 1</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {playoffBracket?.round1.length || 0}
              </div>
              <div className="text-sm text-gray-600">Playoff Teams</div>
              <div className="text-xs text-gray-500">Round 1</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {cupBracket ? cupBracket.roundOf16.filter(m => m.completed).length : 0}
              </div>
              <div className="text-sm text-gray-600">R16 Complete</div>
              <div className="text-xs text-gray-500">
                of {cupBracket?.roundOf16.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cup Bracket */}
      {cupBracket && (cupBracket.roundOf16.length > 0 || cupBracket.quarterFinals.length > 0 || cupBracket.semiFinals.length > 0 || cupBracket.final) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Cup Bracket
              </span>
              <Badge variant="outline">Championship Bracket</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <BracketDisplay 
              roundOf16={cupBracket.roundOf16}
              quarterFinals={cupBracket.quarterFinals}
              semiFinals={cupBracket.semiFinals}
              final={cupBracket.final}
              thirdPlace={cupBracket.thirdPlace}
            />
          </CardContent>
        </Card>
      )}

      {/* Plate Bracket */}
      {plateBracket && plateBracket.round1.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Plate Bracket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Plate Round 1 */}
              {plateBracket.round1.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">R1</div>
                    Plate Round 1
                    <Badge variant="secondary" className="ml-2">
                      {plateBracket.round1.filter(m => m.completed).length}/{plateBracket.round1.length} complete
                    </Badge>
                  </h3>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {plateBracket.round1.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Plate Quarter Finals */}
              {plateBracket.quarterFinals.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">QF</div>
                    Plate Quarter Finals
                  </h3>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {plateBracket.quarterFinals.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Plate Finals */}
              {(plateBracket.final || plateBracket.thirdPlace) && (
                <div className="border-t pt-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    {plateBracket.final && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Crown className="w-6 h-6 text-blue-500" />
                          Plate Final
                        </h3>
                        <MatchCard match={plateBracket.final} />
                      </div>
                    )}
                    {plateBracket.thirdPlace && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Medal className="w-6 h-6 text-cyan-500" />
                          Plate Third Place
                        </h3>
                        <MatchCard match={plateBracket.thirdPlace} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shield Bracket */}
      {shieldBracket && shieldBracket.semiFinals.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              Shield Bracket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Shield Semi Finals */}
              {shieldBracket.semiFinals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">SF</div>
                    Shield Semi Finals
                  </h3>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {shieldBracket.semiFinals.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Shield Finals */}
              {(shieldBracket.final || shieldBracket.thirdPlace) && (
                <div className="border-t pt-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    {shieldBracket.final && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Crown className="w-6 h-6 text-purple-500" />
                          Shield Final
                        </h3>
                        <MatchCard match={shieldBracket.final} />
                      </div>
                    )}
                    {shieldBracket.thirdPlace && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Medal className="w-6 h-6 text-pink-500" />
                          Shield Third Place
                        </h3>
                        <MatchCard match={shieldBracket.thirdPlace} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playoff Bracket */}
      {playoffBracket && (playoffBracket.round1.length > 0 || playoffBracket.playoff13th14th || playoffBracket.playoff15th16th) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              Playoff Bracket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Playoff Round 1 */}
              {playoffBracket.round1.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">R1</div>
                    Playoff Round 1
                    <Badge variant="secondary" className="ml-2">
                      {playoffBracket.round1.filter(m => m.completed).length}/{playoffBracket.round1.length} complete
                    </Badge>
                  </h3>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {playoffBracket.round1.map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Playoff Finals */}
              {(playoffBracket.playoff13th14th || playoffBracket.playoff15th16th) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Medal className="w-6 h-6 text-green-500" />
                    Playoff Finals
                  </h3>
                  <div className="grid lg:grid-cols-2 gap-6">
                    {playoffBracket.playoff13th14th && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                          <Medal className="w-5 h-5" />
                          13th/14th Place Playoff
                        </h4>
                        <MatchCard match={playoffBracket.playoff13th14th} />
                      </div>
                    )}
                    {playoffBracket.playoff15th16th && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                          <Medal className="w-5 h-5" />
                          15th/16th Place Playoff
                        </h4>
                        <MatchCard match={playoffBracket.playoff15th16th} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Festival Matches */}
      {festivalMatches.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Festival Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-4">
              {festivalMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Structure Info */}
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
                Championship Brackets
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span><strong>Cup:</strong> Top 16 teams - Championship bracket</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span><strong>Plate:</strong> Consolation bracket for Cup early exits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span><strong>Shield:</strong> Secondary consolation bracket</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span><strong>Playoff:</strong> Determines 13th-16th placements</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Additional Competitions
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span><strong>Festival:</strong> Friendly matches for all teams</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span><strong>13th/14th:</strong> Playoff for middle placements</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span><strong>15th/16th:</strong> Playoff for final placements</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Flow */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-3 text-blue-800">Tournament Flow</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Cup Bracket</strong> → Championship tournament with all teams</p>
              <p><strong>Cup R16 Losers</strong> → Drop to <strong>Plate Bracket</strong></p>
              <p><strong>Plate QF Losers</strong> → Drop to <strong>Shield Bracket</strong></p>
              <p><strong>Shield SF Losers</strong> → Advance to <strong>Playoff Bracket</strong></p>
              <p><strong>All Teams</strong> → Can participate in <strong>Festival Matches</strong></p>
            </div>
          </div>

          {/* Testing Instructions */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold mb-3 text-green-800">🎯 Testing Instructions</h4>
            <div className="text-sm text-green-700 space-y-2">
              <p><strong>1. Create Teams:</strong> Use Team Registration to add teams</p>
              <p><strong>2. Create Cup Matches:</strong> Start with Round of 16 matches (positions 1-8)</p>
              <p><strong>3. Create Subsequent Rounds:</strong> Use parent match linking for Quarters, Semis, etc.</p>
              <p><strong>4. Add Other Brackets:</strong> Create Plate, Shield, Playoff matches</p>
              <p><strong>5. Test Results:</strong> Update match results to see bracket progression</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple Match Card component for non-bracket matches
function MatchCard({ match }: { match: MatchWithTeams }) {
  const getRoundDisplayName = (round: string) => {
    const roundNames: { [key: string]: string } = {
      'round-of-16': 'Round of 16',
      'quarter-final': 'Quarter Final',
      'semi-final': 'Semi Final',
      'final': 'Final',
      'third-place': '3rd Place',
      'plate-round-1': 'Plate Round 1',
      'plate-quarter-final': 'Plate Quarter Final',
      'plate-semi-final': 'Plate Semi Final',
      'plate-final': 'Plate Final',
      'plate-third-place': 'Plate 3rd Place',
      'shield-semi-final': 'Shield Semi Final',
      'shield-final': 'Shield Final',
      'shield-third-place': 'Shield 3rd Place',
      'playoff-round-1': 'Playoff Round 1',
      '13th-14th': '13th/14th Playoff',
      '15th-16th': '15th/16th Playoff',
      'festival-match': 'Festival Match'
    };
    
    return roundNames[round] || round.replace(/-/g, ' ');
  };

  return (
    <Card className={`${match.completed ? 'bg-gray-50' : 'bg-white'} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant={match.completed ? "default" : "secondary"} className="text-xs">
            {match.completed ? 'Completed' : 'Pending'}
          </Badge>
          <div className="text-xs text-gray-500 capitalize">
            {getRoundDisplayName(match.round)}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className={`flex items-center justify-between p-2 rounded ${
            match.completed && match.homeScore! > match.awayScore! ? 'bg-green-100 font-semibold' : ''
          }`}>
            <span className="truncate max-w-32" title={match.homeTeam.schoolName}>
              {match.homeTeam.schoolName}
            </span>
            <span className={`font-bold ${
              match.completed && match.homeScore! > match.awayScore! ? 'text-green-600' : ''
            }`}>
              {match.homeScore ?? '-'}
            </span>
          </div>
          
          <div className={`flex items-center justify-between p-2 rounded ${
            match.completed && match.awayScore! > match.homeScore! ? 'bg-green-100 font-semibold' : ''
          }`}>
            <span className="truncate max-w-32" title={match.awayTeam.schoolName}>
              {match.awayTeam.schoolName}
            </span>
            <span className={`font-bold ${
              match.completed && match.awayScore! > match.homeScore! ? 'text-green-600' : ''
            }`}>
              {match.awayScore ?? '-'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}