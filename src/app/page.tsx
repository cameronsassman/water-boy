"use client";

import ScoreInput from '@/components/admin/score-input';
import TeamRegistration from '@/components/admin/team-registration';
import PoolsView from '@/components/guests/pool-view';
import TournamentDashboard from '@/components/guests/tournament-dashboard';
import MatchDisplay from './scores/page';

const WaterPoloTournament = () => {
  return (
    <>
      <TeamRegistration />
      <PoolsView />
      <MatchDisplay />
      <ScoreInput />
      <TournamentDashboard />
    </>
  )
}

export default WaterPoloTournament;