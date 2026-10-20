import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-5xl text-volt">404</h1>
      <p className="mt-3 text-white/70">That page doesn't exist.</p>
      <Link href="/" className="mt-6 inline-block font-display bg-volt px-5 py-2 text-black">Back home</Link>
    </div>
  );
}
