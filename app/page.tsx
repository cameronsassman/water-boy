import Link from "next/link";
import { getLiveMatches, getMatchesByDay, getTopScorers, getAllStandings, getGroups, getTournament, getGroupStageResults, getGroupStageDiscipline } from "@/lib/db";
import { resolveGroupStandings } from "@/lib/standings";
import LiveScores from "@/components/LiveScores";

export const revalidate = 30;

// Static content — doesn't change during the tournament, so it's hardcoded
// here rather than fetched. Edit directly and redeploy if it needs to change.
const VIDEOS = [
  { role: "headmaster", person_name: "Mr J. Williams", title: "Welcome to Tournament 2025", video_url: "#", duration: "2:34" },
  { role: "captain", person_name: "James Olivier", title: "A message from the captain", video_url: "#", duration: "1:47" },
];

// tier: "headline" | "tier_one" | "tier_two" | "smaller"
// logo_url: path under /public, e.g. "/sponsors/name.png" — drop the image
// files in your public/sponsors folder and point each entry at its file.
// Leave logo_url out to just show the name as text instead.
const SPONSORS: { name: string; tier: string; logo_url?: string; is_charity?: boolean }[] = [
  // { name: "Example Headline Sponsor", tier: "headline", logo_url: "/sponsors/example.png" },
  // { name: "Example Charity",          tier: "tier_one",  logo_url: "/sponsors/charity.png", is_charity: true },
];

