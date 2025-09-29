"use client"

import { useState, useEffect } from 'react';
import ScoreInput from "./scorecard/page"
import TeamRegistration from "./teams/page"
import { tournamentUtils } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Trophy, 
  Settings, 
  CalendarDays, 
  RefreshCw, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Award,
  Database
} from 'lucide-react';

export default function AdminPortal() {
    const [totalTeams, setTotalTeams] = useState(0);
    const [isAllocated, setIsAllocated] = useState(false);
    const [matchesGenerated, setMatchesGenerated] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tournamentStats, setTournamentStats] = useState({
        totalMatches: 0,
        completedMatches: 0,
        pendingMatches: 0,
        poolStageComplete: false,
        knockoutGenerated: false
    });

    useEffect(() => {
        loadTournamentData();
    }, []);

    const loadTournamentData = () => {
        try {
            const teams = storageUtils.getTeams();
            const allocated = tournamentUtils.arePoolsAllocated();
            const poolMatchesGenerated = tournamentUtils.arePoolMatchesGenerated();
            const scheduleGenerated = localStorage.getItem('water-polo-tournament-schedule-generated') === 'true';
            const matchesReady = poolMatchesGenerated && scheduleGenerated;

            setTotalTeams(teams.length);
            setIsAllocated(allocated);
            setMatchesGenerated(matchesReady);

            if (matchesReady) {
                const tournament = storageUtils.getTournament();
                const allMatches = tournament.matches;
                const completedMatches = allMatches.filter(match => {
                    const result = storageUtils.getMatchResult(match.id);
                    return result?.completed || false;
                });

                setTournamentStats({
                    totalMatches: allMatches.length,
                    completedMatches: completedMatches.length,
                    pendingMatches: allMatches.length - completedMatches.length,
                    poolStageComplete: tournamentUtils.isPoolStageComplete(),
                    knockoutGenerated: tournamentUtils.areKnockoutBracketsGenerated()
                });
            }
        } catch (error) {
            console.error('Error loading tournament data:', error);
        }
    };

    const handleGenerateMatches = async () => {
        setIsGenerating(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            tournamentUtils.generatePoolMatches();
            
            // Note: The actual schedule generation would happen in the scores page
            // This just triggers the pool matches generation
            
            loadTournamentData();
        } catch (error) {
            console.error('Error generating matches:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateKnockout = async () => {
        if (!tournamentUtils.isPoolStageComplete()) {
            alert('Pool stage must be completed before generating knockout brackets');
            return;
        }

        setIsGenerating(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            tournamentUtils.generateCupBracket();
            
            loadTournamentData();
        } catch (error) {
            console.error('Error generating knockout brackets:', error);
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
            tournamentUtils.clearKnockoutAndFestivalMatches();
            
            // Clear scheduled matches from localStorage
            localStorage.removeItem('water-polo-tournament-scheduled-matches');
            localStorage.removeItem('water-polo-tournament-schedule-generated');
            
            loadTournamentData();
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
            
            storageUtils.clearPoolMatchResults();
            
            loadTournamentData();
        } catch (error) {
            console.error('Error clearing results:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const getTournamentPhase = () => {
        if (!isAllocated) return { phase: 'setup', label: 'Team Setup', color: 'bg-gray-500' };
        if (!matchesGenerated) return { phase: 'ready', label: 'Ready to Generate', color: 'bg-blue-500' };
        if (!tournamentStats.poolStageComplete) return { phase: 'pool', label: 'Pool Stage', color: 'bg-green-500' };
        if (!tournamentStats.knockoutGenerated) return { phase: 'knockout-ready', label: 'Knockout Ready', color: 'bg-orange-500' };
        return { phase: 'knockout', label: 'Knockout Stage', color: 'bg-purple-500' };
    };

    const currentPhase = getTournamentPhase();

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                    <h1 className="text-4xl font-bold text-gray-900">Tournament Administration</h1>
                </div>
                <p className="text-lg text-gray-600">
                    Manage your U14 Water Polo Tournament
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge className={`${currentPhase.color} text-white px-4 py-2`}>
                        {currentPhase.label}
                    </Badge>
                    <Badge variant="outline" className="px-4 py-2">
                        {totalTeams} Teams Registered
                    </Badge>
                </div>
            </div>

            {/* Tournament Overview Dashboard */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        Tournament Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                            <div className="text-2xl font-bold text-blue-800">{totalTeams}</div>
                            <div className="text-sm text-blue-600">Teams</div>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-green-600" />
                            <div className="text-2xl font-bold text-green-800">{tournamentStats.totalMatches}</div>
                            <div className="text-sm text-green-600">Total Matches</div>
                        </div>
                        
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                            <div className="text-2xl font-bold text-orange-800">{tournamentStats.completedMatches}</div>
                            <div className="text-sm text-orange-600">Completed</div>
                        </div>
                        
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                            <div className="text-2xl font-bold text-purple-800">{tournamentStats.pendingMatches}</div>
                            <div className="text-sm text-purple-600">Pending</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {matchesGenerated && tournamentStats.totalMatches > 0 && (
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Tournament Progress</span>
                                <span>{Math.round((tournamentStats.completedMatches / tournamentStats.totalMatches) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${(tournamentStats.completedMatches / tournamentStats.totalMatches) * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tournament Management Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-600" />
                        Tournament Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Match Generation Section */}
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-blue-600" />
                            Match Generation
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {!matchesGenerated ? (
                                <Button
                                    onClick={handleGenerateMatches}
                                    disabled={!isAllocated || isGenerating}
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
                                            Generate Pool Fixtures
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleGenerateMatches}
                                        disabled={isGenerating}
                                        variant="outline"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Re-generating...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Re-generate Pool Fixtures
                                            </>
                                        )}
                                    </Button>

                                    {tournamentStats.poolStageComplete && !tournamentStats.knockoutGenerated && (
                                        <Button
                                            onClick={handleGenerateKnockout}
                                            disabled={isGenerating}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Trophy className="w-4 h-4 mr-2" />
                                                    Generate Knockout Brackets
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </>
                            )}
                            
                            {!isAllocated && (
                                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm">Teams must be allocated to pools first</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Management Section */}
                    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-800">
                            <AlertTriangle className="w-5 h-5" />
                            Data Management (Danger Zone)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={handleClearResults}
                                disabled={isGenerating || !matchesGenerated}
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear All Results
                            </Button>
                            
                            <Button
                                onClick={handleClearMatches}
                                disabled={isGenerating}
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear All Matches & Results
                            </Button>
                        </div>
                        <p className="text-xs text-red-600 mt-2">
                            ⚠️ These actions cannot be undone. Use with extreme caution.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Main Admin Tabs */}
            <Tabs defaultValue="scorecard" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="scorecard" className="flex items-center gap-2 text-base">
                        <Trophy className="w-5 h-5" />
                        Match Scorecards
                    </TabsTrigger>
                    <TabsTrigger value="registration" className="flex items-center gap-2 text-base">
                        <Award className="w-5 h-5" />
                        Team Registration
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="scorecard" className="mt-8">
                    <ScoreInput />
                </TabsContent>

                <TabsContent value="registration" className="mt-8">
                    <TeamRegistration />
                </TabsContent>
            </Tabs>
        </div>
    )
}