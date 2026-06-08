import Link from "next/link";
import { getLiveMatches, getMatchesByDay, getTopScorers, getAllStandings, getGroups } from "@/lib/db";
import { tournament, sponsors } from "@/data/mock";

export const revalidate = 30;

export default async function HomePage() {
  const [liveMatches, todayMatches, topScorers, allStandings, groups] = await Promise.all([
    getLiveMatches(), getMatchesByDay(tournament.currentDay),
    getTopScorers(5), getAllStandings(), getGroups(),
  ]);
  const groupA = allStandings.filter((s: any) => s.group_name === "Group A");
  const supporting = sponsors.filter((s) => s.tier !== "title");

  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      {/* HERO */}
      <section className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full border-[60px] border-[#38B6E8] opacity-5 -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-2 mb-3 text-[#38B6E8] text-xs font-bold uppercase tracking-[3px]">
            <span className="w-2 h-2 rounded-full bg-[#38B6E8] live-dot" />
            Day {tournament.currentDay} of {tournament.totalDays} · Live now
          </div>
          <h1 className="text-white font-black uppercase leading-none mb-2" style={{ fontSize: "clamp(2.5rem,6vw,4rem)" }}>
            SACS Junior<br /><span className="text-[#F5C518]">Water Polo</span><br />Tournament
          </h1>
          <p className="text-[#7A9CC8] text-sm mb-1">{tournament.dates} · {tournament.venue}</p>
          <p className="text-[#3A5A8E] text-xs mb-6">Sponsored by <span className="text-[#38B6E8]">{tournament.sponsor}</span></p>
          <div className="flex gap-2 flex-wrap mb-8">
            {[
              { label: "32 Teams", cls: "border-[#F5C518] text-[#F5C518]" },
              { label: "2 Pools",  cls: "border-[#38B6E8] text-[#38B6E8]" },
              { label: "4 Groups", cls: "border-[#38B6E8] text-[#38B6E8]" },
              ...(liveMatches.length > 0 ? [{ label: `${liveMatches.length} Live`, cls: "border-[#2DB87A] text-[#2DB87A]" }] : []),
            ].map(({ label, cls }) => (
              <span key={label} className={`text-xs font-bold uppercase tracking-wider px-3 py-1 border ${cls}`}>{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 max-w-sm">
            {[{ v: todayMatches.length, l: "Today" }, { v: liveMatches.length, l: "Live" }, { v: 32, l: "Teams" }, { v: tournament.totalDays, l: "Days" }].map(({ v, l }) => (
              <div key={l} className="bg-white/5 border border-[#1B3A6E] p-3 text-center">
                <div className="text-[#F5C518] font-black text-2xl leading-none">{v}</div>
                <div className="text-[#7A9CC8] text-[9px] uppercase tracking-widest mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* VIDEOS */}
        <section>
          <SectionHeader title="Welcome Messages" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { tag: "Headmaster · SACS",   title: "Welcome to Tournament 2025", person: tournament.headmaster.name, dur: tournament.headmaster.duration },
              { tag: "Team Captain · SACS", title: "A message from the captain",  person: tournament.captain.name,    dur: tournament.captain.duration },
            ].map((v) => (
              <div key={v.tag} className="border border-gray-200 bg-white hover:border-[#1B6FC8] transition-colors cursor-pointer">
                <div className="bg-[#07091F] h-36 flex items-center justify-center relative overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 144" preserveAspectRatio="none">
                    <path d="M0 72 Q75 36 150 72 Q225 108 300 72 L300 144 L0 144Z" fill="#1B6FC8" opacity="0.2" />
                  </svg>
                  <div className="relative w-12 h-12 rounded-full bg-[#F5C518] flex items-center justify-center">
                    <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-[#07091F] ml-1" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[#1B6FC8] text-[10px] font-bold uppercase tracking-widest mb-1">{v.tag}</div>
                  <div className="font-black uppercase text-sm text-gray-900 mb-1">{v.title}</div>
                  <div className="text-gray-400 text-xs">{v.person} · {v.dur}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LIVE */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2DB87A] live-dot" />
              <h2 className="font-black uppercase text-lg tracking-wide text-[#2DB87A]">Live Scores</h2>
              <Link href="/scoreboard" className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveMatches.map((m: any) => (
                <div key={m.id} className="border-2 border-[#1B6FC8] bg-blue-50/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#2DB87A]">Live · {m.groups?.name}</span>
                    <span className="ml-auto text-[10px] text-gray-400">{m.pools?.name}</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <div className="font-black uppercase text-sm text-gray-900">{m.home_team?.name}</div>
                    <div className="text-center font-black text-3xl text-[#1B6FC8]">{m.home_score}–{m.away_score}</div>
                    <div className="font-black uppercase text-sm text-gray-900 text-right">{m.away_team?.name}</div>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#2DB87A] mt-2">H{m.current_half} · In progress</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TODAY */}
        <section>
          <SectionHeader title={`Day ${tournament.currentDay} Schedule`} link="/scoreboard" linkLabel="Full scoreboard →" />
          <div className="border border-gray-200 divide-y divide-gray-100">
            {todayMatches.length === 0
              ? <div className="p-6 text-center text-gray-400 text-sm">No matches scheduled today</div>
              : todayMatches.map((m: any) => {
                const isLive = m.status === "live"; const isDone = m.status === "completed";
                return (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${isLive ? "bg-blue-50 border-l-4 border-l-[#1B6FC8]" : ""}`}>
                    <span className="text-xs font-mono text-gray-400 w-10 shrink-0">{m.match_time}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm uppercase text-gray-900 truncate">{m.home_team?.name} <span className="text-gray-400 font-normal">vs</span> {m.away_team?.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{m.pools?.name} · {m.groups?.name}</div>
                    </div>
                    {m.status !== "scheduled" && <div className={`font-black text-base ${isLive ? "text-[#1B6FC8]" : "text-gray-700"}`}>{m.home_score}–{m.away_score}</div>}
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 ${isLive ? "bg-[#2DB87A] text-white" : isDone ? "bg-gray-100 text-gray-500" : "border border-gray-200 text-gray-400"}`}>
                      {isLive ? "Live" : isDone ? "FT" : m.match_time}
                    </span>
                  </div>
                );
              })
            }
          </div>
        </section>

        {/* STANDINGS */}
        <section>
          <SectionHeader title="Group A Standings" link="/standings" linkLabel="All groups →" />
          <div className="border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {["#","Team","P","W","GD","Pts"].map((h,i) => <th key={h} className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] ${i<=1?"text-left":"text-right"}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupA.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-400 text-xs">No matches played yet</td></tr>
                  : groupA.map((row: any) => {
                    const isCup = row.rank <= 4;
                    return (
                      <tr key={row.team_id} className={`hover:bg-gray-50 ${!isCup ? "opacity-40" : ""}`}>
                        <td className="px-3 py-2.5"><span className={`inline-flex w-5 h-5 items-center justify-center text-[10px] font-black ${isCup ? "bg-[#1B6FC8] text-white" : "bg-gray-100 text-gray-400"}`}>{row.rank}</span></td>
                        <td className="px-3 py-2.5 font-bold uppercase text-xs text-gray-900">{row.team_name}</td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-600">{row.played}</td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-600">{row.won}</td>
                        <td className={`px-3 py-2.5 text-right text-xs font-bold ${row.goal_diff > 0 ? "text-[#2DB87A]" : row.goal_diff < 0 ? "text-red-500" : "text-gray-400"}`}>{row.goal_diff > 0 ? "+" : ""}{row.goal_diff}</td>
                        <td className={`px-3 py-2.5 text-right text-xs font-black ${isCup ? "text-[#1B6FC8]" : "text-gray-400"}`}>{row.points}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </section>

        {/* TOP SCORERS */}
        <section>
          <SectionHeader title="Top Scorers" link="/teams" linkLabel="All players →" />
          <div className="border border-gray-200 bg-white divide-y divide-gray-100">
            {topScorers.length === 0
              ? <div className="px-4 py-6 text-center text-gray-400 text-sm">No goals scored yet</div>
              : topScorers.map((s: any, i: number) => (
                <div key={s.player_id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-sm font-black text-gray-300 w-5">{i+1}</span>
                  <div className="flex-1"><div className="font-black uppercase text-sm text-gray-900">{s.player_name}</div><div className="text-[10px] text-gray-400 uppercase">{s.team_name}</div></div>
                  <div className="text-right"><div className="font-black text-xl text-[#1B6FC8]">{s.goals}</div><div className="text-[9px] text-gray-400 uppercase tracking-widest">goals</div></div>
                </div>
              ))
            }
          </div>
        </section>

        {/* SPONSORS */}
        <section className="border-t border-gray-200 pt-8">
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-gray-400 text-center mb-6">Tournament Sponsors</div>
          <div className="flex flex-col items-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5C518] border border-[#F5C518] px-3 py-0.5 mb-3">Title Sponsor</span>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#2DB87A] flex items-center justify-center"><div className="w-3 h-3 bg-[#2DB87A]" /></div>
              <span className="font-black text-2xl text-gray-900 uppercase tracking-wide">M&amp;G Investments</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {supporting.map((s) => (
              <div key={s.id} className="border border-gray-200 p-4 text-center">
                <div className="font-black uppercase text-sm text-gray-500">{s.name}</div>
                <div className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">{s.tier === "gold" ? "Gold Sponsor" : "Silver Sponsor"}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-gray-200 px-6 py-4 flex justify-between items-center text-xs text-gray-400 max-w-7xl mx-auto">
        <span>© 2025 SACS Junior Water Polo Tournament</span>
        <Link href="/admin/dashboard" className="hover:text-[#1B6FC8] transition-colors">Admin →</Link>
      </footer>
    </div>
  );
}

function SectionHeader({ title, link, linkLabel }: { title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-6 bg-[#F5C518] shrink-0" />
      <h2 className="font-black uppercase text-lg tracking-wide text-gray-900">{title}</h2>
      {link && linkLabel && <Link href={link} className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] hover:underline">{linkLabel}</Link>}
    </div>
  );
}
