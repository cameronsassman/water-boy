"use client";

import TeamRegistration from '@/components/admin/team-registration';
import PoolsView from '@/components/guests/pool-view';
import MatchDisplay from './scores/page';

const WaterPoloTournament = () => {
  return (
    <>
      <TeamRegistration />
      <PoolsView />
      <MatchDisplay />
    </>
  )
}

export default WaterPoloTournament;