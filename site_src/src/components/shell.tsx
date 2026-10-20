import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { RotateCw } from "lucide-react";
import { base, type Data } from "@/lib/data";

export function Logo({ name, className = "", text = "text-2xl" }: { name: string; className?: string; text?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Wordmark name={name} className={text} />;
  return <img src={`${base}logo.png`} alt={name} className={className} onError={() => setFailed(true)} data-testid="img-logo" />;
}

export function Wordmark({ name, className = "" }: { name: string; className?: string }) {
  const words = name.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : "";
  return (
    <span className={`font-display ${className}`} data-testid="text-wordmark">
      <span className="text-white">{words.join(" ")}</span>{last ? <> <span className="text-volt">{last}</span></> : null}
    </span>
  );
}

const nav = [{ href: "/", label: "Home" }, { href: "/results", label: "Results" }, { href: "/trends", label: "Trends" }];

export function Header({ data }: { data: Data | null }) {
  const [loc] = useLocation();
  const name = data?.brand?.name ?? "";
  return (
    <header className="sticky top-0 z-40 border-b-4 border-volt bg-[#0b0b0b]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3" data-testid="link-home-logo">
          {name ? <Logo name={name} className="h-10 w-auto" text="text-xl sm:text-2xl" /> : <span className="h-6 w-32 animate-pulse bg-white/10" />}
        </Link>
        <nav aria-label="Main" className="flex gap-1">
          {nav.map((n) => {
            const active = n.href === "/" ? loc === "/" : loc.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} data-testid={`link-nav-${n.label.toLowerCase()}`}
                className={`font-display px-3 py-2 text-sm sm:text-base tracking-wide transition-colors ${active ? "bg-volt text-black" : "text-white/70 hover:text-white"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function Footer({ data }: { data: Data | null }) {
  const b = data?.brand;
  return (
    <footer className="mt-20 border-t-4 border-volt bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display bg-volt px-2 py-1 text-black text-lg">21+</span>
          {b?.name && <Wordmark name={b.name} className="text-2xl" />}
          {b?.handle && b?.x_url && (
            <a href={b.x_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-volt underline-offset-4 hover:underline" data-testid="link-footer-x">{b.handle} on X</a>
          )}
        </div>
        {data?.disclaimer && <p className="max-w-3xl text-sm text-white/55 leading-relaxed" data-testid="text-disclaimer">{data.disclaimer}</p>}
      </div>
    </footer>
  );
}

export function ErrorState({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl border-l-8 border-red-500 bg-white/[.03] p-8 mt-16">
      <h2 className="font-display text-4xl">Couldn't load the board</h2>
      <p className="mt-2 text-white/60">The picks file failed to load ({error}).</p>
      <button onClick={retry} className="mt-6 inline-flex items-center gap-2 bg-volt px-5 py-3 font-display text-black hover:brightness-110" data-testid="button-retry">
        <RotateCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-24 w-3/4 animate-pulse bg-white/[.06]" />
      <div className="h-64 animate-pulse bg-white/[.04]" />
      <div className="grid gap-4 md:grid-cols-2"><div className="h-36 animate-pulse bg-white/[.04]" /><div className="h-36 animate-pulse bg-white/[.04]" /></div>
    </div>
  );
}

export function PageTitle({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <section className="streaks border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-10 rise">
        {kicker && <p className="text-volt tracking-[.25em] text-sm font-bold uppercase">{kicker}</p>}
        <h1 className="font-display text-6xl sm:text-8xl mt-2">{title}</h1>
        {children}
      </div>
    </section>
  );
}
