// app/admin/admin-portal/page.tsx
"use client"

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy,
  Award,
  LogOut,
  Users
} from 'lucide-react';

// Import your admin components
import ScorecardPage from "../scorecard/page";
import TeamsPage from "../teams/page"
import FixturesPage from "../fixtures/page";

export default function AdminPortal() {
  const { logout } = useAuth();

  // Simple team count - you can replace this with actual data if needed
  const totalTeams = 0; // Placeholder

  return (
    <div className="container mx-auto p-6">
      <div className="text-center">
        <div className="flex items-center justify-between mb-4">
          <div></div>
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
          <Badge variant="outline" className="px-4 py-2">
            <Users className="w-4 h-4 mr-1" />
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
          <ScorecardPage />
        </TabsContent>

        <TabsContent value="registration" className="mt-8">
          <TeamsPage />
        </TabsContent>

        <TabsContent value="fixtures" className="mt-8">
          <FixturesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}