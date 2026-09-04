"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SELECT = "*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), groups(name), pools(name)";

export default function LiveScores({ initialMatches }: { initialMatches: any[] }) {
  const [matches, setMatches] = useState<any[]>(initialMatches);

  useEffect(() => {
    // A match can start or stop being live, not just have its score change —
    // so on any change to the matches table, refetch the live list fresh
    // rather than trying to patch individual rows in place.
    const ch = supabase.channel("home-live-matches")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, async () => {
        const { data, error } = await supabase.from("matches").select(SELECT).eq("status", "live").order("match_time");
        if (error) { console.error("LiveScores refresh failed:", { message: error.message, details: error.details, hint: error.hint }); return; }
        setMatches(data ?? []);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-3 h-3 rounded-full bg-[#2DB87A] live-dot shrink-0" />
        <h2 className="font-black uppercase text-lg tracking-wide text-gray-900">Live Scores</h2>
        <Link href="/scoreboard" className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#1B6FC8] hover:underline">View all →</Link>
      </div>
      {matches.length === 0
        ? <div className="rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">No matches live right now</div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matches.map((m: any) => (
              <div key={m.id} className="relative rounded-2xl border-2 border-[#1B6FC8] bg-blue-50/40 p-5 overflow-hidden">
                <div className="absolute rounded-full pointer-events-none w-20 h-20 -top-8 -right-8 bg-[#1B6FC8]/5" />
                <div className="relative flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#2DB87A] live-dot" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2DB87A]">Live · {m.groups?.name}</span>
                </div>
                <div className="relative grid grid-cols-3 items-center gap-2">
                  <div className="font-black uppercase text-sm text-gray-900">{m.home_team?.name}</div>
                  <div className="text-center font-black text-3xl text-[#1B6FC8]">{m.home_score}–{m.away_score}</div>
                  <div className="font-black uppercase text-sm text-gray-900 text-right">{m.away_team?.name}</div>
                </div>
                <div className="relative text-[10px] font-bold uppercase tracking-widest text-[#2DB87A] mt-2">H{m.current_half} · In progress</div>
              </div>
            ))}
          </div>
      }
    </section>
  );
}