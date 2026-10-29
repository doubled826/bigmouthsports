import { useEffect } from "react";
import { ExternalLink, Send, TrendingUp } from "lucide-react";
import { ErrorState, PageTitle, Skeleton } from "@/components/shell";
import { isNum, signed, useLadder, type Data, type LadderBet, type Ladder as LadderT } from "@/lib/data";

const usd = (v?: number | null, d?: number) => {
  if (!isNum(v)) return "—";
  const dd = d ?? (Math.abs(v) >= 1000 || Number.isInteger(v) ? 0 : 2);
  return `${v < 0 ? "−" : ""}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: dd, maximumFractionDigits: dd })}`;
};
const usdSigned = (v?: number | null) => (isNum(v) ? (v > 0 ? "+" : "") + usd(v, 2) : "—");
const md = (d?: string | null) => (d ? `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}` : "");
const dow = (d?: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "");
const resClass = (r?: string | null) => (r === "win" ? "text-green-400" : r === "loss" ? "text-red-500" : "text-white/70");

function Tile({ label, value, sub, id, accent }: { label: string; value: string; sub?: string; id: string; accent?: string }) {
  return (
    <div className="bg-[#121212] border-t-4 border-volt p-3 sm:p-5" data-testid={`tile-ladder-${id}`}>
      <h3 className="font-display text-sm sm:text-lg text-white/70 leading-tight">{label}</h3>
      <p className={`font-display text-3xl sm:text-5xl mt-2 ${accent ?? ""}`} style={{ textTransform: "none" }}>{value}</p>
      {sub && <p className="mt-2 text-xs sm:text-sm text-white/50">{sub}</p>}
    </div>
  );
}

