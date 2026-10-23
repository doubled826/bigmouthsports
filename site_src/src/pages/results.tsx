import { Fragment, useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/shell";
import { pct, signed, units, isNum, type Data, type ResultRow } from "@/lib/data";

const resClass: Record<string, string> = { W: "bg-volt text-black", L: "bg-red-600 text-white", P: "bg-white/25 text-white", PENDING: "text-white/45 border border-white/20" };

function Seg({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} aria-pressed={value === o} data-testid={`filter-${label}-${o}`}
          className={`font-display px-3 py-1.5 text-sm transition-colors ${value === o ? "bg-volt text-black" : "bg-white/5 text-white/70 hover:text-white"}`}>{o}</button>
      ))}
    </div>
  );
}

// Record for whatever the filters select, tallied from the same rows the table shows (so it always matches the table).
function tally(rows: ResultRow[]) {
  let w = 0, l = 0, p = 0, pend = 0, u = 0;
  for (const r of rows) {
    const res = (r.result ?? "PENDING").toUpperCase();
    if (res === "W") w++; else if (res === "L") l++; else if (res === "P") p++; else { pend++; continue; }
    if (isNum(r.units)) u += r.units;
  }
  return { w, l, p, pend, graded: w + l + p, units: Math.round(u * 100) / 100, winPct: w + l > 0 ? w / (w + l) : null };
}

function FilterRecord({ rows, cat, lg }: { rows: ResultRow[]; cat: string; lg: string }) {
  const t = tally(rows);
  const label = cat === "All" && lg === "All" ? "All-time record"
    : `${cat === "All" ? "All picks" : cat} · ${lg === "All" ? "All leagues" : lg}`;
  const pending = t.pend > 0 && <p className="mt-2 text-sm text-white/50" data-testid="text-record-pending">{t.pend} pending</p>;
  return (
    <div className="mt-6 bg-[#121212] border-l-8 border-volt px-5 py-5 sm:px-8 sm:py-6" data-testid="filter-record" aria-live="polite">
      <p className="font-display text-sm sm:text-base tracking-[.18em] uppercase text-white/60" data-testid="text-record-label">{label}</p>
      {t.graded === 0 ? (
        <>
          <p className="font-display mt-2 text-3xl sm:text-4xl text-white/80" data-testid="text-record-none">No graded picks yet</p>
          {pending}
        </>
      ) : (
        <div className="mt-1 flex flex-wrap items-end gap-x-8 gap-y-2 sm:gap-x-12">
          <p className="font-display leading-none text-volt text-7xl sm:text-8xl lg:text-9xl" data-testid="text-record">
            {t.w}-{t.l}{t.p > 0 ? `-${t.p}` : ""}
          </p>
          <div className="pb-1 sm:pb-2">
            <p className={`font-display leading-none text-4xl sm:text-5xl ${t.units > 0 ? "text-green-400" : t.units < 0 ? "text-red-500" : "text-white"}`} style={{ textTransform: "none" }} data-testid="text-record-units">
              {units(t.units)}
            </p>
            <p className="mt-2 font-bold text-lg text-white/75" data-testid="text-record-winpct">{t.winPct === null ? "—" : `${pct(t.winPct)} win`}</p>
          </div>
        </div>
      )}
      {t.graded > 0 && pending}
    </div>
  );
}

export default function Results({ data }: { data: Data }) {
  useEffect(() => { document.title = `Results — ${data.brand?.name ?? ""}`; }, [data.brand?.name]);
  const rows = data.results ?? [];
  const [cat, setCat] = useState("All");
  const [lg, setLg] = useState("All");
  const [open, setOpen] = useState<number | null>(null);
  const leagues = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.league).filter((x): x is string => !!x)))], [rows]);
  const norm = (c?: string | null) => (c ?? "").toLowerCase().replace(/[_\s-]/g, "");
  const filtered = rows.filter((r) =>
    (cat === "All" || norm(r.category) === norm(cat)) && (lg === "All" || r.league === lg));

  return (
    <>
      <PageTitle kicker="Every pick. Graded." title="Results" />
      <div className="mx-auto max-w-6xl px-4 mt-10">
        {rows.length === 0 ? (
          <div className="border-4 border-dashed border-white/15 p-10 text-center" data-testid="text-empty-results">
            <p className="font-display text-4xl">No graded picks yet. Record starts today: 0-0.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Seg label="category" value={cat} options={["All", "Big Bet", "Honorable Mention", "Parlay"]} onChange={setCat} />
              <Seg label="league" value={lg} options={leagues} onChange={setLg} />
            </div>
            <FilterRecord rows={filtered} cat={cat} lg={lg} />
            {filtered.length === 0 ? null : (
              <div className="mt-6 overflow-x-auto border-t-8 border-volt">
                <table className="w-full min-w-[920px] text-left">
                  <thead className="bg-[#151515] font-display text-sm text-white/60">
                    <tr>{["Date", "Category", "League", "Matchup", "Pick", "Odds", "Public money", "Result", "Units", "CLV"].map((h) => <th key={h} scope="col" className="px-3 py-3 font-normal">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const res = (r.result ?? "PENDING").toUpperCase();
                      const has = !!(r.closing_line || r.final_score);
                      const pf = typeof r.public_faded === "number" ? pct(r.public_faded) : r.public_faded;
                      return (
                        <Fragment key={i}>
                          <tr className={`border-b border-white/5 ${has ? "cursor-pointer hover:bg-white/[.03]" : ""}`} onClick={() => has && setOpen(open === i ? null : i)} data-testid={`row-result-${i}`}>
                            <td className="px-3 py-3 text-white/60 whitespace-nowrap">{r.date ?? "—"}</td>
                            <td className="px-3 py-3">{r.category_label ?? r.category ?? "—"}</td>
                            <td className="px-3 py-3">{r.league ?? "—"}</td>
                            <td className="px-3 py-3 text-white/80">{r.matchup ?? "—"}</td>
                            <td className="px-3 py-3 font-extrabold text-white">{r.pick ?? "—"}</td>
                            <td className="px-3 py-3">{signed(r.price) ?? "—"}</td>
                            <td className="px-3 py-3">{pf ?? "—"}</td>
                            <td className="px-3 py-3"><span className={`font-display px-2 py-0.5 text-sm ${resClass[res] ?? resClass.PENDING}`}>{res}</span></td>
                            <td className={`px-3 py-3 font-bold ${(r.units ?? 0) > 0 ? "text-volt" : (r.units ?? 0) < 0 ? "text-red-500" : ""}`}>{units(r.units) ?? "—"}</td>
                            <td className="px-3 py-3">{r.clv === null || r.clv === undefined || r.clv === "" ? "—" : typeof r.clv === "number" ? signed(r.clv, 1) : r.clv}</td>
                          </tr>
                          {open === i && has && (
                            <tr className="bg-white/[.02]"><td colSpan={10} className="px-3 py-3 text-white/60">
                              {r.closing_line && <span className="mr-6">Closing line: <b className="text-white">{r.closing_line}</b></span>}
                              {r.final_score && <span>Final: <b className="text-white">{r.final_score}</b></span>}
                            </td></tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