export default async function HomePage() {
  const tournament = await getTournament();
  const currentDay = tournament?.current_day ?? 1;
  const totalDays = tournament?.total_days ?? 4;
  const name = tournament?.name ?? "Water Polo Tournament";
  const dates = tournament?.dates ?? tournament?.date_range ?? "";
  const venue = tournament?.venue ?? "";

  const [liveMatches, todayMatches, topScorers, rawStandings, groups, groupMatches, discipline] = await Promise.all([
    getLiveMatches(), getMatchesByDay(currentDay),
    getTopScorers(5), getAllStandings(), getGroups(),
    getGroupStageResults(), getGroupStageDiscipline(),
  ]);
  const allStandings = resolveGroupStandings(rawStandings, groupMatches, discipline);

  const headmaster = VIDEOS.find((v) => v.role === "headmaster");
  const captain = VIDEOS.find((v) => v.role === "captain");
  // Headline sponsors + the charity partner (regardless of its assigned
  // tier) get pulled out into their own banner under the hero.
  const bannerSponsors = SPONSORS.filter((s) => s.tier === "headline" || s.is_charity);
  const marqueeSponsors = SPONSORS.filter((s) => !(s.tier === "headline" || s.is_charity));

  return (
    <div className="min-h-screen bg-[#FFFFFC] overflow-x-hidden">
      {/* HERO — floating bubbles */}
      <section className="relative bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-16 overflow-hidden">
        <Bubble className="w-72 h-72 -top-20 -right-16 border-[#38B6E8]/20" />
        <Bubble className="w-40 h-40 top-24 right-40 border-[#F5C518]/20 hidden sm:block" />
        <Bubble className="w-24 h-24 top-8 right-8 bg-[#1B6FC8]/10 border-0 hidden sm:block" />
        <Bubble className="w-56 h-56 -bottom-24 -left-20 border-[#1B6FC8]/20" />
        <Bubble className="w-16 h-16 bottom-10 left-24 bg-[#F5C518]/10 border-0 hidden sm:block" />

        <div className="max-w-5xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 mb-5 text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] bg-white/5 border border-[#1B3A6E] rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38B6E8] live-dot" />
            Day {currentDay} of {totalDays}
          </div>
          <h1 className="text-white font-black uppercase leading-none mb-4" style={{ fontSize: "clamp(2.25rem,6vw,4rem)" }}>
            {name}
          </h1>
          {(dates || venue) && <p className="text-[#7A9CC8] text-sm mb-8">{dates}{dates && venue ? " · " : ""}{venue}</p>}

          <div className="flex justify-center gap-4 flex-wrap">
            {[
              { v: todayMatches.length, l: "Today" },
              { v: liveMatches.length, l: "Live" },
              { v: 32, l: "Teams" },
              { v: totalDays, l: "Days" },
            ].map(({ v, l }) => (
              <div key={l} className="w-20 h-20 rounded-full bg-white/5 border-2 border-[#1B3A6E] flex flex-col items-center justify-center">
                <div className="text-[#F5C518] font-black text-xl leading-none">{v}</div>
                <div className="text-[#7A9CC8] text-[8px] uppercase tracking-widest mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <RippleDivider />
      </section>

      {/* Headline sponsor + charity partner banner */}
      {bannerSponsors.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-6">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8">
            {bannerSponsors.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-2">
                {s.logo_url
                  ? <img src={s.logo_url} alt={s.name} className="h-14 object-contain" />
                  : <span className="font-black text-xl text-gray-900 uppercase tracking-wide">{s.name}</span>
                }
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${s.is_charity ? "text-[#2DB87A] bg-green-50 border-green-200" : "text-[#F5C518] bg-yellow-50 border-[#F5C518]/40"}`}>
                  {s.is_charity ? "Charity Partner" : "Headline Sponsor"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-14">

        {/* LIVE SCORES */}
        <LiveScores initialMatches={liveMatches} />

        {/* STANDINGS — top 3 of each group */}
        <section>
          <SectionHeader title="Standings" link="/standings" linkLabel="Full tables" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((g: any) => {
              const top3 = allStandings.filter((s: any) => s.group_id === g.id).slice(0, 3);
              return (
                <div key={g.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div className="bg-[#07091F] px-4 py-2.5">
                    <span className="text-white font-black uppercase text-xs tracking-wider">{g.name}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {top3.length === 0
                      ? <div className="px-4 py-4 text-center text-gray-400 text-xs">No matches played yet</div>
                      : top3.map((row: any) => (
                        <div key={row.team_id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#1B6FC8] text-white flex items-center justify-center text-[10px] font-black shrink-0">{row.rank}</span>
                          <span className="flex-1 font-bold uppercase text-xs text-gray-900 truncate">{row.team_name}</span>
                          <span className="text-[10px] text-gray-400">{row.played}P</span>
                          <span className="font-black text-xs text-[#1B6FC8] w-6 text-right">{row.points}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TOP SCORERS */}
        <section>
          <SectionHeader title="Top Scorers" link="/teams" linkLabel="All players" />
          <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {topScorers.length === 0
              ? <div className="px-4 py-8 text-center text-gray-400 text-sm">No goals scored yet</div>
              : topScorers.map((s: any, i: number) => (
                <div key={s.player_id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    i === 0 ? "bg-yellow-100 text-yellow-800" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1"><div className="font-black uppercase text-sm text-gray-900">{s.player_name}</div><div className="text-[10px] text-gray-400 uppercase">{s.team_name}</div></div>
                  <div className="text-right"><div className="font-black text-xl text-[#1B6FC8]">{s.goals}</div><div className="text-[9px] text-gray-400 uppercase tracking-widest">goals</div></div>
                </div>
              ))
            }
          </div>
        </section>

        {/* WELCOME VIDEOS */}
        {(headmaster || captain) && (
          <section>
            <SectionHeader title="Welcome Messages" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[headmaster, captain].filter(Boolean).map((v: any) => (
                <a key={v.role} href={v.video_url} target="_blank" rel="noopener noreferrer"
                  className="rounded-2xl border border-gray-200 bg-white hover:border-[#1B6FC8] transition-colors overflow-hidden">
                  <div className="bg-[#07091F] h-36 flex items-center justify-center relative overflow-hidden">
                    <Bubble className="w-24 h-24 -top-8 -left-8 bg-[#1B6FC8]/10 border-0" />
                    <Bubble className="w-16 h-16 bottom-4 right-8 bg-[#F5C518]/10 border-0" />
                    <div className="relative w-12 h-12 rounded-full bg-[#F5C518] flex items-center justify-center">
                      <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-[#07091F] ml-1" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[#1B6FC8] text-[10px] font-bold uppercase tracking-widest mb-1">{v.role === "headmaster" ? "Headmaster" : "Team Captain"}</div>
                    <div className="font-black uppercase text-sm text-gray-900 mb-1">{v.title}</div>
                    <div className="text-gray-400 text-xs">{v.person_name}{v.duration ? ` · ${v.duration}` : ""}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* SPONSORS — infinite scrolling marquee */}
        {marqueeSponsors.length > 0 && (
          <section className="border-t border-gray-100 pt-10 -mx-6 px-6">
            <div className="text-[10px] font-bold uppercase tracking-[3px] text-gray-400 text-center mb-6">Tournament Sponsors</div>
            <div className="relative w-full overflow-hidden">
              <div className="flex items-center gap-12 w-max animate-marquee">
                {[...marqueeSponsors, ...marqueeSponsors].map((s, i) => (
                  s.logo_url
                    ? <img key={i} src={s.logo_url} alt={s.name}
                        className={`object-contain shrink-0 opacity-80 ${s.tier === "tier_one" ? "h-10" : s.tier === "tier_two" ? "h-8" : "h-6"}`} />
                    : <span key={i} className="text-xs font-semibold uppercase text-gray-400 shrink-0">{s.name}</span>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-gray-200 px-6 py-4 flex justify-between items-center text-xs text-gray-400 max-w-5xl mx-auto">
        <span>© {new Date().getFullYear()} {name}</span>
        <Link href="/admin/dashboard" className="hover:text-[#1B6FC8] transition-colors">Admin →</Link>
      </footer>
    </div>
  );
}

function Bubble({ className = "" }: { className?: string }) {
  return <div className={`absolute rounded-full border pointer-events-none ${className}`} />;
}

function RippleDivider() {
  return (
    <svg className="absolute bottom-0 left-0 w-full text-[#FFFFFC]" viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ height: 24 }}>
      <path d="M0 20 Q150 0 300 20 T600 20 T900 20 T1200 20 V40 H0 Z" fill="currentColor" />
    </svg>
  );
}

function SectionHeader({ title, link, linkLabel, dot }: { title: string; link?: string; linkLabel?: string; dot?: "live" }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {dot === "live"
        ? <span className="w-3 h-3 rounded-full bg-[#2DB87A] live-dot shrink-0" />
        : <span className="w-3 h-3 rounded-full bg-[#F5C518] shrink-0" />}
      <h2 className="font-black uppercase text-lg tracking-wide text-gray-900">{title}</h2>
      {link && linkLabel && <Link href={link} className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] hover:underline">{linkLabel} →</Link>}
    </div>
  );
}