function BookButtons({ b }: { b: LadderBet }) {
  if (!b.fd_url && !b.dk_url) return null;
  return (
    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
      {b.fd_url && <a href={b.fd_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-volt px-5 py-3 font-display text-lg text-black hover:brightness-110" data-testid="link-ladder-fd">Load on FanDuel <ExternalLink className="h-4 w-4" aria-hidden /></a>}
      {b.dk_url && <a href={b.dk_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border-2 border-volt px-5 py-3 font-display text-lg text-volt hover:bg-volt hover:text-black" data-testid="link-ladder-dk">Load on DraftKings <ExternalLink className="h-4 w-4" aria-hidden /></a>}
    </div>
  );
}

function TodaySlip({ l }: { l: LadderT }) {
  const t = l.today;
  if (!t) {
    const first = l.status === "READY" && l.start_date;
    return (
      <div className="bg-[#121212] border-l-[6px] border-white/25 p-5 sm:p-6" data-testid="card-ladder-empty">
        <p className="font-display text-2xl sm:text-3xl text-white/85">{first ? `First rung drops ${dow(l.start_date)}` : "Next slip not posted yet"}</p>
        <p className="mt-2 text-white/55">Next stake: <b className="text-white">{usd(l.next_stake, 2)}</b>. The slip lands here before the first game on the slate.</p>
      </div>
    );
  }
  return (
    <article className="bg-[#121212] border-l-[12px] border-volt p-5 sm:p-8 rise" data-testid="card-ladder-today">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display bg-volt px-2 py-0.5 text-sm text-black">RUNG {(t.streak_before ?? 0) + 1}</span>
        <span className="text-white/80 font-bold uppercase tracking-wide">{dow(t.date)}{t.slate ? ` · ${t.slate}` : ""}</span>
        {t.posted_et && <span className="text-sm text-white/50">Posted {t.posted_et}</span>}
      </div>
      <p className="font-display text-volt mt-4 text-5xl sm:text-7xl" data-testid="text-ladder-odds">{signed(t.odds) ?? "—"}</p>
      <p className="mt-1 text-lg text-white/80">{(t.legs ?? []).length}-leg prop parlay · {usd(t.stake, 2)} to win {usd(t.to_win, 2)}</p>
      <ol className="mt-5 space-y-2">
        {(t.legs ?? []).map((g, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-3 border-b border-white/10 pb-2" data-testid={`row-ladder-leg-${i}`}>
            <span className="font-display text-white/40 w-5">{i + 1}</span>
            <span className="font-bold text-white">{g.label}</span>
            {isNum(g.odds) && <span className="text-volt font-bold">{signed(g.odds)}</span>}
            {(g.matchup || g.tip_et) && <span className="text-sm text-white/50">{[g.league, g.matchup, g.tip_et].filter(Boolean).join(" · ")}</span>}
            {g.result && <span className={`ml-auto text-sm font-bold uppercase ${resClass(g.result)}`}>{g.result}</span>}
          </li>
        ))}
      </ol>
      {t.notes && <p className="mt-4 text-white/70">{t.notes}</p>}
      <BookButtons b={t} />
    </article>
  );
}

function Projections({ l }: { l: LadderT }) {
  const rows = l.projections ?? [];
  const max = Math.max(...rows.map((r) => r.payout), 1);
  const cur = l.streak ?? 0;
  return (
    <section className="mt-12" aria-labelledby="climb" data-testid="section-ladder-projections">
      <h2 id="climb" className="font-display text-3xl sm:text-4xl">THE <span className="text-volt">CLIMB</span></h2>
      <p className="mt-2 max-w-2xl text-white/60">If every rung hits at even money (+100). After win {l.seed_withdraw_after_wins ?? 2} we pull the {usd(l.seed)} seed back out, so from there it's house money.</p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm sm:text-base">
          <thead><tr className="border-b-2 border-volt text-white/60 font-display tracking-wide">
            <th className="px-2 sm:px-3 py-2">Win</th><th className="px-2 sm:px-3 py-2">Stake</th><th className="px-2 sm:px-3 py-2">Cashes</th><th className="px-2 sm:px-3 py-2 hidden sm:table-cell">Seed out</th><th className="px-2 sm:px-3 py-2">Next bet</th><th className="px-2 sm:px-3 py-2 w-1/3 hidden md:table-cell"></th>
          </tr></thead>
          <tbody>
            {rows.map((r) => {
              const done = r.win <= cur, next = r.win === cur + 1;
              return (
                <tr key={r.win} className={`border-b border-white/5 ${next ? "bg-volt/10" : ""}`} data-testid={`row-proj-${r.win}`}>
                  <td className="px-2 sm:px-3 py-2 font-display text-lg">{done ? <span className="text-volt">✓ {r.win}</span> : r.win}{next && <span className="ml-2 text-xs text-volt font-bold">NEXT</span>}</td>
                  <td className="px-2 sm:px-3 py-2">{usd(r.stake)}</td>
                  <td className="px-2 sm:px-3 py-2 font-bold text-white">{usd(r.payout)}</td>
                  <td className="px-2 sm:px-3 py-2 hidden sm:table-cell">{r.withdraw ? <span className="text-volt font-bold">−{usd(r.withdraw)}</span> : <span className="text-white/30">—</span>}</td>
                  <td className="px-2 sm:px-3 py-2">{usd(r.next_stake)}{r.withdraw ? <span className="sm:hidden ml-1 text-xs text-volt font-bold">(−{usd(r.withdraw)} seed)</span> : null}</td>
                  <td className="px-2 sm:px-3 py-2 hidden md:table-cell"><div className="h-3 bg-white/5"><div className={`h-3 ${done ? "bg-volt" : "bg-volt/60"}`} style={{ width: `${Math.max(2, Math.sqrt(r.payout / max) * 100)}%` }} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-white/40">Projection only, not a promise. Real payouts depend on each slip's odds (−100 to +150).</p>
    </section>
  );
}

function Results({ l }: { l: LadderT }) {
  const rows = l.results ?? [];
  return (
    <section className="mt-12" aria-labelledby="log" data-testid="section-ladder-results">
      <h2 id="log" className="font-display text-3xl sm:text-4xl">EVERY <span className="text-volt">RUNG</span></h2>
      {!rows.length ? <p className="mt-4 text-white/55" data-testid="text-ladder-noresults">No graded slips yet. Every slip goes here win or lose.</p> : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base">
            <thead><tr className="border-b-2 border-volt text-white/60 font-display tracking-wide">
              <th className="px-2 sm:px-3 py-2">#</th><th className="px-2 sm:px-3 py-2">Date</th><th className="px-2 sm:px-3 py-2">Slip</th><th className="px-2 sm:px-3 py-2">Odds</th><th className="px-2 sm:px-3 py-2">Stake</th><th className="px-2 sm:px-3 py-2">Result</th><th className="px-2 sm:px-3 py-2">Streak</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.n ?? r.date ?? ""} className="border-b border-white/5 align-top" data-testid={`row-ladder-${r.n}`}>
                  <td className="px-2 sm:px-3 py-3 font-display">{r.n}</td>
                  <td className="px-2 sm:px-3 py-3 whitespace-nowrap">{md(r.date)}</td>
                  <td className="px-2 sm:px-3 py-3 text-white/80">{(r.legs ?? []).map((g, i) => <div key={i} className={g.result ? resClass(g.result) : ""}>{g.label}</div>)}{r.notes && <div className="text-xs text-white/45 mt-1">{r.notes}</div>}</td>
                  <td className="px-2 sm:px-3 py-3 font-bold">{signed(r.odds)}</td>
                  <td className="px-2 sm:px-3 py-3">{usd(r.stake, 2)}</td>
                  <td className={`px-2 sm:px-3 py-3 font-bold uppercase whitespace-nowrap ${resClass(r.result)}`}>{r.result} {r.result === "win" && <span className="normal-case">{usd(r.payout, 2)}</span>}{r.withdraw ? <div className="text-xs text-volt normal-case">−{usd(r.withdraw)} seed out</div> : null}</td>
                  <td className="px-2 sm:px-3 py-3 font-display">{r.streak_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Ladder({ data }: { data: Data }) {
  useEffect(() => { document.title = `Ladder Bet Challenge — ${data.brand?.name ?? ""}`; }, [data.brand?.name]);
  const { data: l, error, retry } = useLadder();
  const head = (
    <PageTitle kicker="One slip a day · $10 start" title="The Ladder">
      <p className="mt-5 max-w-2xl text-lg sm:text-xl text-white/80">
        Every day we build one player-prop parlay at about even money and let the whole balance ride. Win and we climb a rung. Lose and we start over at $10.
        How many in a row can we hit?
      </p>
      {data.brand?.x_url && <a href={data.brand.x_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-volt underline-offset-4 hover:underline" data-testid="link-ladder-x"><Send className="h-4 w-4" aria-hidden />Follow every slip on X {data.brand.handle ?? ""}</a>}
    </PageTitle>
  );
  if (!l) return <>{head}{error ? <ErrorState error={error} retry={retry} /> : <Skeleton />}</>;
  const pnl = l.pnl ?? 0;
  return (
    <>
      {head}
      <div className="mx-auto max-w-6xl px-4">
        <section aria-labelledby="ladder-score" className="mt-8" data-testid="section-ladder-score">
          <div className="bg-[#121212] border-l-8 border-volt px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 id="ladder-score" className="font-display text-sm sm:text-base tracking-[.18em] uppercase text-white/60">Current streak</h2>
              <span className="border border-volt px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-volt" data-testid="text-ladder-status">{l.status}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-end gap-x-8 gap-y-2 sm:gap-x-12">
              <p className="font-display leading-none text-volt text-7xl sm:text-8xl lg:text-9xl" data-testid="text-ladder-streak"><TrendingUp className="inline h-12 w-12 sm:h-16 sm:w-16 mr-2 align-baseline" aria-hidden />{l.streak ?? 0}</p>
              <div className="pb-1 sm:pb-2">
                <p className="font-display leading-none text-4xl sm:text-5xl" data-testid="text-ladder-record">{l.record?.display ?? "0-0"}</p>
                <p className="mt-2 font-bold text-lg text-white/75">Best streak: {l.best_streak ?? 0}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <Tile id="next" label="Next stake" value={usd(l.next_stake, 2)} sub={l.today ? "Riding on today's slip" : "Up next"} />
              <Tile id="bankroll" label="Bankroll riding" value={usd(l.bankroll, 2)} sub={`${usd(l.seeds_in)} seed${(l.seeds_in ?? 0) === (l.seed ?? 10) ? "" : "s"} in`} />
              <Tile id="withdrawn" label="Cashed out" value={usd(l.cash_withdrawn, 2)} sub="Seed pulled after win 2" />
              <Tile id="pnl" label="Net P/L" value={usdSigned(pnl)} accent={pnl > 0 ? "text-green-400" : pnl < 0 ? "text-red-500" : ""} sub="Cashed out + riding − seeds in" />
            </div>
            {l.updated_et && <p className="mt-4 text-sm text-white/50">Updated {md(l.updated_et.slice(0, 10))} {l.updated_et.slice(11, 16)} ET</p>}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="today" data-testid="section-ladder-today">
          <h2 id="today" className="font-display text-3xl sm:text-4xl mb-5">TODAY'S <span className="text-volt">SLIP</span></h2>
          <TodaySlip l={l} />
        </section>

        <Projections l={l} />
        <Results l={l} />

        <section className="mt-12" aria-labelledby="how" data-testid="section-ladder-how">
          <h2 id="how" className="font-display text-3xl sm:text-4xl">HOW IT <span className="text-volt">WORKS</span></h2>
          <ul className="mt-5 max-w-3xl space-y-3 border-l-8 border-volt bg-[#121212] p-6 sm:p-8 text-white/80 text-base sm:text-lg">
            <li><b className="text-white">One slip a day.</b> A player-prop parlay priced about even money ({l.rules?.band ?? "−100 to +150"}). As many legs as it takes, only the highest-probability props after digging into every matchup.</li>
            <li><b className="text-white">Basic props only.</b> Points, rebounds, assists, combos, threes, yards, TDs. No long shots.</li>
            <li><b className="text-white">Let it ride.</b> Start with $10. Every win rolls the whole balance into the next slip.</li>
            <li><b className="text-white">Seed back after win 2.</b> At about $40 we pull the original $10 out, and $30+ keeps climbing.</li>
            <li><b className="text-white">A loss resets it.</b> Back to $10 and a streak of 0. Every result stays on this page.</li>
            <li><b className="text-white">Sports:</b> {l.rules?.sports ?? "NBA, NFL, NCAAF · Sundays NFL only"}. On a huge slate we may run two slips in one day (the first rolls into the second), only when it's worth it.</li>
          </ul>
        </section>

        <p className="mt-10 max-w-3xl text-sm text-white/45" data-testid="text-ladder-rg">
          For entertainment. Parlays are high-variance and a single leg loses the whole slip. Odds change after we post. Bet only what you can afford to lose. 21+ · Gambling problem? Call 1-800-GAMBLER.
        </p>
      </div>
    </>
  );
}
