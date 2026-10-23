import { isNum, signed, type DkSplit } from "@/lib/data";

export const pc0 = (v: number | null | undefined) => (isNum(v) ? `${Math.round(v)}%` : "n/a");

export function DkSplits({ fav, favMl, ats, ml, big }: { fav?: string | null; favMl?: number | null; ats?: DkSplit | null; ml?: DkSplit | null; big?: boolean }) {
  const row = (label: string, s?: DkSplit | null) => (
    <tr className="border-t border-white/10">
      <th scope="row" className="py-1.5 pr-3 text-left font-display text-white/70">{label}</th>
      <td className="py-1.5 pr-3 text-white">{s?.public_team ?? "n/a"}</td>
      <td className="py-1.5 pr-3 text-volt font-bold">{s ? pc0(s.public_handle_pct) : "n/a"}</td>
      <td className="py-1.5 text-white/80">{s ? pc0(s.public_bets_pct) : "n/a"}</td>
    </tr>
  );
  return (
    <div className={`mt-4 ${big ? "max-w-xl" : ""}`} data-testid="dk-splits">
      <p className="text-sm text-white/70">
        <span className="font-display text-white/60 tracking-wide">FAVORITE (DK):</span>{" "}
        <span className="text-white font-bold">{fav ?? "n/a"}</span>{fav && isNum(favMl) ? <span className="text-white/60"> ({signed(favMl)} ML)</span> : null}
      </p>
      <table className="mt-2 w-full text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wider text-white/45">
          <th className="pb-1 pr-3 font-normal">DraftKings</th><th className="pb-1 pr-3 font-normal">Public side</th>
          <th className="pb-1 pr-3 font-normal">Handle %</th><th className="pb-1 font-normal">Bets %</th>
        </tr></thead>
        <tbody>{row("ATS (SPREAD)", ats)}{row("ML (MONEYLINE)", ml)}</tbody>
      </table>
    </div>
  );
}

// Sharp Alert cards: both sides' DraftKings money % and tickets %, spread first, moneyline as context. "Money on" = side with the most money.
export function SharpSplits({ ats, ml }: { ats?: DkSplit | null; ml?: DkSplit | null }) {
  const ref = ats ?? ml;
  if (!ref) return null;
  const aw = ref.away_team ?? "Away", hm = ref.home_team ?? "Home";
  const cell = (h?: number | null, b?: number | null) => (
    <><span className="text-volt font-bold">{pc0(h)}</span><span className="text-white/45"> · </span><span className="text-white/80">{pc0(b)}</span></>
  );
  const row = (label: string, s: DkSplit | null | undefined, id: string) => (
    <tr className="border-t border-white/10" data-testid={`row-split-${id}`}>
      <th scope="row" className="py-1.5 pr-2 text-left font-display text-white/70 leading-tight">{label}</th>
      <td className="py-1.5 pr-2 text-white">{s?.public_team ?? "n/a"}</td>
      <td className="py-1.5 pr-2 whitespace-nowrap">{s ? cell(s.away_handle_pct, s.away_bets_pct) : "n/a"}</td>
      <td className="py-1.5 whitespace-nowrap">{s ? cell(s.home_handle_pct, s.home_bets_pct) : "n/a"}</td>
    </tr>
  );
  return (
    <div className="mt-4" data-testid="sharp-splits">
      <table className="w-full text-xs sm:text-sm">
        <thead><tr className="text-left text-[11px] sm:text-xs uppercase tracking-wider text-white/45">
          <th className="pb-1 pr-2 font-normal">DraftKings</th><th className="pb-1 pr-2 font-normal">Money on</th>
          <th className="pb-1 pr-2 font-normal">{aw}</th><th className="pb-1 font-normal">{hm}</th>
        </tr></thead>
        <tbody>{row("SPREAD", ats, "spread")}{row("MONEYLINE (CONTEXT)", ml, "ml")}</tbody>
      </table>
      <p className="mt-1 text-[11px] text-white/45">Each team: % of the money · % of the tickets.</p>
    </div>
  );
}
