import { useEffect } from "react";
import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle } from "@/components/shell";
import { isNum, pctNum, units, type Data, type TrendRow } from "@/lib/data";

const VOLT = "#C6FF00";

function wlp(r: TrendRow) { return r.display ?? `${r.wins ?? 0}-${r.losses ?? 0}-${r.pushes ?? 0}`; }

function Mini({ rows, kind }: { rows: TrendRow[]; kind: "win" | "units" }) {
  const d = rows.map((r) => ({ label: r.label ?? "—", v: kind === "win" ? pctNum(r.win_pct) : isNum(r.units) ? r.units : null, rec: wlp(r) }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={d} margin={{ top: 24, right: 8, left: -8, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "#bbb", fontSize: 13 }} axisLine={{ stroke: "#333" }} tickLine={false} />
          <YAxis tick={{ fill: "#777", fontSize: 12 }} axisLine={false} tickLine={false} domain={kind === "win" ? [0, 100] : ["auto", "auto"]}
            tickFormatter={(v: number) => (kind === "win" ? `${v}%` : `${v}u`)} />
          {kind === "units" && <ReferenceLine y={0} stroke="#555" />}
          <Tooltip cursor={{ fill: "rgba(255,255,255,.04)" }} contentStyle={{ background: "#151515", border: "1px solid #333", color: "#fff" }}
            formatter={(raw) => { const v = typeof raw === "number" ? raw : null; return v === null ? "n/a" : kind === "win" ? `${v.toFixed(1)}%` : `${v > 0 ? "+" : ""}${v.toFixed(2)}u`; }}
            labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.rec ?? ""}`} />
          <Bar dataKey="v" isAnimationActive={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}>
            {d.map((x, i) => <Cell key={i} fill={kind === "units" && (x.v ?? 0) < 0 ? "#ef4444" : VOLT} />)}
            <LabelList dataKey="rec" position="top" fill="#ddd" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Panel({ title, rows, note, idx }: { title: string; rows: TrendRow[]; note?: string | null; idx: number }) {
  return (
    <section className="bg-[#121212] border-t-8 border-volt p-5 rise" style={{ animationDelay: `${idx * 80}ms` }} data-testid={`panel-trend-${idx}`}>
      <h2 className="font-display text-3xl">{title}</h2>
      {rows.length === 0 ? (
        <div className="mt-6 border-2 border-dashed border-white/15 p-6 text-center">
          <p className="font-bold text-white/80">No graded picks yet — trends will appear once results come in.</p>
          {note && <p className="mt-2 text-sm text-white/50">{note}</p>}
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm uppercase tracking-widest text-white/50">Win rate (%)</p><Mini rows={rows} kind="win" /></div>
            <div><p className="text-sm uppercase tracking-widest text-white/50">Units</p><Mini rows={rows} kind="units" /></div>
          </div>
          <table className="mt-4 w-full text-sm">
            <tbody>{rows.map((r, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-1.5 font-bold">{r.label ?? "—"}</td><td className="text-white/70">{wlp(r)}</td>
                <td className="text-right">{pctNum(r.win_pct) === null ? "—" : `${pctNum(r.win_pct)!.toFixed(1)}%`}</td>
                <td className="text-right text-volt">{units(r.units) ?? "—"}</td>
              </tr>))}</tbody>
          </table>
        </>
      )}
    </section>
  );
}

export default function Trends({ data }: { data: Data }) {
  useEffect(() => { document.title = `Trends — ${data.brand?.name ?? ""}`; }, [data.brand?.name]);
  const t = data.trends;
  const panels: [string, TrendRow[]][] = [
    ["By league", t?.by_league ?? []],
    ["Public % tier (60-69% vs 70%+)", t?.by_public_tier ?? []],
    ["Prime time vs not", t?.prime_time ?? []],
    ["ML favorite faded vs not", t?.ml_favorite_faded ?? []],
  ];
  return (
    <>
      <PageTitle kicker="Where the fade works. Where it doesn't." title="Trends">
        {t?.note && <p className="mt-4 max-w-2xl text-white/60">{t.note}</p>}
      </PageTitle>
      <div className="mx-auto max-w-6xl px-4 mt-10 grid gap-6 lg:grid-cols-2">
        {panels.map(([title, rows], i) => <Panel key={title} title={title} rows={rows} note={t?.note} idx={i} />)}
      </div>
    </>
  );
}
