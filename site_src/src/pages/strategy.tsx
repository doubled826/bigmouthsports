import { useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/shell";
import { type Data } from "@/lib/data";

// Full strategy copy (approved wording, 10/24). Keep verbatim; edit here only with Dave's OK.
export const STRATEGY_FULL = [
  "Vegas doesn't build casinos by losing. Every week the TV shows, the talking heads and your timeline all hype the same sides: the big names, the hot teams, the \"can't miss\" locks. The public piles on, and that's exactly what the books want. When everybody's on one side, the books have every reason to keep that line just tempting enough.",
  "So we go the other way. We track where the DraftKings money and tickets are going, and when 60% or more of the money lands on one side, we take the other. We also watch for lines that move against the public, which usually means the books know something the crowd doesn't.",
  "No hunches and no hype. Just the numbers, posted before the game and graded after, wins and losses. Money talks. We listen.",
];

export default function Strategy({ data }: { data: Data }) {
  useEffect(() => { document.title = `Why we fade the public — ${data.brand?.name ?? ""}`; }, [data.brand?.name]);
  return (
    <>
      <PageTitle kicker="Our strategy" title="Why we fade the public" />
      <div className="mx-auto max-w-6xl px-4">
        <article className="mt-10 max-w-3xl border-l-8 border-volt bg-[#121212] p-6 sm:p-10 rise" data-testid="section-strategy-full">
          {STRATEGY_FULL.map((t, i) => (
            <p key={i} className={`text-lg sm:text-xl leading-relaxed ${i === STRATEGY_FULL.length - 1 ? "text-white" : "text-white/80"} ${i ? "mt-5" : ""}`} data-testid={`text-strategy-${i}`}>{t}</p>
          ))}
        </article>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 bg-volt px-5 py-3 font-display text-lg text-black hover:brightness-110" data-testid="link-strategy-picks">
            Today's picks <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
          <Link href="/results" className="inline-flex items-center justify-center gap-2 border-2 border-volt px-5 py-3 font-display text-lg text-volt hover:bg-volt hover:text-black" data-testid="link-strategy-results">
            See every result <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
        <p className="mt-6 text-sm text-white/45" data-testid="text-strategy-rg">21+ · 1-800-GAMBLER</p>
      </div>
    </>
  );
}
