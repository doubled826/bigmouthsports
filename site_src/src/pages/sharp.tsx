import { useEffect } from "react";
import { Send } from "lucide-react";
import { PageTitle } from "@/components/shell";
import { DkSplits, pc0 } from "@/components/dk";
import { isNum, pct, units, type Data, type SigRec, type TypeRecord } from "@/lib/data";

const md = (d?: string | null) => (d ? `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}` : "");

export function TelegramButton({ url, className = "" }: { url?: string | null; className?: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" data-testid="link-telegram"
      className={`inline-flex items-center justify-center gap-3 bg-volt px-5 py-4 font-display text-lg leading-tight sm:text-2xl text-black text-center hover:brightness-110 ${className}`}>
      <Send className="h-6 w-6" aria-hidden /> Get free Sharp Alerts on Telegram
    </a>
  );
}

function RecTile({ title, r, sub }: { title: string; r?: SigRec | null; sub?: string }) {
  const g = r?.graded ?? 0;
  return (
    <div className="bg-[#121212] border-t-4 border-volt p-3 sm:p-5" data-testid={`tile-sharp-${title.replace(/\W+/g, "-").toLowerCase()}`}>
      <h4 className="font-display text-sm sm:text-lg text-white/70 leading-tight">{title}</h4>
      <p className="font-display text-3xl sm:text-5xl mt-2">{g ? r!.display : "—"}</p>
      {g ? (
        <p className="mt-1 font-bold text-white/80 text-sm sm:text-base flex flex-wrap gap-x-3">
          <span className={isNum(r?.units) && r!.units! < 0 ? "text-red-500" : "text-green-400"}>{units(r?.units)}</span>
          {isNum(r?.win_pct) && <span>{pct(r!.win_pct)} hit</span>}
        </p>
      ) : null}
      <p className="mt-2 text-xs sm:text-sm text-white/50">{g ? `${g} graded` : "No graded alerts yet"}{r?.pending ? ` · ${r.pending} pending` : ""}{sub ? ` · ${sub}` : ""}</p>
    </div>
  );
}

function typeRecTxt(t: TypeRecord) {
  if (!t.graded) return `No graded signals yet${t.since_md ? ` · tracking since ${t.since_md}` : ""}`;
  return `${t.display}${t.pct != null ? ` (${t.pct}%)` : ""}${t.since_md ? ` since ${t.since_md}` : ""}`;
}

