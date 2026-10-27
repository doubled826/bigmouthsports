import { useCallback, useEffect, useState } from "react";
import { base, isNum } from "@/lib/data";

export type Side = { line?: number | null; price?: number | null; handle_pct?: number | null; bets_pct?: number | null };
export type Market = { away?: Side; home?: Side; over?: Side; under?: Side; public_side?: string | null } | null;
export type HistPoint = { t: string; line: number; price?: number | null };
export type Move = { t: string; from: number; to: number; delta: number; rlm: boolean };
export type History = {
  label?: string | null; public_side?: string | null; first_seen?: string | null; first_line?: number | null; line?: number | null;
  points: HistPoint[]; latest_t?: string | null; moves: Move[]; net?: number | null; rlm?: boolean | null;
} | null;
export type BetAction = "suggest" | "none";
export type Read = {
  kind: "STRONG" | "LEAN" | "none"; text: string; public_team?: string | null; public_line?: string | null;
  handle_pct?: number | null; bets_pct?: number | null; fade_team?: string | null; fade_line?: string | null; fade_price?: number | null; sharp_caution?: boolean | null;
  /** Additive (lookup.py). Old files omit these; the page falls back to kind + fade_*. */
  action?: BetAction | null; reason?: string | null;
  suggested_bet?: string | null; suggested_line?: string | null; suggested_price?: number | null;
};
/** What the published spread model already decided. Display only — do not re-qualify here. */
export type SuggestedBet = {
  action: BetAction; tier: "STRONG" | "LEAN" | null;
  team: string | null; line: string | null; price: number | null; reason: string | null;
};

const named = (v?: string | null) => {
  const s = (v ?? "").trim();
  return s || null;
};

/**
 * Map one game's `read` to the bet to show.
 * `action` wins when the exporter sends it. Otherwise STRONG/LEAN plus a side is a suggestion
 * (today's read()), and everything else is no bet. Never invent a team, line, or price.
 */
export function suggestedBet(r: Read): SuggestedBet {
  const tier = r.kind === "STRONG" || r.kind === "LEAN" ? r.kind : null;
  const namedBet = named(r.suggested_bet);
  const legacyTeam = named(r.fade_team);
  const team = namedBet ?? legacyTeam;
  // Use fade line/price only for the same team (legacy files, or additive fields that repeat it). Never mix a new side with an old price.
  const sameTeam = !namedBet || namedBet === legacyTeam;
  const line = named(r.suggested_line) ?? (sameTeam ? named(r.fade_line) : null);
  const price = isNum(r.suggested_price) ? r.suggested_price : (sameTeam && isNum(r.fade_price) ? r.fade_price : null);
  const legacyText = named(r.text);
  const reason = named(r.reason) ?? (legacyText && !/^fade spot\b/i.test(legacyText) ? legacyText : null);
  const action: BetAction = r.action === "suggest" || r.action === "none" ? r.action : tier && team ? "suggest" : "none";
  if (action === "suggest" && team) return { action, tier, team, line, price, reason: null };
  return { action: "none", tier: null, team: null, line: null, price: null, reason };
}

/** Footer blurb. Exporter owns the sentence. This only rewords the exact pre-patch v3 line until lookup.py ships the new one. */
export const RULE_V3_SUGGESTED =
  "Rule v3: suggest a spread bet on the side opposite the DK public when the public has 60%+ of the money and more than 50% of the tickets. 60-69% LEAN, 70%+ STRONG, 99-100% skipped. No bet when the money is 20+ points ahead of the tickets.";
const RULE_V3_FADE =
  "Rule v3: fade the spread side with 60%+ of the DK money and more than 50% of the DK tickets. 60-69% LEAN, 70%+ STRONG, 99-100% skipped. No play when the money is 20+ points ahead of the tickets.";
export function ruleBlurb(rule?: string | null): string | null {
  if (!rule) return null;
  return rule === RULE_V3_FADE ? RULE_V3_SUGGESTED : rule;
}
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
