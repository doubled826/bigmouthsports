import { useEffect } from "react";
import { Link } from "wouter";
import { Lock, Eye, Send, ChevronRight } from "lucide-react";
import { Logo } from "@/components/shell";
import { DkSplits } from "@/components/dk";
import { base, isNum, line, pct, signed, units, type Data, type Pick, type Record_, type Sgp } from "@/lib/data";

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
      {big && <DkSplits fav={p.favorite} favMl={p.favorite_ml} ats={p.dk_ats} ml={p.dk_ml} big />}
      <div className="mt-5"><StatusBadge status={p.status} note={p.status === "preview" ? todayNote : null} lockedAt={p.locked_at_et} /></div>
    </article>
  );
}

function legText(label?: string | null) {
  return (label ?? "").replace(/ Under /, " under ").replace(/ Over /, " over ");
}

function ParlayCard({ s, url }: { s: Sgp; url?: string | null }) {
  const t = s.today; if (!t) return null;
  const odds = t.dk_odds ?? t.odds_used ?? t.est_odds;
  const legs = t.legs ?? [];
  const rec = s.record;
  return (
    <article className="bg-[#121212] border-l-[6px] border-volt p-5 sm:p-7 rise" data-testid="card-parlay">
      <div className="flex flex-wrap items-center gap-3">
        {t.league && <span className="font-display bg-white px-2 py-0.5 text-sm text-black">{t.league}</span>}
        {t.kickoff_et && <span className="text-white/50">{t.kickoff_et}</span>}
        {t.result && t.result !== "PENDING" && <span className="font-display bg-white/20 px-2 py-0.5 text-sm">{t.result}</span>}
      </div>
      <ul className="mt-4 space-y-2">
        {legs.map((l, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2" data-testid={`text-leg-${i}`}>
            <span className="text-lg sm:text-xl font-bold text-white">{legText(l.label)}</span>
            {isNum(l.odds) && <span className="text-white/60 whitespace-nowrap">{signed(l.odds)}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-4 font-display text-3xl text-volt">{legs.length || t.n_legs} legs{isNum(odds) ? `, ${signed(odds)}` : ""}</p>
      {rec && <p className="mt-1 text-white/60">Parlay record: {rec.display ?? "0-0"}{rec.since ? ` (since ${Number(rec.since.slice(5, 7))}/${Number(rec.since.slice(8, 10))})` : ""}</p>}
      {url && (
        <a href={`${base}${url}`} className="mt-5 inline-flex items-center gap-2 bg-volt px-5 py-3 font-display text-lg text-black hover:brightness-110" data-testid="link-parlay-bet">
          Tap to load the parlay <ChevronRight className="h-5 w-5" aria-hidden />
        </a>
      )}
    </article>
  );
}

function RecordStrip({ data }: { data: Data }) {
  const r = data.records ?? {};
  const cell = (label: string, x?: Record_ | null, extra?: string | null) => (
    <div className="px-4 py-4">
      <p className="font-display text-sm tracking-[.15em] text-white/55">{label}</p>
      <p className="font-display text-4xl sm:text-5xl mt-1">{x?.display ?? "0-0"}</p>
      <p className={`font-bold ${isNum(x?.units) && x!.units! < 0 ? "text-red-500" : "text-volt"}`}>{x?.graded ? units(x?.units) : (extra ?? "")}</p>
    </div>
  );
  return (
    <Link href="/results" className="mt-6 block bg-[#121212] border-t-8 border-volt hover:bg-[#161616]" data-testid="link-record-strip">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-white/10 sm:divide-x">
        {cell("ALL-TIME", r.overall)}
        {cell("BIG BET", r.big_bet)}
        {cell("HONORABLE MENTIONS", r.honorable_mention)}
        {cell("PARLAY", data.sgp?.record, data.sgp?.record?.since ? `Since ${Number(data.sgp.record.since.slice(5, 7))}/${Number(data.sgp.record.since.slice(8, 10))}` : null)}
      </div>
      <p className="border-t border-white/10 px-4 py-3 font-display text-volt flex items-center gap-1">Full results <ChevronRight className="h-4 w-4" aria-hidden /></p>
    </Link>
  );
}

function SharpTeaser({ data }: { data: Data }) {
  const n = data.rlm_watch?.games?.length ?? 0;
  return (
    <section className="mt-14 border-4 border-volt p-5 sm:p-7" aria-labelledby="sharp" data-testid="section-sharp-teaser">
      <h2 id="sharp" className="font-display text-3xl sm:text-4xl">SHARP <span className="text-volt">ALERTS</span></h2>
      <p className="mt-2 max-w-2xl text-white/75">
        When the public piles on one side and the line moves the other way, we flag it. Tracked signals, not picks.
        {n > 0 ? <> <b className="text-white">{n} on the board right now.</b></> : null}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href="/sharp" className="inline-flex items-center justify-center gap-2 border-2 border-volt px-5 py-3 font-display text-lg text-volt hover:bg-volt hover:text-black" data-testid="link-sharp-page">
          See today's alerts <ChevronRight className="h-5 w-5" aria-hidden />
        </Link>
        {data.telegram_url && (
          <a href={data.telegram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-volt px-5 py-3 font-display text-lg text-black hover:brightness-110" data-testid="link-telegram-teaser">
            <Send className="h-5 w-5" aria-hidden /> Free alerts on Telegram
          </a>
        )}
      </div>
    </section>
  );
}

export default function Home({ data }: { data: Data }) {
  const b = data.brand ?? {};
  const name = b.name ?? "";
  useEffect(() => { document.title = `${name}${b.tagline ? " — " + b.tagline : ""}`; }, [name, b.tagline]);
  // Deep links from /links/: /?go=bb|rec#/ scrolls to that section; ?go=rlm|sharp opens the Sharp Alerts page.
  useEffect(() => {
    const go = new URLSearchParams(window.location.search).get("go");
    if (!go || !/^[a-z]+$/.test(go)) return;
    if (go === "rlm" || go === "sharp") { window.location.replace(`${window.location.pathname}#/sharp`); return; }
    let n = 0; const id = window.setInterval(() => {
      const el = document.getElementById(go);
      if (el || ++n > 20) {
        window.clearInterval(id); const sec = el?.closest("section"); if (!sec) return;
        const hdr = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
        window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - hdr - 12 });
      }
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  const t = data.today;
  const hms = t?.honorable_mentions ?? [];
  const parlay = data.sgp?.today && data.sgp.today.date === t?.date ? data.sgp : null;
  return (
    <>
      <section className="streaks relative overflow-hidden border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 rise flex items-center gap-5">
          {name && <Logo name={name} className="h-20 sm:h-28 w-auto shrink-0" text="hidden" />}
          <div>
            {b.tagline && <p className="font-display text-3xl sm:text-5xl leading-none">{b.tagline}</p>}
            <p className="mt-2 text-lg sm:text-2xl font-bold text-volt">Every pick tracked.</p>
            <p className="mt-2 text-white/55 text-sm sm:text-base max-w-xl">When 60%+ of the money lands on one side, we take the other.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-10" aria-labelledby="bb">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="bb" className="font-display text-4xl sm:text-6xl">BIG MOUTH'S <span className="text-volt">BIG BET</span></h2>
            {t?.date && <span className="text-white/50">{t.date}</span>}
          </div>
          <div className="mt-5">
            {t?.big_bet ? <PickCard p={t.big_bet} big todayNote={t.status_note} idx={0} /> : (
              <div className="border-4 border-dashed border-white/15 p-10 text-center" data-testid="text-no-big-bet">
                <p className="font-display text-3xl sm:text-4xl">No Big Bet today — the public didn't give us one.</p>
                <p className="mt-2 text-volt text-xl font-bold">We don't force it.</p>
                {t?.status_note && <p className="mt-3 text-white/50">{t.status_note}</p>}
              </div>
            )}
          </div>
        </section>

        {parlay && (
          <section className="mt-14" aria-labelledby="parlay">
            <h2 id="parlay" className="font-display text-3xl sm:text-4xl">BIG MOUTH'S <span className="text-volt">PARLAY</span></h2>
            <div className="mt-5 max-w-3xl"><ParlayCard s={parlay} url={data.parlay_bet_url} /></div>
          </section>
        )}

        {hms.length > 0 && (
          <section className="mt-14" aria-labelledby="hm">
            <h2 id="hm" className="font-display text-3xl sm:text-4xl">HONORABLE MENTIONS</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {hms.map((p, i) => <PickCard key={i} p={p} todayNote={t?.status_note} idx={i + 1} />)}
            </div>
          </section>
        )}

        <section className="mt-14" aria-labelledby="rec">
          <h2 id="rec" className="font-display text-3xl sm:text-4xl">THE <span className="text-volt">RECORD</span></h2>
          <RecordStrip data={data} />
        </section>

        <SharpTeaser data={data} />
        {data.splits_as_of_et && <p className="mt-6 text-sm text-white/45" data-testid="text-updated">DraftKings data updated {data.splits_as_of_et.slice(11, 16)} ET · 21+ · 1-800-GAMBLER</p>}
      </div>
    </>
  );
}
