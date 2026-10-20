import { Fragment, useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/shell";
import { pct, signed, units, type Data } from "@/lib/data";

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
              <Seg label="category" value={cat} options={["All", "Big Bet", "Honorable Mention"]} onChange={setCat} />
              <Seg label="league" value={lg} options={leagues} onChange={setLg} />
            </div>
            {filtered.length === 0 ? (
              <p className="mt-8 border-l-4 border-white/20 pl-4 text-white/60" data-testid="text-no-match">No results match these filters.</p>
            ) : (
              <div className="mt-6 overflow-x-auto border-t-8 border-volt">
                <table className="w-full min-w-[920px] text-left">
                  <thead className="bg-[#151515] font-display text-sm text-white/60">
                    <tr>{["Date", "Category", "League", "Matchup", "Pick", "Price", "Public % faded", "Result", "Units", "CLV"].map((h) => <th key={h} scope="col" className="px-3 py-3 font-normal">{h}</th>)}</tr>
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
                            <td className="px-3 py-3">{r.category ?? "—"}</td>
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
