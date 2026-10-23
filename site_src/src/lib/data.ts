import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";

export type Pick = {
  status?: string | null; category?: string | null; league?: string | null; matchup?: string | null;
  away?: string | null; home?: string | null; kickoff_et?: string | null; kickoff_iso?: string | null;
  pick_team?: string | null; pick_line?: string | number | null; pick_price?: number | string | null;
  line_source?: string | null; public_team?: string | null; public_line?: string | number | null;
  public_handle_pct?: number | null; public_bets_pct?: number | null; tier?: string | null;
  public_on_ml_favorite?: boolean | null; prime_time?: boolean | null; locked_at_et?: string | null;
  favorite?: string | null; favorite_ml?: number | null; favorite_basis?: string | null;
  dk_ats?: DkSplit | null; dk_ml?: DkSplit | null; dk_splits_as_of?: string | null;
};
export type DkSplit = {
  public_team?: string | null; public_handle_pct?: number | null; public_bets_pct?: number | null;
  away_team?: string | null; away_handle_pct?: number | null; away_bets_pct?: number | null;
  home_team?: string | null; home_handle_pct?: number | null; home_bets_pct?: number | null;
};
export type RlmGame = {
  league?: string | null; matchup?: string | null; market?: string | null; public_side?: string | null;
  public_handle_pct?: number | null; public_bets_pct?: number | null; open_line?: string | null; current_line?: string | null;
  line_is_for?: string | null; move_pts?: number | null; key_number?: boolean | null; moved_toward?: string | null;
  tip_et?: string | null; started?: boolean | null; as_of?: string | null;
  favorite?: string | null; favorite_ml?: number | null; dk_ats?: DkSplit | null; dk_ml?: DkSplit | null;
};
export type RlmWatch = {
  date?: string | null; updated_et?: string | null; label?: string | null; rule?: string | null; games?: RlmGame[] | null;
  tracker?: { spread?: Record_ & { since?: string | null } | null; total?: Record_ & { since?: string | null } | null } | null;
  tracker_note?: string | null;
};
export type Record_ = {
  wins?: number | null; losses?: number | null; pushes?: number | null; graded?: number | null;
  units?: number | null; win_pct?: number | null; roi?: number | null; display?: string | null;
};
export type ResultRow = {
  date?: string | null; category?: string | null; category_label?: string | null; league?: string | null; matchup?: string | null;
  pick?: string | null; price?: number | string | null; public_faded?: number | string | null;
  result?: string | null; units?: number | null; clv?: number | string | null;
  closing_line?: string | null; final_score?: string | null;
};
export type TrendRow = Record_ & { label?: string | null };
export type Data = {
  generated_at_et?: string | null; splits_as_of_et?: string | null;
  brand?: { name?: string | null; handle?: string | null; x_url?: string | null; tagline?: string | null } | null;
  records?: { big_bet?: Record_ | null; honorable_mention?: Record_ | null; overall?: Record_ | null; record_start_note?: string | null } | null;
  today?: { date?: string | null; status?: string | null; status_note?: string | null; big_bet?: Pick | null; honorable_mentions?: Pick[] | null; big_bet_image?: string | null } | null;
  results?: ResultRow[] | null;
  trends?: { by_league?: TrendRow[] | null; by_public_tier?: TrendRow[] | null; prime_time?: TrendRow[] | null; ml_favorite_faded?: TrendRow[] | null; note?: string | null } | null;
  rlm_watch?: RlmWatch | null;
  disclaimer?: string | null;
};

export const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + "/";

let cache: Data | null = null;

export function usePicks() {
  const [data, setData] = useState<Data | null>(cache);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cache);
  const [location] = useLocation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${base}data/picks.json`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as Data;
      cache = j;
      setData(j);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [location, load]);
  useEffect(() => {
    const f = () => { if (document.visibilityState !== "hidden") load(); };
    window.addEventListener("focus", f);
    document.addEventListener("visibilitychange", f);
    return () => { window.removeEventListener("focus", f); document.removeEventListener("visibilitychange", f); };
  }, [load]);

  return { data, error, loading, retry: load };
}

export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
export const signed = (v: number | string | null | undefined, d = 0) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  return (n > 0 ? "+" : "") + n.toFixed(d);
};
export const units = (v: number | null | undefined) => (isNum(v) ? `${signed(v, 2)}u` : null);
export const pct = (v: number | null | undefined) => {
  if (!isNum(v)) return null;
  const n = Math.abs(v) <= 1 ? v * 100 : v;
  return `${n.toFixed(1)}%`;
};
export const pctNum = (v: number | null | undefined) => (isNum(v) ? (Math.abs(v) <= 1 ? v * 100 : v) : null);
export const line = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") return signed(v, Number.isInteger(v) ? 0 : 1) ?? "";
  return v;
};
