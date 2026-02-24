"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts, useSearchProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilter } from "@/components/products/ProductFilter";

function HomeContent() {
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const cat = searchParams.get("category") ?? "";
    setCategory(cat);
    setPage(1);
  }, [searchParams]);

  const q = searchParams.get("q") ?? "";
  const isSearch = q.length >= 2;

  const productsQuery = useProducts({
    category: category || undefined,
    sort,
    page,
    per_page: 21,
  });

  const searchQuery = useSearchProducts(q);

  const isLoading = isSearch ? searchQuery.isLoading : productsQuery.isLoading;
  const isError = isSearch ? searchQuery.isError : productsQuery.isError;

  const items = isSearch
    ? (searchQuery.data?.items ?? [])
    : (productsQuery.data?.items ?? []);

  const total = isSearch
    ? (searchQuery.data?.total ?? 0)
    : (productsQuery.data?.total ?? 0);

  const pages = isSearch ? 1 : (productsQuery.data?.pages ?? 1);

  return (
    <div className="space-y-6">
      {/* Sayfa basligi */}
      {!isSearch && (
        <div className="flex items-start justify-between py-2 border-b border-[#27272a]">
          <div>
            <h1 className="text-lg font-semibold text-[#f4f4f5]">Fiyat Karsilastirma</h1>
            <p className="text-sm text-[#71717a] mt-0.5">
              Itopya, InceHesap ve Sinerji — tek ekranda
            </p>
          </div>
          {productsQuery.data && (
            <div className="hidden sm:flex items-center gap-5">
              <div className="text-right">
                <span className="block font-mono text-base font-semibold text-[#f4f4f5]">
                  {productsQuery.data.total}
                </span>
                <span className="text-xs text-[#52525b]">Urun</span>
              </div>
              <div className="w-px h-8 bg-[#27272a]" />
              <div className="text-right">
                <span className="block font-mono text-base font-semibold text-[#3b82f6]">3</span>
                <span className="text-xs text-[#52525b]">Site</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Arama sonucu baslik */}
      {isSearch && (
        <div className="py-2 border-b border-[#27272a]">
          <p className="text-sm text-[#71717a]">
            <span className="font-mono text-[#f4f4f5]">&quot;{q}&quot;</span> icin{" "}
            <span className="text-[#f4f4f5]">{total}</span> sonuc
          </p>
        </div>
      )}

      {/* Filtreler */}
      {!isSearch && (
        <ProductFilter
          selectedCategory={category}
          selectedSort={sort}
          onCategoryChange={(cat) => { setCategory(cat); setPage(1); }}
          onSortChange={(s) => { setSort(s); setPage(1); }}
          totalCount={productsQuery.data?.total}
        />
      )}

      {/* Loading shimmer */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-72 rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-[#27272a] bg-[#111113] p-8 text-center">
          <p className="text-[#ef4444] font-medium text-sm">
            API&apos;ye baglanamadi. Backend calisiyor mu?
          </p>
          <p className="text-xs text-[#52525b] mt-2 font-mono">http://localhost:8300/api/health</p>
        </div>
      )}

      {/* Bos durum */}
      {!isLoading && !isError && items.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[#71717a]">Hic urun bulunamadi.</p>
          <p className="text-sm text-[#52525b] mt-1">
            {isSearch
              ? "Farkli bir arama terimi deneyin."
              : "Fiyatlar her pazar otomatik guncellenir."}
          </p>
        </div>
      )}

      {/* Urun Grid */}
      {!isLoading && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {!isSearch && pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-md text-sm border border-[#27272a] bg-[#111113] text-[#f4f4f5] hover:bg-[#18181b] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                &larr; Onceki
              </button>
              <span className="font-mono text-sm text-[#71717a] px-2">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-4 py-2 rounded-md text-sm border border-[#27272a] bg-[#111113] text-[#f4f4f5] hover:bg-[#18181b] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Sonraki &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
