// app/admin/admin-portal/page.tsx
"use client"

import { useState, useEffect } from 'react';
import ScoreInput from "../scorecard/page";
import TeamRegistration from "../teams/page";
import { tournamentUtils } from '@/utils/tournament-logic';
import { storageUtils } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { 
  Trophy,
  Award,
  LogOut
} from 'lucide-react';
import ManualFixtureEntry from '@/components/admin/fixtures-form';

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

    const { logout } = useAuth();

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

    const getTournamentPhase = () => {
        if (!isAllocated) return { phase: 'setup', label: 'Team Setup', color: 'bg-gray-500' };
        if (!matchesGenerated) return { phase: 'ready', label: 'Ready to Generate', color: 'bg-blue-500' };
        if (!tournamentStats.poolStageComplete) return { phase: 'pool', label: 'Pool Stage', color: 'bg-green-500' };
        if (!tournamentStats.knockoutGenerated) return { phase: 'knockout-ready', label: 'Knockout Ready', color: 'bg-orange-500' };
        return { phase: 'knockout', label: 'Knockout Stage', color: 'bg-purple-500' };
    };

    const currentPhase = getTournamentPhase();

    return (
        <div className="container mx-auto p-6">
            <div className="text-center">
                <div className="flex items-center justify-between mb-4">
                    <div></div> {/* Spacer for alignment */}
                    <h1 className="text-4xl font-bold text-gray-900">Tournament Administration</h1>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={logout}
                        className="flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge className={`${currentPhase.color} text-white px-4 py-2`}>
                        {currentPhase.label}
                    </Badge>
                    <Badge variant="outline" className="px-4 py-2">
                        {totalTeams} Teams Registered
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="scorecard" className="w-full mt-8">
                <TabsList className="grid w-full grid-cols-3 h-12">
                    <TabsTrigger value="scorecard" className="flex items-center gap-2 text-base">
                        <Trophy className="w-5 h-5" />
                        Match Scorecards
                    </TabsTrigger>
                    <TabsTrigger value="registration" className="flex items-center gap-2 text-base">
                        <Award className="w-5 h-5" />
                        Team Registration
                    </TabsTrigger>
                    <TabsTrigger value="fixtures" className="flex items-center gap-2 text-base">
                        <Award className="w-5 h-5" />
                        Fixtures
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="scorecard" className="mt-8">
                    <ScoreInput />
                </TabsContent>

                <TabsContent value="registration" className="mt-8">
                    <TeamRegistration />
                </TabsContent>

                <TabsContent value="fixtures" className="mt-8">
                    <ManualFixtureEntry />
                </TabsContent>
            </Tabs>
        </div>
    )
}