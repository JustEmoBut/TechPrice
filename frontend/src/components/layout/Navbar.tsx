"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Sparkles } from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";

  const subtitle = useMemo(() => {
    if (pathname?.startsWith("/products/")) return "Derin ürün analizi";
    return "Canlı fiyat radarı";
  }, [pathname]);

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
    <header className="sticky top-0 z-50 border-b border-edge/60 bg-surface-0/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-4 md:px-8 md:py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="rounded-xl border border-signal/40 bg-signal-soft/70 p-2 text-signal transition-transform duration-300 group-hover:scale-105 glow-ring">
                <Sparkles size={16} />
              </span>
              <div>
                <p className="font-display text-xs uppercase tracking-[0.3em] text-ink-soft">
                  TechPrice
                </p>
                <p className="text-xs text-ink-muted">{subtitle}</p>
              </div>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="w-full md:max-w-md">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
              <input
                key={initialQuery}
                name="q"
                type="search"
                defaultValue={initialQuery}
                placeholder="Ürün veya marka ara..."
                className="h-11 w-full rounded-xl border border-edge/80 bg-surface-1/75 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted/70 transition-all duration-300 focus:border-signal/80 focus:outline-none focus:ring-2 focus:ring-signal/30"
              />
            </label>
          </form>
        </div>
      </div>
    </header>
  );
}
