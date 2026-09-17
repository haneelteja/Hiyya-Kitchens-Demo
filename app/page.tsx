import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-hiyya-muted">
        Phase 0 — scaffold
      </p>
      <h1 className="font-heading text-4xl font-semibold text-hiyya-champagne">
        HIYYA Command Center
      </h1>
      <p className="max-w-md text-sm text-hiyya-muted">
        Next.js, Tailwind, and shadcn/ui are wired up with the HIYYA black-and-gold
        tokens. The persona switcher and tabs land in Phase 2.
      </p>
      <Button className="mt-2">Design tokens look right</Button>
    </main>
  );
}
