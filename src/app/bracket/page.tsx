"use client"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Shield, Loader2 } from 'lucide-react';
import MatchCard from '../../components/guests/match-card';

interface Team {
  id: string;
  schoolName: string;
  poolAllocation?: string;
  players?: any[];
}

interface Match {
  id: string;
  stage: string;
  round?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  completed?: boolean;
  timeSlot?: string;
  arena?: 1 | 2;
}

interface MatchWithTeams extends Match {
  homeTeam?: Team;
  awayTeam?: Team;
}

export default function BracketsPage() {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'large'>('desktop');

  useEffect(() => {
    loadData();
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const checkScreenSize = () => {
    const width = window.innerWidth;
    if (width < 768) {
      setScreenSize('mobile');
    } else if (width < 1024) {
      setScreenSize('tablet');
    } else if (width < 1440) {
      setScreenSize('desktop');
    } else {
      setScreenSize('large');
    }
  };

  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';
  const isDesktop = screenSize === 'desktop';
  const isLarge = screenSize === 'large';

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { matchService, teamService } = await import('@/utils/storage');
      const [matchesData, teamsData] = await Promise.all([
        matchService.getMatches(),
        teamService.getTeams()
      ]);
      
      const enrichedMatches = matchesData.map(match => ({
        ...match,
        homeTeam: teamsData.find(team => team.id === match.homeTeamId),
        awayTeam: teamsData.find(team => team.id === match.awayTeamId)
      }));
      
      setMatches(enrichedMatches);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading bracket data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaceholderMatch = (id: string, home: string, away: string, time: string, stage: string, round: string): MatchWithTeams => ({
    id,
    stage,
    round,
    timeSlot: time,
    homeTeam: { id: 'TBD', schoolName: home, players: [] },
    awayTeam: { id: 'TBD', schoolName: away, players: [] },
    completed: false
  });

  const CupBracketPDF = () => {
    const cupMatches = matches.filter(m => m.stage === 'cup');
    const realRoundOf16 = cupMatches.filter(m => m.round === 'round-of-16');
    const realQuarterFinals = cupMatches.filter(m => m.round === 'quarter-final');
    const realSemiFinals = cupMatches.filter(m => m.round === 'semi-final');
    const realFinal = cupMatches.filter(m => m.round === 'final');

    const roundOf16Left = [
      createPlaceholderMatch('r16-1', 'Group A - 1st', 'Group D - 4th', '11:30', 'cup', 'round-of-16'),
      createPlaceholderMatch('r16-2', 'Group C - 2nd', 'Group B - 3rd', '13:30', 'cup', 'round-of-16'),
      createPlaceholderMatch('r16-3', 'Group D - 2nd', 'Group A - 3rd', '14:00', 'cup', 'round-of-16'),
      createPlaceholderMatch('r16-4', 'Group B - 1st', 'Group C - 4th', '12:00', 'cup', 'round-of-16')
    ];

    const roundOf16Right = [
      createPlaceholderMatch('r16-5', 'Group C - 1st', 'Group B - 4th', '12:30', 'cup', 'round-of-16'),
      createPlaceholderMatch('r16-6', 'Group A - 2nd', 'Group D - 3rd', '10:30', 'cup', 'round-of-16'),
      createPlaceholderMatch('r16-7', 'Group B - 2nd', 'Group C - 3rd', '15:00', 'cup', 'round-of-16'),
      createPlaceholderMatch('r16-8', 'Group D - 1st', 'Group A - 4th', '13:00', 'cup', 'round-of-16')
    ];

    const quarterFinals = [
      createPlaceholderMatch('qf-1', 'Winner R16-1', 'Winner R16-2', '17:30', 'cup', 'quarter-final'),
      createPlaceholderMatch('qf-2', 'Winner R16-3', 'Winner R16-4', '18:00', 'cup', 'quarter-final'),
      createPlaceholderMatch('qf-3', 'Winner R16-5', 'Winner R16-6', '18:30', 'cup', 'quarter-final'),
      createPlaceholderMatch('qf-4', 'Winner R16-7', 'Winner R16-8', '19:00', 'cup', 'quarter-final')
    ];

    const semiFinals = [
      createPlaceholderMatch('sf-1', 'Winner QF-1', 'Winner QF-2', '10:30', 'cup', 'semi-final'),
      createPlaceholderMatch('sf-2', 'Winner QF-3', 'Winner QF-4', '11:00', 'cup', 'semi-final')
    ];

    const final = createPlaceholderMatch('final', 'Winner SF-1', 'Winner SF-2', '15:00', 'cup', 'final');

    const mergeMatches = (placeholders: MatchWithTeams[], realMatches: MatchWithTeams[]) => {
      return placeholders.map((placeholder, index) => {
        const realMatch = realMatches[index];
        return realMatch || placeholder;
      });
    };

    const displayRoundOf16Left = mergeMatches(roundOf16Left, realRoundOf16.slice(0, 4));
    const displayRoundOf16Right = mergeMatches(roundOf16Right, realRoundOf16.slice(4, 8));
    const displayQuarterFinals = mergeMatches(quarterFinals, realQuarterFinals);
    const displaySemiFinals = mergeMatches(semiFinals, realSemiFinals);
    const displayFinal = realFinal[0] || final;

    // Mobile & Tablet Layout - Vertical
    if (isMobile || isTablet) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Waugh Cup</h2>
            <div className="text-sm text-gray-600">Knockout Stage Tournament Bracket</div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-blue-800 mb-4">Round of 16</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...displayRoundOf16Left, ...displayRoundOf16Right].map((match, index) => (
                  <div key={match.id} className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Match {index + 1}</div>
                    <MatchCard match={match} size="small" showPool={false} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-blue-800 mb-4">Quarter Finals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayQuarterFinals.map((match, index) => (
                  <div key={match.id} className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">QF {index + 1}</div>
                    <MatchCard match={match} size="small" showPool={false} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-blue-800 mb-4">Semi Finals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displaySemiFinals.map((match, index) => (
                  <div key={match.id} className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">SF {index + 1}</div>
                    <MatchCard match={match} size="small" showPool={false} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 p-4 rounded-xl border-4 border-yellow-400 shadow-lg">
              <div className="text-center mb-4">
                <Trophy className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
                <div className="text-lg font-bold text-yellow-900">FINAL</div>
              </div>
              <MatchCard match={displayFinal} size="normal" showPool={false} />
              <div className="mt-4 text-center">
                <div className="text-xs text-gray-600 mb-2">Congratulations to tournament winners:</div>
                <div className="bg-white rounded-lg p-3 border-2 border-yellow-400">
                  <div className="text-sm font-bold text-yellow-800">
                    {displayFinal.completed && displayFinal.homeTeam && displayFinal.awayTeam
                      ? (displayFinal.homeScore! > displayFinal.awayScore! 
                          ? displayFinal.homeTeam.schoolName 
                          : displayFinal.awayTeam.schoolName)
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Desktop Layout - Compact Horizontal
    return (
      <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Waugh Cup</h2>
          <div className="text-sm text-gray-600">Knockout Stage Tournament Bracket</div>
        </div>

        <div className="flex justify-center items-start gap-2 lg:gap-3">
          {/* LEFT SIDE */}
          <div className="flex gap-2 lg:gap-3">
            {/* Round of 16 - Left */}
            <div className="flex flex-col justify-around space-y-2 lg:space-y-3 w-[140px] lg:w-[150px]">
              {displayRoundOf16Left.map((match, index) => (
                <div key={match.id}>
                  <MatchCard match={match} size="small" showPool={false} />
                </div>
              ))}
            </div>

            {/* Quarter Finals - Left */}
            <div className="flex flex-col justify-around space-y-8 lg:space-y-12 w-[140px] lg:w-[150px]">
              <div>
                <div className="mb-1 text-xs text-center font-semibold text-gray-600">QF 1</div>
                <MatchCard match={displayQuarterFinals[0]} size="small" showPool={false} />
              </div>
              <div>
                <div className="mb-1 text-xs text-center font-semibold text-gray-600">QF 2</div>
                <MatchCard match={displayQuarterFinals[1]} size="small" showPool={false} />
              </div>
            </div>

            {/* Semi Final 1 */}
            <div className="flex flex-col justify-center w-[140px] lg:w-[150px] mt-8 lg:mt-12">
              <div>
                <div className="mb-1 text-xs text-center font-semibold text-gray-600">SF 1</div>
                <MatchCard match={displaySemiFinals[0]} size="small" showPool={false} />
              </div>
            </div>
          </div>

          {/* CENTER - Final */}
          <div className="flex flex-col justify-center w-[180px] lg:w-[200px] mx-2">
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 p-3 lg:p-4 rounded-xl border-4 border-yellow-400 shadow-lg">
              <div className="text-center mb-3">
                <Trophy className="w-5 h-5 lg:w-6 lg:h-6 mx-auto text-yellow-600 mb-1" />
                <div className="text-sm lg:text-base font-bold text-yellow-900">FINAL</div>
              </div>
              <MatchCard match={displayFinal} size="small" showPool={false} />
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-600 mb-1">Tournament winners:</div>
                <div className="bg-white rounded-lg p-2 border-2 border-yellow-400">
                  <div className="text-xs font-bold text-yellow-800">
                    {displayFinal.completed && displayFinal.homeTeam && displayFinal.awayTeam
                      ? (displayFinal.homeScore! > displayFinal.awayScore! 
                          ? displayFinal.homeTeam.schoolName 
                          : displayFinal.awayTeam.schoolName)
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex gap-2 lg:gap-3">
            {/* Semi Final 2 */}
            <div className="flex flex-col justify-center w-[140px] lg:w-[150px] mt-8 lg:mt-12">
              <div>
                <div className="mb-1 text-xs text-center font-semibold text-gray-600">SF 2</div>
                <MatchCard match={displaySemiFinals[1]} size="small" showPool={false} />
              </div>
            </div>

            {/* Quarter Finals - Right */}
            <div className="flex flex-col justify-around space-y-8 lg:space-y-12 w-[140px] lg:w-[150px]">
              <div>
                <div className="mb-1 text-xs text-center font-semibold text-gray-600">QF 3</div>
                <MatchCard match={displayQuarterFinals[2]} size="small" showPool={false} />
              </div>
              <div>
                <div className="mb-1 text-xs text-center font-semibold text-gray-600">QF 4</div>
                <MatchCard match={displayQuarterFinals[3]} size="small" showPool={false} />
              </div>
            </div>

            {/* Round of 16 - Right */}
            <div className="flex flex-col justify-around space-y-2 lg:space-y-3 w-[140px] lg:w-[150px]">
              {displayRoundOf16Right.map((match, index) => (
                <div key={match.id}>
                  <MatchCard match={match} size="small" showPool={false} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Round Labels */}
        <div className="flex justify-center gap-3 lg:gap-4 mt-4 flex-wrap">
          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">Round of 16</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">Quarter Finals</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">Semi Finals</Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">Final</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">Semi Finals</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">Quarter Finals</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">Round of 16</Badge>
        </div>
      </div>
    );
  };

  const PlateBracketPDF = () => {
    const plateMatches = matches.filter(m => m.stage === 'plate');
    const realSemiFinals = plateMatches.filter(m => m.round === 'plate-semi-final');
    const realFinal = plateMatches.filter(m => m.round === 'plate-final');

    const semiFinals = [
      createPlaceholderMatch('plate-sf-1', 'TBD', 'TBD', '9:30', 'plate', 'plate-semi-final'),
      createPlaceholderMatch('plate-sf-2', 'TBD', 'TBD', '10:00', 'plate', 'plate-semi-final')
    ];

    const final = createPlaceholderMatch('plate-final', 'Winner SF-1', 'Winner SF-2', '13:00', 'plate', 'plate-final');

    const displaySemiFinals = [
      realSemiFinals[0] || semiFinals[0],
      realSemiFinals[1] || semiFinals[1]
    ];
    const displayFinal = realFinal[0] || final;

    if (isMobile || isTablet) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Jane McClure Plate</h2>
            <div className="text-sm text-gray-600">Knockout Stage Tournament Bracket</div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-blue-800 mb-4">Semi Finals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displaySemiFinals.map((match, index) => (
                  <div key={match.id} className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">SF {index + 1}</div>
                    <MatchCard match={match} size="small" showPool={false} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-xl border-4 border-blue-400 shadow-lg">
              <div className="text-center mb-4">
                <Award className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <div className="text-lg font-bold text-blue-900">FINAL</div>
              </div>
              <MatchCard match={displayFinal} size="normal" showPool={false} />
              <div className="mt-4 text-center">
                <div className="text-xs text-gray-600 mb-2">Congratulations to Plate winners:</div>
                <div className="bg-white rounded-lg p-3 border-2 border-blue-400">
                  <div className="text-sm font-bold text-blue-800">
                    {displayFinal.completed && displayFinal.homeTeam && displayFinal.awayTeam
                      ? (displayFinal.homeScore! > displayFinal.awayScore! 
                          ? displayFinal.homeTeam.schoolName 
                          : displayFinal.awayTeam.schoolName)
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Jane McClure Plate</h2>
          <div className="text-sm text-gray-600">Knockout Stage Tournament Bracket</div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4 items-center">
          <div className="flex flex-col justify-center w-full md:w-[180px]">
            <div>
              <div className="mb-1 text-xs text-center font-semibold text-gray-600">Semi Final 1</div>
              <MatchCard match={displaySemiFinals[0]} size="small" showPool={false} />
            </div>
          </div>

          <div className="flex flex-col justify-center w-full md:w-[200px] my-3 md:my-0">
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-3 lg:p-4 rounded-xl border-4 border-blue-400 shadow-lg">
              <div className="text-center mb-3">
                <Award className="w-5 h-5 lg:w-6 lg:h-6 mx-auto text-blue-600 mb-1" />
                <div className="text-sm lg:text-base font-bold text-blue-900">FINAL</div>
              </div>
              <MatchCard match={displayFinal} size="small" showPool={false} />
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-600 mb-1">Plate winners:</div>
                <div className="bg-white rounded-lg p-2 border-2 border-blue-400">
                  <div className="text-xs font-bold text-blue-800">
                    {displayFinal.completed && displayFinal.homeTeam && displayFinal.awayTeam
                      ? (displayFinal.homeScore! > displayFinal.awayScore! 
                          ? displayFinal.homeTeam.schoolName 
                          : displayFinal.awayTeam.schoolName)
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center w-full md:w-[180px]">
            <div>
              <div className="mb-1 text-xs text-center font-semibold text-gray-600">Semi Final 2</div>
              <MatchCard match={displaySemiFinals[1]} size="small" showPool={false} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ShieldBracketPDF = () => {
    const shieldMatches = matches.filter(m => m.stage === 'shield');
    const realQuarterFinals = shieldMatches.filter(m => m.round === 'shield-quarter-final');
    const realSemiFinals = shieldMatches.filter(m => m.round === 'shield-semi-final');
    const realFinal = shieldMatches.filter(m => m.round === 'shield-final');

    const quarterFinalsLeft = [
      createPlaceholderMatch('shield-qf-1', 'TBD', 'TBD', '15:30', 'shield', 'shield-quarter-final'),
      createPlaceholderMatch('shield-qf-2', 'TBD', 'TBD', '16:00', 'shield', 'shield-quarter-final')
    ];

    const quarterFinalsRight = [
      createPlaceholderMatch('shield-qf-3', 'TBD', 'TBD', '16:30', 'shield', 'shield-quarter-final'),
      createPlaceholderMatch('shield-qf-4', 'TBD', 'TBD', '17:00', 'shield', 'shield-quarter-final')
    ];

    const semiFinals = [
      createPlaceholderMatch('shield-sf-1', 'Winner QF-1', 'Winner QF-2', '8:30', 'shield', 'shield-semi-final'),
      createPlaceholderMatch('shield-sf-2', 'Winner QF-3', 'Winner QF-4', '9:00', 'shield', 'shield-semi-final')
    ];

    const final = createPlaceholderMatch('shield-final', 'Winner SF-1', 'Winner SF-2', '13:00', 'shield', 'shield-final');

    const displayQuarterFinalsLeft = [
      realQuarterFinals[0] || quarterFinalsLeft[0],
      realQuarterFinals[1] || quarterFinalsLeft[1]
    ];
    const displayQuarterFinalsRight = [
      realQuarterFinals[2] || quarterFinalsRight[0],
      realQuarterFinals[3] || quarterFinalsRight[1]
    ];
    const displaySemiFinals = [
      realSemiFinals[0] || semiFinals[0],
      realSemiFinals[1] || semiFinals[1]
    ];
    const displayFinal = realFinal[0] || final;

    if (isMobile || isTablet) {
      return (
        <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-2">Jeremy Hanson Shield</h2>
            <div className="text-sm text-gray-600">Knockout Stage Tournament Bracket</div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-purple-800 mb-4">Quarter Finals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...displayQuarterFinalsLeft, ...displayQuarterFinalsRight].map((match, index) => (
                  <div key={match.id} className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">QF {index + 1}</div>
                    <MatchCard match={match} size="small" showPool={false} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-purple-800 mb-4">Semi Finals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displaySemiFinals.map((match, index) => (
                  <div key={match.id} className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">SF {index + 1}</div>
                    <MatchCard match={match} size="small" showPool={false} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-4 rounded-xl border-4 border-purple-400 shadow-lg">
              <div className="text-center mb-4">
                <Shield className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <div className="text-lg font-bold text-purple-900">FINAL</div>
              </div>
              <MatchCard match={displayFinal} size="normal" showPool={false} />
              <div className="mt-4 text-center">
                <div className="text-xs text-gray-600 mb-2">Congratulations to Shield winners:</div>
                <div className="bg-white rounded-lg p-3 border-2 border-purple-400">
                  <div className="text-sm font-bold text-purple-800">
                    {displayFinal.completed && displayFinal.homeTeam && displayFinal.awayTeam
                      ? (displayFinal.homeScore! > displayFinal.awayScore! 
                          ? displayFinal.homeTeam.schoolName 
                          : displayFinal.awayTeam.schoolName)
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-2">Jeremy Hanson Shield</h2>
          <div className="text-sm text-gray-600">Knockout Stage Tournament Bracket</div>
        </div>

        <div className="flex flex-col lg:flex-row justify-center items-center gap-3">
          <div className="flex flex-col lg:flex-row gap-3 items-center">
            <div className="flex flex-col gap-4 lg:gap-6 w-full lg:w-[140px]">
              {displayQuarterFinalsLeft.map((match, index) => (
                <div key={match.id}>
                  <div className="mb-1 text-xs text-center font-semibold text-gray-600">QF {index + 1}</div>
                  <MatchCard match={match} size="small" showPool={false} />
                </div>
              ))}
            </div>

            <div className="flex flex-col justify-center w-full lg:w-[150px]">
              <div>
                <div className="mb-1 text-xs text-center font-semibold text-gray-600">SF 1</div>
                <MatchCard match={displaySemiFinals[0]} size="small" showPool={false} />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center w-full lg:w-[180px] my-3 lg:my-0">
            <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-3 lg:p-4 rounded-xl border-4 border-purple-400 shadow-lg">
              <div className="text-center mb-3">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 mx-auto text-purple-600 mb-1" />
                <div className="text-sm lg:text-base font-bold text-purple-900">FINAL</div>
              </div>
              <MatchCard match={displayFinal} size="small" showPool={false} />
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-600 mb-1">Shield winners:</div>
                <div className="bg-white rounded-lg p-2 border-2 border-purple-400">
                  <div className="text-xs font-bold text-purple-800">
                    {displayFinal.completed && displayFinal.homeTeam && displayFinal.awayTeam
                      ? (displayFinal.homeScore! > displayFinal.awayScore! 
                          ? displayFinal.homeTeam.schoolName 
                          : displayFinal.awayTeam.schoolName)
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 items-center">
            <div className="flex flex-col justify-center w-full lg:w-[150px]">
              <div>
                <div className="mb-1 text-xs text-center font-semibold text-gray-600">SF 2</div>
                <MatchCard match={displaySemiFinals[1]} size="small" showPool={false} />
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:gap-6 w-full lg:w-[140px]">
              {displayQuarterFinalsRight.map((match, index) => (
                <div key={match.id}>
                  <div className="mb-1 text-xs text-center font-semibold text-gray-600">QF {index + 3}</div>
                  <MatchCard match={match} size="small" showPool={false} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <div className="text-lg text-gray-600">Loading brackets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-4">
      <div className="container mx-auto px-3 max-w-7xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Tournament Brackets</h1>
          <p className="text-gray-600 text-sm">Follow the knockout stage progression</p>
        </div>

        <Tabs defaultValue="cup" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="cup" className="flex items-center gap-2 text-xs">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Waugh Cup</span>
              <span className="sm:hidden">Cup</span>
            </TabsTrigger>
            <TabsTrigger value="plate" className="flex items-center gap-2 text-xs">
              <Award className="w-4 h-4" />
              Plate
            </TabsTrigger>
            <TabsTrigger value="shield" className="flex items-center gap-2 text-xs">
              <Shield className="w-4 h-4" />
              Shield
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cup">
            <Card>
              <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-blue-100 py-4">
                <CardTitle className="flex items-center justify-center gap-2 text-blue-900 text-base">
                  <Trophy className="w-5 h-5" />
                  Waugh Cup Championship Bracket
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <CupBracketPDF />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plate">
            <Card>
              <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-blue-100 py-4">
                <CardTitle className="flex items-center justify-center gap-2 text-blue-900 text-base">
                  <Award className="w-5 h-5" />
                  Plate Championship Bracket
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <PlateBracketPDF />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shield">
            <Card>
              <CardHeader className="text-center border-b bg-gradient-to-r from-purple-50 to-purple-100 py-4">
                <CardTitle className="flex items-center justify-center gap-2 text-purple-900 text-base">
                  <Shield className="w-5 h-5" />
                  Shield Championship Bracket
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ShieldBracketPDF />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}