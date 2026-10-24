import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import { PageTitle } from "@/components/shell";
import { pc0 } from "@/components/dk";
import { isNum, signed, units, type Data } from "@/lib/data";
import { CARD_BASE, useLookup, type Game, type History, type Market, type Side } from "@/lib/lookup";

// Game Lookup (preview, 10/24): search any game, see DraftKings splits, our own DK line history and the Big Mouth read.
const TZ = "America/New_York";
const fmtT = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { timeZone: TZ, month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");
const dayLabel = (d: string, today: string) => {
  if (d === today) return "Today";
  const x = new Date(`${d}T12:00:00`);
  return x.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
};
const ln = (v?: number | null) => (isNum(v) ? (v > 0 ? `+${v}` : `${v}`) : "");
const LEAGUES = ["All", "NCAAF", "NFL", "NBA"];

function Tag({ children, tone = "line", id }: { children: React.ReactNode; tone?: "volt" | "line" | "white"; id?: string }) {
  const cls = tone === "volt" ? "bg-volt text-black" : tone === "white" ? "bg-white text-black" : "border border-white/30 text-white/70";
  return <span className={`px-1.5 py-px text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${cls}`} data-testid={id}>{children}</span>;
}

function ReadTag({ g }: { g: Game }) {
  if (g.read.kind === "STRONG" || g.read.kind === "LEAN") return <Tag tone="volt" id={`tag-read-${g.id}`}>Fade · {g.read.kind}</Tag>;
  return null;
}

function GameRow({ g, open, onToggle }: { g: Game; open: boolean; onToggle: () => void }) {
  const sp = g.markets.spread; const pub = sp?.public_side as "away" | "home" | undefined;
  const pubTeam = pub ? g[pub] : null;
  return (
    <button onClick={onToggle} aria-expanded={open} data-testid={`row-game-${g.id}`}
      className={`w-full text-left bg-[#121212] border-l-[6px] ${open ? "border-volt" : "border-white/15 hover:border-white/40"} px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-3`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-display bg-white px-1.5 py-px text-xs text-black">{g.league}</span>
          <span className="text-xs text-white/50">{g.kickoff}</span>
          {g.started && <Tag>Started</Tag>}
          {g.card && <Tag tone="white" id={`tag-card-${g.id}`}>On today's card</Tag>}
          <ReadTag g={g} />
          {g.history.spread?.rlm && <Tag id={`tag-rlm-${g.id}`}>RLM</Tag>}
        </div>
        <p className="mt-1 font-bold text-white text-base sm:text-lg leading-tight truncate">{g.matchup}</p>
        {pub && sp?.[pub] && (
          <p className="text-sm text-white/60"><span className="text-volt font-bold">{pc0(sp[pub]!.handle_pct)}</span> of the money on {pubTeam} {ln(sp[pub]!.line)}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        {isNum(g.lopsided_pct) && <p className="font-display text-3xl sm:text-4xl text-volt leading-none">{g.lopsided_pct}%</p>}
        <ChevronDown className={`ml-auto mt-1 h-5 w-5 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </div>
    </button>
  );
}

function SplitBars({ title, rows }: { title: string; rows: { label: string; s?: Side; isPublic: boolean }[] }) {
  if (!rows.every((r) => r.s)) return (
    <div className="mt-4"><h4 className="font-display text-white/70">{title}</h4><p className="text-sm text-white/45">No DraftKings splits for this market.</p></div>
  );
  return (
    <div className="mt-5" data-testid={`splits-${title.toLowerCase()}`}>
      <h4 className="font-display text-white/70 tracking-wide">{title}</h4>
      <div className="mt-1 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={`font-bold ${r.isPublic ? "text-white" : "text-white/75"}`}>{r.label}{isNum(r.s!.price) ? <span className="font-normal text-white/50"> ({signed(r.s!.price)})</span> : null}</span>
              {r.isPublic && <span className="text-[11px] uppercase tracking-wide text-white/50">Public side</span>}
            </div>
            <Bar kind="Money" v={r.s!.handle_pct} volt />
            <Bar kind="Tickets" v={r.s!.bets_pct} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ kind, v, volt }: { kind: string; v?: number | null; volt?: boolean }) {
  const w = isNum(v) ? Math.max(0, Math.min(100, v)) : 0;
  return (
    <div className="mt-1 flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] uppercase tracking-wide text-white/45">{kind}</span>
      <div className="relative h-3.5 flex-1 bg-white/[.07]"><div className={`absolute inset-y-0 left-0 ${volt ? "bg-volt" : "bg-white/55"}`} style={{ width: `${w}%` }} /></div>
      <span className={`w-10 shrink-0 text-right text-sm font-bold ${volt ? "text-volt" : "text-white/80"}`}>{pc0(v)}</span>
    </div>
  );
}

function LineChart({ h, title, market }: { h: History; title: string; market: "spread" | "total" }) {
  if (!h || !h.points.length) return null;
  const pts = h.points.map((p) => ({ t: new Date(p.t).getTime(), line: p.line }));
  const end = h.latest_t ? new Date(h.latest_t).getTime() : pts[pts.length - 1].t;
  const t0 = pts[0].t, t1 = Math.max(end, t0 + 1);
  const ys = pts.map((p) => p.line); let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; } else { lo -= 0.5; hi += 0.5; }
  const W = 320, H = 110, L = 34, R = 8, T = 10, B = 20;
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v: number) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  let d = `M${x(pts[0].t)},${y(pts[0].line)}`;
  pts.slice(1).forEach((p) => { d += ` H${x(p.t)} V${y(p.line)}`; });
  d += ` H${x(t1)}`;
  const rlmMoves = h.moves.filter((m) => m.rlm).length;
  const sideLabel = market === "total" ? "Total" : `${h.label} line`;
  return (
    <div className="mt-6" data-testid={`chart-${market}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-display text-white/70 tracking-wide">{title}</h4>
        {h.rlm && <Tag tone="volt" id={`tag-chart-rlm-${market}`}>RLM</Tag>}
      </div>
      <p className="text-sm text-white/60">
        {sideLabel}: <b className="text-white">{market === "total" ? h.first_line : ln(h.first_line)}</b> on {fmtT(h.first_seen)} → <b className="text-white">{market === "total" ? h.line : ln(h.line)}</b> now
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full max-w-md" role="img" aria-label={`${sideLabel} history`}>
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="rgba(255,255,255,.15)" />
        {[hi - 0.5, lo + 0.5].filter((v, i, a) => a.indexOf(v) === i).map((v) => (
          <text key={v} x={L - 4} y={y(v) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,.5)">{market === "total" ? v : ln(v)}</text>
        ))}
        <path d={d} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.6" />
        {h.moves.map((m, i) => (
          <circle key={i} cx={x(new Date(m.t).getTime())} cy={y(m.to)} r={m.rlm ? 4 : 3} fill={m.rlm ? "var(--volt)" : "#121212"} stroke={m.rlm ? "none" : "rgba(255,255,255,.8)"} strokeWidth="1.3" />
        ))}
        <circle cx={x(pts[0].t)} cy={y(pts[0].line)} r="2.5" fill="rgba(255,255,255,.8)" />
        <text x={L} y={H - 6} fontSize="9" fill="rgba(255,255,255,.5)">{fmtT(h.first_seen)}</text>
        <text x={W - R} y={H - 6} fontSize="9" textAnchor="end" fill="rgba(255,255,255,.5)">{fmtT(h.latest_t)}</text>
      </svg>
      <p className="text-xs text-white/45">
        {h.moves.length ? `${h.moves.length} move${h.moves.length === 1 ? "" : "s"} in our DK pulls` : "No moves in our DK pulls yet"}
        {rlmMoves ? <> · <span className="text-volt">●</span> {rlmMoves} against the public</> : null}
        {h.moves.length ? " · ○ with the public" : ""}
      </p>
    </div>
  );
}

function GameCard({ g, today }: { g: Game; today: string }) {
  const sp = g.markets.spread, tot = g.markets.total, ml = g.markets.moneyline;
  const rows = (m: Market, a: "away" | "over", b: "home" | "under", la: (s?: Side) => string, lb: (s?: Side) => string) =>
    m ? [{ label: la(m[a]), s: m[a], isPublic: m.public_side === a }, { label: lb(m[b]), s: m[b], isPublic: m.public_side === b }] : [{ label: "", s: undefined, isPublic: false }];
  const r = g.read;
  return (
    <article className="bg-[#121212] border-l-[6px] border-volt px-4 pb-6 pt-4 sm:px-7 sm:pb-8 -mt-1 rise" data-testid={`card-game-${g.id}`}>
      <div className={`border-2 ${r.kind === "none" ? "border-white/20" : "border-volt"} p-3 sm:p-4`} data-testid="box-read">
        <p className="font-display text-sm tracking-[.18em] text-white/55">THE BIG MOUTH READ</p>
        {r.kind === "none" ? (
          <p className="mt-1 text-white/85" data-testid="text-read">{r.text}</p>
        ) : (
          <>
            <p className="mt-1 font-display text-3xl sm:text-4xl text-volt leading-tight" data-testid="text-read-fade">Fade spot · {r.kind}</p>
            <p className="mt-1 text-white/85" data-testid="text-read">{r.handle_pct}% of the DK money and {r.bets_pct}% of the tickets are on {r.public_team} {r.public_line}. Fading the public here means {r.fade_team} {r.fade_line}.</p>
            {r.sharp_caution && <p className="mt-1 text-sm text-white/55">Sharp-money caution: the money is well ahead of the tickets.</p>}
            {!g.card && <p className="mt-2 text-xs text-white/45">Rule check on the current DK numbers, not one of our posted picks.</p>}
          </>
        )}
        {g.card && g.card.url && (
          <a href={`${CARD_BASE}${g.card.url}`} className="mt-3 inline-flex items-center gap-1 font-display text-volt hover:underline" data-testid="link-card">
            On today's card: {g.card.category} · {g.card.pick}{isNum(g.card.price) ? ` (${signed(g.card.price)})` : ""} <ChevronRight className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
      <p className="mt-4 text-sm text-white/60">Kickoff: <b className="text-white">{g.kickoff}</b>{g.started ? " · started" : ""}</p>

      <SplitBars title="SPREAD" rows={rows(sp, "away", "home", (s) => `${g.away} ${ln(s?.line)}`, (s) => `${g.home} ${ln(s?.line)}`)} />
      <SplitBars title="TOTAL" rows={rows(tot, "over", "under", (s) => `Over ${s?.line ?? ""}`, (s) => `Under ${s?.line ?? ""}`)} />
      <SplitBars title="MONEYLINE" rows={rows(ml, "away", "home", () => g.away, () => g.home)} />

      <LineChart h={g.history.spread} title="SPREAD LINE HISTORY" market="spread" />
      <LineChart h={g.history.total} title="TOTAL LINE HISTORY" market="total" />
      {(g.history.spread || g.history.total) && (
        <p className="mt-2 text-xs text-white/45">RLM = the line moved against the side the public is on, from our first DK line to now. Our own DraftKings pulls only.</p>
      )}

      {g.record && g.record.length > 0 && (
        <div className="mt-6" data-testid="box-record">
          <h4 className="font-display text-white/70 tracking-wide">OUR RECORD IN SPOTS LIKE THIS</h4>
          <ul className="mt-1 space-y-1">
            {g.record.map((x) => (
              <li key={x.label} className="text-sm text-white/80">
                {x.label}: <b className="text-white">{x.display}</b>
                {isNum(x.units) && <span className={x.units < 0 ? "text-red-500" : "text-green-400"}> ({units(x.units)})</span>}
                <span className="text-white/45"> · {x.graded} graded</span>{x.small ? <> <Tag>Small sample</Tag></> : null}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-white/45">Graded public picks only (Big Bet + Honorable Mentions).</p>
        </div>
      )}

      {g.card?.dk_url && (
        <a href={g.card.dk_url} target="_blank" rel="noopener noreferrer" data-testid="link-dk-bet"
          className="mt-6 flex items-center justify-center gap-2 bg-volt px-5 py-4 font-display text-xl text-black hover:brightness-110">
          Bet {g.card.pick} on DraftKings <ChevronRight className="h-5 w-5" aria-hidden />
        </a>
      )}
      <p className="mt-4 text-xs text-white/40">DraftKings splits and lines as of {fmtT(g.as_of)} ET. {g.date === today ? "" : "Numbers can change a lot before kickoff."}</p>
    </article>
  );
}

export default function Lookup({ data }: { data: Data }) {
  const { data: lk, error, retry } = useLookup();
  const [q, setQ] = useState("");
  const [league, setLeague] = useState("All");
  const [date, setDate] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { document.title = `Game Lookup — ${data.brand?.name ?? ""}`; }, [data.brand?.name]);
  useEffect(() => {   // deep link: #/lookup?g=<id> or ?q=<team>
    const p = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
    if (p.get("q")) setQ(p.get("q")!); if (p.get("g")) setOpen(p.get("g"));
  }, []);

  const games = useMemo(() => {
    if (!lk) return [];
    const toks = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return lk.games.filter((g) => (league === "All" || g.league === league) && (date === "all" || g.date === date)
      && toks.every((t) => g.search.includes(t) || g.matchup.toLowerCase().includes(t)));
  }, [lk, q, league, date]);
  const lopsided = useMemo(() => games.filter((g) => !g.started && isNum(g.lopsided_pct)).sort((a, b) => (b.lopsided_pct ?? 0) - (a.lopsided_pct ?? 0)).slice(0, 10), [games]);

  const chip = (active: boolean) => `font-display px-3 py-1.5 text-sm whitespace-nowrap ${active ? "bg-volt text-black" : "bg-white/[.06] text-white/75 hover:text-white"}`;
  const list = (gs: Game[], id: string) => (
    <ul className="mt-3 space-y-2" data-testid={id}>
      {gs.map((g) => (
        <li key={g.id}>
          <GameRow g={g} open={open === g.id} onToggle={() => setOpen(open === g.id ? null : g.id)} />
          {open === g.id && lk && <GameCard g={g} today={lk.today} />}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageTitle kicker="Every game · DraftKings splits" title="Game Lookup">
        <p className="mt-3 max-w-2xl text-white/70">Search any game to see where the DraftKings money and tickets are, how the line has moved, and whether it fits our fade rule.</p>
      </PageTitle>
      <div className="mx-auto max-w-3xl px-3 sm:px-4">
        <div className="sticky top-[64px] sm:top-[68px] z-30 -mx-3 sm:mx-0 bg-[#0b0b0b]/95 backdrop-blur px-3 sm:px-0 pt-4 pb-3">
          <label className="flex items-center gap-2 border-2 border-white/20 focus-within:border-white/60 bg-[#121212] px-3">
            <Search className="h-5 w-5 text-white/50" aria-hidden />
            <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setOpen(null); }} placeholder="Search a team (e.g. Alabama, Lakers)"
              aria-label="Search games by team" className="h-12 flex-1 bg-transparent text-base text-white placeholder:text-white/35 outline-none" data-testid="input-search" />
            {q && <button onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label="Clear search" data-testid="button-clear"><X className="h-5 w-5 text-white/60" /></button>}
          </label>
          <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="League">
            {LEAGUES.map((l) => <button key={l} role="tab" aria-selected={league === l} className={chip(league === l)} onClick={() => setLeague(l)} data-testid={`tab-league-${l.toLowerCase()}`}>{l}</button>)}
          </div>
          {lk && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar" aria-label="Date">
              <button className={chip(date === "all")} onClick={() => setDate("all")} data-testid="date-all">Next 7 days</button>
              {lk.dates.map((d) => <button key={d} className={chip(date === d)} onClick={() => setDate(d)} data-testid={`date-${d}`}>{dayLabel(d, lk.today)}</button>)}
            </div>
          )}
        </div>

        {!lk && !error && <div className="mt-6 h-40 animate-pulse bg-white/[.04]" aria-busy="true" />}
        {error && !lk && (
          <div role="alert" className="mt-6 border-l-8 border-red-500 bg-white/[.03] p-5">
            <p>Couldn't load games ({error}).</p><button onClick={retry} className="mt-3 bg-volt px-4 py-2 font-display text-black" data-testid="button-retry-lookup">Retry</button>
          </div>
        )}

        {lk && (q ? (
          <section className="mt-4" aria-live="polite">
            <p className="text-sm text-white/55" data-testid="text-result-count">{games.length} game{games.length === 1 ? "" : "s"} for “{q}”</p>
            {games.length ? list(games, "list-results") : <p className="mt-6 text-white/70">No games match. Try a school or city name, or switch the league/date.</p>}
          </section>
        ) : (
          <>
            <section className="mt-6" aria-labelledby="lopsided">
              <h2 id="lopsided" className="font-display text-3xl sm:text-4xl flex items-center gap-2"><TrendingUp className="h-7 w-7 text-volt" aria-hidden /> MOST <span className="text-volt">LOPSIDED</span></h2>
              <p className="text-sm text-white/55">Games with the biggest share of the DraftKings spread money on one side.</p>
              {lopsided.length ? list(lopsided, "list-lopsided") : <p className="mt-4 text-white/60">No upcoming games for this filter.</p>}
            </section>
            <section className="mt-10" aria-labelledby="allgames">
              <h2 id="allgames" className="font-display text-2xl sm:text-3xl">ALL GAMES <span className="text-white/45">({games.length})</span></h2>
              {list(games.filter((g) => !lopsided.includes(g)), "list-all")}
            </section>
          </>
        ))}
        {lk && <p className="mt-8 text-xs text-white/40">{lk.rule} DraftKings data as of {fmtT(lk.splits_as_of_et)} ET.</p>}
        <p className="mt-3 text-xs font-display tracking-wide text-white/55" data-testid="text-lookup-footer">21+ · 1-800-GAMBLER · Splits via DK Network</p>
      </div>
    </>
  );
}