export default function Sharp({ data }: { data: Data }) {
  useEffect(() => { document.title = `Sharp Alerts — ${data.brand?.name ?? ""}`; }, [data.brand?.name]);
  const w = data.rlm_watch;
  const h = w?.history;
  const games = w?.games ?? [];
  const types = h?.move_types ?? [];
  const tgSince = h?.telegram_since ? md(h.telegram_since) : null;
  const research = (h?.research ?? []).filter((r) => (r.signals ?? 0) > 0);
  return (
    <>
      <PageTitle kicker="Tracking, not picks" title="Sharp Alerts">
        <p className="mt-5 max-w-2xl text-lg sm:text-xl text-white/80">
          When most of the public is on one side and the line still moves the other way, that's a reverse line move. It usually means
          the book is reacting to big, sharp bets, not the crowd. We track every one on DraftKings and grade it after the game.
        </p>
        <p className="mt-3 max-w-2xl text-white/55">These are tracked signals, not our picks. Our picks are the Big Bet, the parlay and the Honorable Mentions.</p>
        <div className="mt-7"><TelegramButton url={data.telegram_url} className="w-full sm:w-auto" /></div>
      </PageTitle>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-12" aria-labelledby="board" data-testid="section-sharp-board">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="board" className="font-display text-3xl sm:text-4xl">ON THE BOARD <span className="text-volt">NOW</span></h2>
            {w?.updated_et && <span className="text-sm text-white/50">Updated {w.updated_et.slice(11, 16)} ET</span>}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {games.length ? games.map((g, i) => (
              <article key={i} className="bg-[#121212] border-l-[6px] border-volt p-5" data-testid={`card-sharp-${i}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-display bg-volt px-2 py-0.5 text-sm text-black" data-testid="text-move-label">{g.move_label ?? "Reverse Line Move"}</span>
                  {g.type_record && <span className="text-sm font-bold text-white/80" data-testid={`text-type-record-${i}`}>{typeRecTxt(g.type_record)}</span>}
                  {g.type_record?.small && <span className="border border-white/30 px-1.5 py-px text-[11px] font-bold uppercase tracking-wide text-white/60" data-testid={`tag-small-sample-${i}`}>Small sample</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {g.league && <span className="font-display bg-white px-2 py-0.5 text-sm text-black">{g.league}</span>}
                  <span className="text-white/80 font-bold uppercase tracking-wide">{g.matchup}</span>
                  {g.tip_et && <span className="text-white/50">{g.tip_et}</span>}
                </div>
                <p className="mt-3 font-display text-2xl">{g.market === "total" ? "TOTAL" : "SPREAD"}: {g.line_is_for} {g.open_line} <span className="text-white/50">→</span> <span className="text-volt">{g.current_line}</span></p>
                <p className="mt-1 text-white/80">
                  Public on <b className="text-white">{g.public_side}</b>: <span className="text-volt">{pc0(g.public_handle_pct)}</span> of the money, {pc0(g.public_bets_pct)} of the tickets.
                </p>
                <p className="text-white/60">Line moved toward <b className="text-white">{g.moved_toward}</b> ({isNum(g.move_pts) ? `${g.move_pts} pts` : "n/a"}){g.key_number ? " · through a key number" : ""}{g.started ? " · game started" : ""}</p>
                <DkSplits fav={g.favorite} favMl={g.favorite_ml} ats={g.dk_ats} ml={g.dk_ml} />
              </article>
            )) : (
              <div className="border-4 border-dashed border-white/15 p-8 text-center md:col-span-2" data-testid="text-no-sharp">
                <p className="font-display text-2xl">No reverse line moves on the board right now.</p>
              </div>
            )}
          </div>
        </section>

        {types.length > 0 && (
          <section className="mt-12" aria-labelledby="labels" data-testid="section-move-types">
            <h2 id="labels" className="font-display text-3xl sm:text-4xl">WHAT THE <span className="text-volt">LABELS</span> MEAN</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {types.map((t) => (
                <div key={t.category ?? ""} className="bg-[#121212] p-4 border-l-4 border-white/30">
                  <dt className="font-display text-xl text-volt">{t.label}</dt>
                  <dd className="mt-1 text-white/75">{t.explain}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-white/50">Telegram alerts go out only for Reverse Line Moves. The other labels are tracked for research.</p>
          </section>
        )}

        {h && (
          <section className="mt-12" aria-labelledby="hits" data-testid="section-sharp-record">
            <h2 id="hits" className="font-display text-3xl sm:text-4xl">REVERSE LINE MOVE <span className="text-volt">RECORD</span></h2>
            <p className="mt-2 text-white/60">Tracking started {md(h.since)}. Small sample. {h.basis}</p>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
              <RecTile title="ALL REVERSE LINE MOVES" r={h.public_rlm?.all} />
              <RecTile title="SPREADS" r={h.public_rlm?.spread} />
              <RecTile title="TOTALS" r={h.public_rlm?.total} />
            </div>
            <h3 className="mt-8 font-display text-2xl text-white/80">TELEGRAM ALERTS BY TIER</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-4">
              <RecTile title="A-TIER" r={h.telegram_tiers?.A} sub={tgSince ? `alerts started ${tgSince}` : undefined} />
              <RecTile title="B-TIER" r={h.telegram_tiers?.B} sub={tgSince ? `alerts started ${tgSince}` : undefined} />
            </div>
            <p className="mt-2 text-sm text-white/50">Graded at the DraftKings line and odds in the alert, 1 unit flat.</p>

            {research.length > 0 && (
              <div className="mt-10" data-testid="section-research">
                <div className="flex flex-wrap items-end gap-3">
                  <h3 className="font-display text-2xl text-white/80">RESEARCH: SPLIT SIGNALS</h3>
                  <span className="border-2 border-white/40 px-2 py-0.5 font-display text-sm">TRACKING ONLY</span>
                </div>
                <p className="mt-2 text-sm text-white/55">Moves where the money and the tickets disagree. Not alerted, not picks. Same grading as above.</p>
                <div className="mt-3 overflow-x-auto border-t-4 border-white/30">
                  <table className="w-full text-left">
                    <thead className="bg-[#151515] font-display text-sm text-white/60">
                      <tr>{["Move type", "Record", "Hit %", "Units"].map((x) => <th key={x} scope="col" className="px-2 sm:px-3 py-3 font-normal">{x}</th>)}</tr>
                    </thead>
                    <tbody>
                      {research.map((r) => (
                        <tr key={r.category ?? ""} className="border-b border-white/5" data-testid={`row-research-${r.category}`}>
                          <td className="px-2 sm:px-3 py-3"><b className="text-white">{r.label}</b><div className="text-xs text-white/50">{r.signals} signals · {r.pending ?? 0} pending</div></td>
                          <td className="px-2 sm:px-3 py-3 font-bold whitespace-nowrap">{r.graded ? r.display : "—"}</td>
                          <td className="px-2 sm:px-3 py-3">{r.graded && isNum(r.win_pct) ? pct(r.win_pct) : "—"}</td>
                          <td className={`px-2 sm:px-3 py-3 font-bold whitespace-nowrap ${(r.units ?? 0) > 0 ? "text-volt" : (r.units ?? 0) < 0 ? "text-red-500" : ""}`}>{r.graded ? units(r.units) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="mt-12 flex flex-col items-start gap-3 border-t border-white/10 pt-8">
          <TelegramButton url={data.telegram_url} className="w-full sm:w-auto" />
          <p className="text-sm text-white/45">All lines and splits: DraftKings. 21+ · 1-800-GAMBLER</p>
        </div>
      </div>
    </>
  );
}
