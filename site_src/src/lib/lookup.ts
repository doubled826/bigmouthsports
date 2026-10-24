import { useCallback, useEffect, useState } from "react";
import { base } from "@/lib/data";

export type Side = { line?: number | null; price?: number | null; handle_pct?: number | null; bets_pct?: number | null };
export type Market = { away?: Side; home?: Side; over?: Side; under?: Side; public_side?: string | null } | null;
export type HistPoint = { t: string; line: number; price?: number | null };
export type Move = { t: string; from: number; to: number; delta: number; rlm: boolean };
export type History = {
  label?: string | null; public_side?: string | null; first_seen?: string | null; first_line?: number | null; line?: number | null;
  points: HistPoint[]; latest_t?: string | null; moves: Move[]; net?: number | null; rlm?: boolean | null;
} | null;
export type Read = {
  kind: "STRONG" | "LEAN" | "none"; text: string; public_team?: string | null; public_line?: string | null;
  handle_pct?: number | null; bets_pct?: number | null; fade_team?: string | null; fade_line?: string | null; fade_price?: number | null; sharp_caution?: boolean | null;
};
export type RecordLine = { label: string; display: string; graded: number; units?: number | null; win_pct?: number | null; small?: boolean | null };
export type Game = {
  id: string; league: string; away: string; home: string; matchup: string; search: string; date: string; start_et: string;
  kickoff?: string | null; started: boolean; as_of?: string | null; lopsided_pct?: number | null;
  markets: { spread: Market; total: Market; moneyline: Market };
  history: { spread: History; total: History };
  read: Read; record?: RecordLine[] | null;
  card?: { category?: string | null; pick?: string | null; price?: number | null; url?: string | null; dk_url?: string | null } | null;
};
export type LookupData = {
  generated_at_et?: string | null; splits_as_of_et?: string | null; today: string; through?: string | null;
  dates: string[]; leagues: string[]; rule?: string | null; record_note?: string | null; games: Game[];
};

let cache: LookupData | null = null;
export const DATA_URL: string = import.meta.env.VITE_LOOKUP_DATA || `${base}data/lookup.json`;
export const CARD_BASE: string = import.meta.env.VITE_CARD_BASE || base;

export function useLookup() {
  const [data, setData] = useState<LookupData | null>(cache);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(DATA_URL, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as LookupData; cache = j; setData(j); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, error, retry: load };
}
