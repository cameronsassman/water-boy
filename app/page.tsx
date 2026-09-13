import Link from "next/link";
import { getLiveMatches, getMatchesByDay, getTopScorers, getGroups, getTournament } from "@/lib/db";
import { getCachedGroupStandings } from "@/lib/standings";
import Image from "next/image";

export const revalidate = 30;

const VIDEOS = [
  {
    role: "headmaster",
    person_name: "Mr J. Williams",
    title: "Welcome to Tournament 2025",
    video_url: "",
    duration: "2:34",
  },
  {
    role: "captain",
    person_name: "James Olivier",
    title: "A message from the captain",
    video_url: "",
    duration: "1:47",
  },
];

const SPONSORS: { name: string; tier: string; logo_url?: string; is_charity?: boolean }[] = [
  { name: "RSAWEB", tier: "tier_one", logo_url: "/assets/rsaweb.png" },
  { name: "M&G Investment", tier: "headline", logo_url: "/assets/m-g.png" },
  { name: "Hudsons", tier: "tier_one", logo_url: "/assets/hudsons.png" },
  { name: "First National Bank", tier: "tier_one", logo_url: "/assets/fnb.png" },
  { name: "Sports Science Physiotherapy Centre", tier: "tier_two", logo_url: "/assets/sspc.png" },
  { name: "Sofaworx", tier: "tier_two", logo_url: "/assets/sofaworx.png" },
  { name: "Stikka", tier: "tier_two", logo_url: "/assets/stikka.png" },
  { name: "Geddes Capital", tier: "smaller", logo_url: "/assets/geddes.jpeg" },
  { name: "Shout Music Company", tier: "smaller", logo_url: "/assets/shout.png" },
  { name: "KY-ND", tier: "smaller", logo_url: "/assets/ky-nd.png", is_charity: true },
];

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export default async function HomePage() {
  const tournament = await getTournament();
  const currentDay = tournament?.current_day ?? 1;
  const totalDays = tournament?.total_days ?? 4;
  const name = tournament?.name ?? "Water Polo Tournament";
  const dates = tournament?.dates ?? tournament?.date_range ?? "";
  const venue = tournament?.venue ?? "";

  const [liveMatches, todayMatches, topScorers, allStandings, groups] = await Promise.all([
    getLiveMatches(),
    getMatchesByDay(currentDay),
    getTopScorers(5),
    getCachedGroupStandings(),
    getGroups(),
  ]);

  const headmaster = VIDEOS.find((v) => v.role === "headmaster");
  const captain = VIDEOS.find((v) => v.role === "captain");
  const bannerSponsors = SPONSORS.filter((s) => s.tier === "headline" || s.is_charity);
  const marqueeSponsors = SPONSORS;

  const featuredMatches = liveMatches.slice(0, 2);

  const liveIds = new Set(liveMatches.map((m: any) => m.id));
  const upcomingMatches = todayMatches
    .filter((m: any) => !liveIds.has(m.id) && m.status !== "completed" && m.status !== "finished")
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-stretch">
          <div className="relative bg-white rounded-3xl border border-[#CFE6F8] shadow-sm px-8 py-9 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between flex-wrap">
                <Image
                  src="/assets/logo/sacs-wp-logo.png"
                  alt={name}
                  width={857}
                  height={720}
                  priority
                  className="w-auto h-auto max-h-[130px] sm:max-h-[160px]"
                />

                {bannerSponsors.length > 0 && (
                  <div className="flex flex-col items-start gap-4">
                    {bannerSponsors.map((s) =>
                      s.logo_url ? (
                        <img
                          key={s.name}
                          src={s.logo_url}
                          alt={s.name}
                          className="h-20 sm:h-24 object-contain"
                        />
                      ) : (
                        <span key={s.name} className="font-bold text-2xl text-[#07091F]">
                          {s.name}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>

              {(venue || dates) && (
                <p className="mt-4 text-[#5C7B9C] text-sm font-medium">
                  {venue}
                  {venue && dates ? " · " : ""}
                  {dates}
                </p>
              )}
            </div>
          </div>

          <div className="relative bg-[#07091F] rounded-3xl overflow-hidden px-7 py-7 flex flex-col min-h-[260px]">
            <Bubble className="w-40 h-40 -top-16 -right-10 bg-white/[0.04] border-0" />
            <Bubble className="w-28 h-28 -bottom-10 -left-8 bg-white/[0.04] border-0" />

            {featuredMatches.length > 0 ? (
              <div className="relative flex-1 flex flex-col justify-center gap-6 divide-y divide-white/10">
                {featuredMatches.map((match: any, i: number) => (
                  <div key={match.id} className={`text-center ${i > 0 ? "pt-6" : ""}`}>
                    <p className="text-[#38B6E8] text-xs font-bold uppercase tracking-widest mb-4">
                      {match.pool_name ?? "Main Pool"}
                      {match.quarter ? ` · Q${match.quarter}` : ""}
                      {match.clock ? ` · ${match.clock}` : ""}
                    </p>

                    <div className="flex items-center justify-center gap-6">
                      <TeamBadge label={initials(match.home_team_name ?? "")} />
                      <span className="font-black text-4xl text-white tabular-nums">
                        {match.home_score}
                        <span className="text-[#38B6E8] mx-2">–</span>
                        {match.away_score}
                      </span>
                      <TeamBadge label={initials(match.away_team_name ?? "")} />
                    </div>

                    <div className="flex items-center justify-center gap-16 mt-2">
                      <span className="text-white text-xs font-bold uppercase tracking-wider">
                        {match.home_team_name}
                      </span>
                      <span className="text-white text-xs font-bold uppercase tracking-wider">
                        {match.away_team_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative flex-1 flex items-center justify-center text-center text-white/50 text-sm">
                No matches live right now
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-10">
            <section id="live">
              {upcomingMatches.length === 0 ? (
                <div className="rounded-2xl border border-[#CFE6F8] bg-white px-4 py-8 text-center text-gray-400 text-sm">
                  No upcoming matches right now
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingMatches.map((match: any) => (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-[#CFE6F8] bg-[#F3FAFF] px-5 py-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5C7B9C]">
                          {match.pool_name ?? "Main Pool"}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8]">
                          Starts {match.start_time ?? match.scheduled_time ?? "TBC"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex-1 text-left font-bold uppercase text-xs text-gray-900 truncate">
                          {match.home_team_name}
                        </span>
                        <span className="shrink-0 font-black text-sm text-white bg-[#07091F] rounded-full px-4 py-1.5 tabular-nums">
                          {match.home_score ?? 0}–{match.away_score ?? 0}
                        </span>
                        <span className="flex-1 text-right font-bold uppercase text-xs text-gray-900 truncate">
                          {match.away_team_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="standings">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map((g: any) => {
                  const top3 = allStandings.filter((s: any) => s.group_id === g.id).slice(0, 3);
                  return (
                    <div
                      key={g.id}
                      className="rounded-2xl border border-[#CFE6F8] bg-white overflow-hidden"
                    >
                      <div className="bg-[#07091F] px-4 py-2.5 flex items-center justify-between">
                        <span className="text-white font-black uppercase text-xs tracking-wider">
                          {g.name}
                        </span>
                        <span className="text-white/40 font-bold uppercase text-[9px] tracking-widest">
                          Pts
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {top3.length === 0 ? (
                          <div className="px-4 py-4 text-center text-gray-400 text-xs">
                            No matches played yet
                          </div>
                        ) : (
                          top3.map((row: any) => (
                            <div key={row.team_id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="w-5 text-gray-400 font-bold text-xs shrink-0">
                                {row.rank}
                              </span>
                              <span className="flex-1 font-bold uppercase text-xs text-gray-900 truncate">
                                {row.team_name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {row.played}P · {row.point_diff >= 0 ? "+" : ""}
                                {row.point_diff}
                              </span>
                              <span className="font-black text-sm text-[#1B6FC8] w-6 text-right">
                                {row.points}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section id="scorers" className="self-start">
            <div className="rounded-2xl border border-[#CFE6F8] bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-black uppercase text-sm tracking-wide text-[#07091F]">
                  Top Scorers
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {topScorers.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">
                    No goals scored yet
                  </div>
                ) : (
                  topScorers.map((s: any, i: number) => (
                    <div key={s.player_id} className="flex items-center gap-3 px-5 py-3.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                          i === 0 ? "text-[#1B6FC8]" : "text-gray-300"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-900 truncate">
                          {s.player_name}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                          {s.team_name}
                        </div>
                      </div>
                      <div className="font-black text-lg text-[#07091F]">{s.goals}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {(headmaster || captain) && (
          <section id="welcome">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[headmaster, captain].filter(Boolean).map((v: any) => {
                const hasLink = Boolean(v.video_url);
                const cardClassName =
                  "rounded-2xl border border-[#CFE6F8] bg-white hover:border-[#1B6FC8] transition-colors overflow-hidden";
                const content = (
                  <>
                    <div className="bg-[#07091F] h-40 flex items-center justify-center relative overflow-hidden">
                      <Bubble className="w-24 h-24 -top-8 -left-8 bg-[#1B6FC8]/10 border-0" />
                      <Bubble className="w-16 h-16 bottom-4 right-8 bg-[#F5C518]/10 border-0" />
                      <div className="relative w-14 h-14 rounded-full bg-[#F5C518] flex items-center justify-center">
                        <div className="w-0 h-0 border-y-[11px] border-y-transparent border-l-[20px] border-l-[#07091F] ml-1" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-[#1B6FC8] text-[10px] font-bold uppercase tracking-widest mb-1">
                        {v.role === "headmaster" ? "Headmaster" : "Team Captain"}
                      </div>
                      <div className="font-black uppercase text-sm text-gray-900 mb-1">
                        {v.title}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {v.person_name}
                        {v.duration ? ` · ${v.duration}` : ""}
                      </div>
                    </div>
                  </>
                );

                return hasLink ? (
                  <a
                    key={v.role}
                    href={v.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={v.role} className={cardClassName}>
                    {content}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {marqueeSponsors.length > 0 && (
          <section className="border-t border-[#CFE6F8] pt-8 -mx-6 px-6">
            <div className="relative w-full overflow-hidden">
              <div className="flex items-center gap-12 w-max animate-marquee">
                {[...marqueeSponsors, ...marqueeSponsors].map((s, i) =>
                  s.logo_url ? (
                    <img
                      key={i}
                      src={s.logo_url}
                      alt={s.name}
                      className="h-20 object-contain shrink-0 opacity-80"
                    />
                  ) : (
                    <span
                      key={i}
                      className="text-xs font-semibold uppercase text-gray-400 shrink-0"
                    >
                      {s.name}
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-[#CFE6F8] pt-5 flex justify-between items-center text-xs text-[#9FB6CC]">
          <span>
            © {new Date().getFullYear()} {name}
          </span>
        </footer>
      </div>
    </div>
  );
}

function TeamBadge({ label }: { label: string }) {
  return (
    <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center font-black text-white text-sm shrink-0">
      {label}
    </span>
  );
}

function Bubble({ className = "" }: { className?: string }) {
  return <div className={`absolute rounded-full border pointer-events-none ${className}`} />;
}