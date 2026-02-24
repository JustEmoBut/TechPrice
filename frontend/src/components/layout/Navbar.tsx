"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#09090b]/95 backdrop-blur-sm border-b border-[#27272a]">
      <div className="container mx-auto flex h-14 items-center gap-6 px-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-sm tracking-widest shrink-0">
          <span className="text-[#f4f4f5]">TECH</span>
          <span className="text-[#3b82f6]">PRICE</span>
        </Link>

        {/* Arama */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <input
            type="search"
            placeholder="Urun, marka ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md bg-[#18181b] border border-[#27272a] px-3 py-1.5 text-sm text-[#f4f4f5] placeholder:text-[#52525b] focus:outline-none focus:border-[#3b82f6]/60 focus:ring-1 focus:ring-[#3b82f6]/30 transition-colors"
          />
        </form>
      </div>
    </header>
  );
}
