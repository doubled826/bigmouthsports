import { useEffect } from "react";
import { Lock, Eye } from "lucide-react";
import { Logo, Wordmark } from "@/components/shell";
import { base, isNum, line, pct, signed, units, type Data, type DkSplit, type Pick, type Record_, type RlmWatch } from "@/lib/data";

const pc0 = (v: number | null | undefined) => (isNum(v) ? `${Math.round(v)}%` : "n/a");

function DkSplits({ fav, favMl, ats, ml, big }: { fav?: string | null; favMl?: number | null; ats?: DkSplit | null; ml?: DkSplit | null; big?: boolean }) {
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

function RlmTile({ title, r }: { title: string; r?: (Record_ & { since?: string | null }) | null }) {
  const u = units(r?.units);
  return (
    <div className="bg-[#121212] border-t-4 border-white/30 p-5" data-testid={`tile-rlm-${title.replace(/\W+/g, "-").toLowerCase()}`}>
      <h4 className="font-display text-lg text-white/70">{title}</h4>
      <p className="font-display text-4xl mt-2">{r?.graded ? r.display : "—"}</p>
      {r?.graded ? <p className={`font-display text-2xl ${isNum(r?.units) && r!.units! < 0 ? "text-red-500" : "text-white/80"}`}>{u}</p> : null}
      <p className="mt-2 text-sm text-white/50">{r?.graded ? `${r.graded} graded${r.since ? ` since ${r.since}` : ""} · small sample` : "No graded games yet"}</p>
    </div>
  );
}

function RlmSection({ w }: { w: RlmWatch }) {
  const games = w.games ?? [];
  return (
    <section className="mt-14" aria-labelledby="rlm" data-testid="section-rlm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="rlm" className="font-display text-3xl sm:text-4xl">LINE MOVEMENT <span className="text-volt">WATCH</span></h2>
        <span className="border-2 border-white/40 px-2 py-0.5 font-display text-sm text-white">TRACKING · NOT PICKS</span>
      </div>
      {w.rule && <p className="mt-3 max-w-3xl text-white/65">{w.rule}</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {games.length ? games.map((g, i) => (
          <article key={i} className="bg-[#121212] border-l-[6px] border-white/40 p-5" data-testid={`card-rlm-${i}`}>
            <div className="flex flex-wrap items-center gap-3">
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
          <div className="border-4 border-dashed border-white/15 p-8 text-center md:col-span-2" data-testid="text-no-rlm">
            <p className="font-display text-2xl">No reverse line moves on the board right now.</p>
          </div>
        )}
      </div>
      <h3 className="mt-8 font-display text-2xl text-white/80">RLM TRACKER</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <RlmTile title="SPREADS (AGAINST THE PUBLIC)" r={w.tracker?.spread} />
        <RlmTile title="TOTALS (AGAINST THE PUBLIC)" r={w.tracker?.total} />
      </div>
      {w.tracker_note && <p className="mt-3 text-sm text-white/50">{w.tracker_note}</p>}
      <p className="mt-1 text-sm text-white/40">All lines and splits: DraftKings.{w.updated_et ? ` Updated ${w.updated_et.slice(11, 16)} ET.` : ""}</p>
    </section>
  );
}

function StatusBadge({ status, note, lockedAt }: { status?: string | null; note?: string | null; lockedAt?: string | null }) {
  const s = (status ?? "").toLowerCase();
  if (s === "locked") return (
    <div className="flex flex-wrap items-center gap-2" data-testid="status-locked">
      <span className="inline-flex items-center gap-1 bg-volt px-2 py-1 font-display text-sm text-black"><Lock className="h-3.5 w-3.5" />LOCKED</span>
      {lockedAt && <span className="text-sm text-white/60">{lockedAt}</span>}
    </div>
  );
  if (s === "preview") return (
    <div className="flex flex-wrap items-center gap-2" data-testid="status-preview">
      <span className="inline-flex items-center gap-1 border-2 border-white/40 px-2 py-0.5 font-display text-sm text-white"><Eye className="h-3.5 w-3.5" />PREVIEW · NOT LOCKED</span>
      {note && <span className="text-sm text-white/60">{note}</span>}
    </div>
  );
  return null;
}

function PickCard({ p, big, todayNote, idx }: { p: Pick; big?: boolean; todayNote?: string | null; idx: number }) {
  const price = signed(p.pick_price);
  const handle = pct(p.public_handle_pct);
  const bets = pct(p.public_bets_pct);
  return (
    <article className={`relative overflow-hidden bg-[#121212] ${big ? "border-l-[12px] p-6 sm:p-10" : "border-l-[6px] p-5"} border-volt rise`}
      style={{ animationDelay: `${idx * 80}ms` }} data-testid={big ? "card-big-bet" : `card-hm-${idx}`}>
      <div className="flex flex-wrap items-center gap-3">
        {p.league && <span className="font-display bg-white px-2 py-0.5 text-sm text-black">{p.league}</span>}
        {p.matchup && <span className="text-white/80 font-bold uppercase tracking-wide">{p.matchup}</span>}
        {p.kickoff_et && <span className="text-white/50">{p.kickoff_et}</span>}
      </div>
      <p className={`font-display text-volt mt-4 ${big ? "text-6xl sm:text-8xl lg:text-9xl" : "text-4xl sm:text-5xl"}`} data-testid="text-pick">
        {[p.pick_team, line(p.pick_line)].filter(Boolean).join(" ")}{price ? <span className={big ? "text-4xl sm:text-6xl align-middle" : "text-2xl"}> ({price})</span> : null}
      </p>
      {p.line_source && <p className="mt-2 text-white/50 text-sm uppercase tracking-wider">Line via {p.line_source}</p>}
      {(handle || p.public_team) && (
        <p className={`mt-4 text-white ${big ? "text-2xl" : "text-lg"}`}>
          {handle && <span className="text-volt">{handle}</span>}{handle && " of the money on "}
          {[p.public_team, line(p.public_line)].filter(Boolean).join(" ")}.
        </p>
      )}
      {bets && <p className="text-white/55">{bets} of tickets on the public side</p>}
      <DkSplits fav={p.favorite} favMl={p.favorite_ml} ats={p.dk_ats} ml={p.dk_ml} big={big} />
      <div className="mt-5"><StatusBadge status={p.status} note={p.status === "preview" ? todayNote : null} lockedAt={p.locked_at_et} /></div>
    </article>
  );
}

function RecordTile({ title, r, note }: { title: string; r?: Record_ | null; note?: string | null }) {
  const graded = r?.graded ?? 0;
  const u = units(r?.units);
  const wp = pct(r?.win_pct);
  const roi = isNum(r?.roi) ? `${signed(Math.abs(r!.roi!) <= 1 ? r!.roi! * 100 : r!.roi!, 1)}%` : null;
  return (
    <div className="bg-[#121212] border-t-8 border-volt p-6" data-testid={`tile-${title.replace(/\W+/g, "-").toLowerCase()}`}>
      <h3 className="font-display text-xl text-white/70">{title}</h3>
      <p className="font-display text-6xl mt-3">{r?.display ?? "—"}</p>
      {u && <p className={`font-display text-3xl mt-1 ${isNum(r?.units) && r!.units! < 0 ? "text-red-500" : "text-volt"}`}>{u}</p>}
      {graded === 0 ? (note && <p className="mt-3 text-white/60">{note}</p>) : (
        <div className="mt-3 flex gap-6 text-white/70">
          {wp && <span>Win {wp}</span>}{roi && <span>ROI {roi}</span>}
        </div>
      )}
    </div>
  );
}

export default function Home({ data }: { data: Data }) {
  const b = data.brand ?? {};
  const name = b.name ?? "";
  useEffect(() => { document.title = `${name}${b.tagline ? " — " + b.tagline : ""}`; }, [name, b.tagline]);
  // Deep links from /links/: /?go=bb|rlm|rec#/ scrolls to that section (hash is the router, so sections use ?go=).
  useEffect(() => {
    const go = new URLSearchParams(window.location.search).get("go");
    if (!go || !/^[a-z]+$/.test(go)) return;
    let n = 0; const id = window.setInterval(() => {
      const el = document.getElementById(go);
      if (el || ++n > 20) { window.clearInterval(id); el?.closest("section")?.scrollIntoView({ block: "start" }); }
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  const t = data.today;
  const hms = t?.honorable_mentions ?? [];
  return (
    <>
      <section className="streaks relative overflow-hidden border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 rise">
          {name && <Logo name={name} className="h-20 sm:h-28 w-auto mb-6" text="hidden" />}
          <h1 className="text-[17vw] sm:text-[9rem] lg:text-[11rem]"><Wordmark name={name} className="block leading-[.85]" /></h1>
          <div className="mt-2 h-3 w-40 bg-volt" />
          {b.tagline && <p className="mt-6 max-w-2xl text-2xl sm:text-3xl font-bold text-white/85">{b.tagline}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {b.x_url && <a href={b.x_url} target="_blank" rel="noopener noreferrer" className="font-display bg-volt px-6 py-3 text-xl text-black hover:brightness-110" data-testid="link-follow-x">Follow on X</a>}
            <span className="text-white/50 tracking-[.2em] text-sm font-bold">NFL · CFB · NBA | DAILY BIG BET</span>
          </div>
          <div className="mt-10 max-w-2xl border-l-4 border-white/20 pl-4 text-white/65">
            <span className="font-display text-white">The method:</span> when 60%+ of the spread money lands on one side, we take the other. A discipline, not a guarantee — every result is tracked in public, wins and losses alike.
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-14" aria-labelledby="bb">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="bb" className="font-display text-4xl sm:text-6xl">BIG MOUTH'S <span className="text-volt">BIG BET</span></h2>
            {t?.date && <span className="text-white/50">{t.date}</span>}
          </div>
          <div className="mt-6">
            {t?.big_bet ? (
              <>
                <PickCard p={t.big_bet} big todayNote={t.status_note} idx={0} />
                {t.big_bet_image && (
                  <img src={`${base}${t.big_bet_image}`} alt="Big Mouth's Big Bet card" loading="lazy"
                    className="mt-6 w-full max-w-3xl border border-white/10" data-testid="img-big-bet-card" />
                )}
              </>
            ) : (
              <div className="border-4 border-dashed border-white/15 p-10 text-center" data-testid="text-no-big-bet">
                <p className="font-display text-3xl sm:text-4xl">No Big Bet today — the public didn't give us one.</p>
                <p className="mt-2 text-volt text-xl font-bold">We don't force it.</p>
                {t?.status_note && <p className="mt-3 text-white/50">{t.status_note}</p>}
              </div>
            )}
          </div>
        </section>

        {hms.length > 0 && (
          <section className="mt-14" aria-labelledby="hm">
            <h2 id="hm" className="font-display text-3xl sm:text-4xl">HONORABLE MENTIONS</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {hms.map((p, i) => <PickCard key={i} p={p} todayNote={t?.status_note} idx={i + 1} />)}
            </div>
          </section>
        )}

        {data.rlm_watch && <RlmSection w={data.rlm_watch} />}

        <section className="mt-14" aria-labelledby="rec">
          <h2 id="rec" className="sr-only">Records</h2>
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <RecordTile title="ALL-TIME BIG BET RECORD" r={data.records?.big_bet} note={data.records?.record_start_note} />
            <RecordTile title="HONORABLE MENTIONS RECORD" r={data.records?.honorable_mention} note={data.records?.record_start_note} />
          </div>
          {data.splits_as_of_et && <p className="mt-4 text-sm text-white/45" data-testid="text-updated">Data updated {data.splits_as_of_et}</p>}
        </section>
      </div>
    </>
  );
}
