"use client";
import { useState } from "react";
import { knockoutSection, type FinalRow } from "@/lib/finalStandings";

const SECTION_STYLE: Record<string, string> = {
  Cup: "bg-[#C8960A] text-white",
  Plate: "bg-gray-500 text-white",
  Shield: "bg-[#1B6FC8] text-white",
  Playoff: "bg-[#07091F] text-white",
};

export default function FinalStandingsClient({ knockout, festival }: { knockout: FinalRow[]; festival: FinalRow[] }) {
  const [tab, setTab] = useState<"knockout" | "festival">("knockout");
  const rows = tab === "knockout" ? knockout : festival;
  const decided = rows.filter((r) => r.status === "final").length;

  return (
    <div className="min-h-screen bg-[#EAF6FE]">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        <div className="flex gap-2">
          {([["knockout", "Knockout Standings"], ["festival", "Festival Standings"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                tab === id
                  ? "bg-[#07091F] text-white shadow-sm"
                  : "bg-white border border-[#CFE6F8] text-[#5C7B9C] hover:text-[#07091F] hover:border-[#1B6FC8]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[#CFE6F8] bg-white overflow-hidden shadow-sm">
          <div className="bg-[#07091F] px-5 py-3.5 flex items-center justify-between">
            <span className="text-white font-black uppercase text-sm tracking-wider">
              {tab === "knockout" ? "Cup · Plate · Shield · Playoffs" : "Festival"}
            </span>
            <span className="text-[#38B6E8] text-[10px] font-bold uppercase tracking-widest">{decided}/16 decided</span>
          </div>
          <ul className="divide-y divide-[#CFE6F8]">
            {rows.map((r) => (
              <li key={r.position} className="flex items-center gap-3 px-4 py-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  r.status === "final" ? "bg-[#1B6FC8] text-white" : "bg-white text-gray-400 border border-[#CFE6F8]"
                }`}>{r.position}</span>
                <div className="flex-1 min-w-0">
                  {r.teamName
                    ? <div className="truncate text-sm font-black uppercase text-gray-900">{r.teamName}</div>
                    : <div className="text-sm italic text-gray-400">TBD{r.note ? ` · ${r.note}` : ""}</div>}
                </div>
                {tab === "knockout" && (
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 ${SECTION_STYLE[knockoutSection(r.position)]}`}>
                    {knockoutSection(r.position)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}