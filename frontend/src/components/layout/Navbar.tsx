"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Command, Search, SlidersHorizontal } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";

  const status = useMemo(() => {
    if (pathname?.startsWith("/products/")) return "Ürün derin analizi";
    if (initialQuery) return "Arama modu";
    return "Pazar ekranı";
  }, [initialQuery, pathname]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const term = String(formData.get("q") ?? "").trim();
    if (term.length < 2) {
      router.push("/");
      return;
    }
    router.push(`/?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-edge/70 bg-surface-0/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
        <Link href="/" className="group inline-flex min-w-fit items-center gap-3">
          <span className="glow-ring grid size-11 place-items-center rounded-lg border border-signal/45 bg-signal-soft/80 text-signal transition-transform duration-300 group-hover:rotate-3">
            <Command size={18} />
          </span>
          <span>
            <span className="block font-display text-sm font-semibold uppercase tracking-[0.32em] text-ink">
              TechPrice
            </span>
            <span className="mt-0.5 block text-xs text-ink-muted">{status}</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="w-full md:max-w-xl">
          <label className="control-surface flex h-12 items-center gap-3 rounded-xl px-3">
            <Search className="text-ink-muted" size={17} />
            <input
              key={initialQuery}
              name="q"
              type="search"
              defaultValue={initialQuery}
              placeholder="Model, marka veya ürün kodu ara"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none"
            />
            <span className="hidden items-center gap-1 rounded-md border border-edge/70 bg-surface-2 px-2 py-1 text-[11px] text-ink-muted sm:inline-flex">
              <SlidersHorizontal size={12} />
              Enter
            </span>
          </label>
        </form>
      </div>
    </header>
  );
}
