import { getBracketSlots } from "@/lib/db";

export const revalidate = 60;

type Slot = { id: string; bracket: string; round: string; slot_number: number; home_team_id: string|null; away_team_id: string|null; home_team: { name: string }|null; away_team: { name: string }|null };

function SlotDisplay({ slot }: { slot: Slot }) {
  const filled = slot.home_team_id && slot.away_team_id;
  return (
    <div className={`border p-3 ${filled ? "border-[#1B6FC8] bg-white" : "border-dashed border-gray-300 bg-gray-50 opacity-60"}`}>
      <div className="font-black uppercase text-xs text-gray-900 mb-1 truncate">{slot.home_team?.name ?? <span className="text-gray-300 italic font-normal">TBD</span>}</div>
      <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-1">vs</div>
      <div className="font-black uppercase text-xs text-gray-900 truncate">{slot.away_team?.name ?? <span className="text-gray-300 italic font-normal">TBD</span>}</div>
    </div>
  );
}

export default async function BracketPage() {
  const allSlots = (await getBracketSlots()) as Slot[];
  const get = (bracket: string, round: string) =>
    allSlots.filter((s) => s.bracket === bracket && s.round === round).sort((a,b) => a.slot_number - b.slot_number);

  return (
    <div className="min-h-screen bg-[#FFFFFC]">
      <div className="bg-[#07091F] border-b-4 border-[#1B6FC8] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-[#38B6E8] text-xs font-bold uppercase tracking-[3px] mb-2">Knockout Stage · Day 3–4</div>
          <h1 className="text-white font-black uppercase text-4xl leading-none">Bracket</h1>
          <p className="text-[#7A9CC8] text-sm mt-1">Cup · Shield · Plate · Festival</p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="border border-[#C8960A]/30 bg-[#C8960A]/5 p-3">
            <div className="font-black uppercase text-[#C8960A] mb-1">🏆 Cup</div>
            <div className="text-gray-500 text-[11px]">Top 4 per group → R16 → QF → SF → Final</div>
            <div className="text-gray-400 text-[10px] mt-1 italic">R16 losers → Shield QF · QF losers → Plate SF</div>
          </div>
          <div className="border border-[#1B6FC8]/30 bg-[#1B6FC8]/5 p-3">
            <div className="font-black uppercase text-[#1B6FC8] mb-1">🛡 Shield</div>
            <div className="text-gray-500 text-[11px]">Cup R16 losers → QF → SF → Final</div>
            <div className="text-gray-400 text-[10px] mt-1 italic">QF losers → Festival</div>
          </div>
          <div className="border border-gray-300 bg-gray-50 p-3">
            <div className="font-black uppercase text-gray-500 mb-1">🎉 Festival</div>
            <div className="text-gray-500 text-[11px]">Bottom 4 per group (16) + Shield QF losers (4) = 20 teams</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* CUP */}
        <section>
          <div className="flex items-center gap-3 mb-4"><span className="bg-[#C8960A] text-white font-black uppercase text-sm px-4 py-1.5 tracking-widest">🏆 Cup</span><span className="text-sm text-gray-500">Top 4 per group · 16 teams</span></div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mb-2">Round of 16</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{get("cup","r16").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
          <div className="text-[10px] text-gray-400 italic border-l-2 border-gray-200 pl-2 my-2">Winners → Cup QF · Losers → Shield QF</div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mt-4 mb-2">Quarter-finals</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{get("cup","qf").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
          <div className="text-[10px] text-gray-400 italic border-l-2 border-gray-200 pl-2 my-2">Winners → Cup SF · Losers → Plate SF</div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mt-4 mb-2">Semi-finals</div>
          <div className="grid grid-cols-2 gap-3 max-w-lg">{get("cup","sf").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mt-4 mb-2">Final</div>
          <div className="max-w-xs">{get("cup","final").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
        </section>

        <div className="border-t border-gray-200" />

        {/* SHIELD */}
        <section>
          <div className="flex items-center gap-3 mb-4"><span className="bg-[#1B6FC8] text-white font-black uppercase text-sm px-4 py-1.5 tracking-widest">🛡 Shield</span><span className="text-sm text-gray-500">Cup R16 losers · 8 teams</span></div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mb-2">Quarter-finals</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{get("shield","qf").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
          <div className="text-[10px] text-gray-400 italic border-l-2 border-gray-200 pl-2 my-2">Winners → Shield SF · Losers → Festival</div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mt-4 mb-2">Semi-finals</div>
          <div className="grid grid-cols-2 gap-3 max-w-lg">{get("shield","sf").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mt-4 mb-2">Final</div>
          <div className="max-w-xs">{get("shield","final").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
        </section>

        <div className="border-t border-gray-200" />

        {/* PLATE */}
        <section>
          <div className="flex items-center gap-3 mb-4"><span className="bg-gray-500 text-white font-black uppercase text-sm px-4 py-1.5 tracking-widest">🥉 Plate</span><span className="text-sm text-gray-500">Cup QF losers · 4 teams</span></div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mb-2">Semi-finals</div>
          <div className="grid grid-cols-2 gap-3 max-w-lg">{get("plate","sf").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-[#1B6FC8] mt-4 mb-2">Final</div>
          <div className="max-w-xs">{get("plate","final").map((s) => <SlotDisplay key={s.id} slot={s} />)}</div>
        </section>

        <div className="border-t border-gray-200" />

        {/* FESTIVAL */}
        <section className="pb-8">
          <div className="flex items-center gap-3 mb-4"><span className="bg-[#2DB87A] text-white font-black uppercase text-sm px-4 py-1.5 tracking-widest">🎉 Festival</span><span className="text-sm text-gray-500">20 teams · manually assigned</span></div>
          <div className="border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <div className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">Festival fixtures</div>
            <div className="text-xs text-gray-400 max-w-md mx-auto">Bottom 4 per group (16 teams) + Shield QF losers (4 teams). All festival fixtures assigned manually by admin.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
