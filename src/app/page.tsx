"use client";

import ScoreInput from '@/components/admin/score-input';
import TeamRegistration from '@/components/admin/team-registration';
import PoolsView from '@/components/guests/pool-view';
import MatchDisplay from './scores/page';

const WaterPoloTournament = () => {
  return (
    <>
      <TeamRegistration />
      <PoolsView />
      <MatchDisplay />
      <ScoreInput />
    </>
  )
}

export default WaterPoloTournament;