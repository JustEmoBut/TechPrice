"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Radar, Sparkle } from "lucide-react";
import { HeroStats } from "@/components/home/HeroStats";
import { PriceDropHighlights } from "@/components/home/PriceDropHighlights";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilter } from "@/components/products/ProductFilter";
import { useProducts, useSearchProducts } from "@/hooks/useProducts";

type StockFilter = "all" | "in_stock" | "out_stock";

const CATEGORY_LABELS: Record<string, string> = {
  GPU: "GPU Segmenti",
  CPU: "CPU Segmenti",
  RAM: "RAM Segmenti",
  SSD: "SSD Segmenti",
  MOBO: "Anakart Segmenti",
  PSU: "Güç Segmenti",
  CASE: "Kasa Segmenti",
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const [brand, setBrand] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const queryTerm = searchParams.get("q") ?? "";
  const isSearch = queryTerm.length >= 2;

  const minPrice = useMemo(() => {
    const value = minPriceInput.trim();
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  }, [minPriceInput]);

  const maxPrice = useMemo(() => {
    const value = maxPriceInput.trim();
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  }, [maxPriceInput]);

  const inStock = stockFilter === "all" ? undefined : stockFilter === "in_stock";

  const productsQuery = useProducts({
    category: category || undefined,
    sort,
    page,
    per_page: 21,
    brand: brand.trim() || undefined,
    min_price: minPrice,
    max_price: maxPrice,
    in_stock: inStock,
  });

  const searchQuery = useSearchProducts(queryTerm);

  const isLoading = isSearch ? searchQuery.isLoading : productsQuery.isLoading;
  const isError = isSearch ? searchQuery.isError : productsQuery.isError;

  const items = isSearch
    ? (searchQuery.data?.items ?? [])
    : (productsQuery.data?.items ?? []);

  const total = isSearch
    ? (searchQuery.data?.total ?? 0)
    : (productsQuery.data?.total ?? 0);

  const pages = isSearch ? 1 : (productsQuery.data?.pages ?? 1);

  const categoryLabel = useMemo(() => {
    if (!category) return "Tüm Segmentler";
    return CATEGORY_LABELS[category.toUpperCase()] ?? category.toUpperCase();
  }, [category]);

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="glass-panel animate-rise rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.32em] text-ink-muted">Editoryal Fiyat Takibi</p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight text-ink md:text-5xl">
              {isSearch ? `"${queryTerm}" için canlı fiyat haritası` : "Türkiye donanım pazarını tek ekranda oku"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-ink-soft md:text-base">
              Kategoriye göre filtrele, mağazalar arası makası gör ve detay sayfasında fiyat geçmişini incele.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
            <span className="rounded-full border border-signal/40 bg-signal-soft/60 p-2 text-signal">
              <Radar size={14} />
            </span>
            Haftalık tarama aktif
          </div>
        </div>

        <div className="mt-6">
          <HeroStats total={total} categoryLabel={categoryLabel} isSearch={isSearch} query={queryTerm} />
        </div>
      </section>

      {isSearch ? (
        <section className="animate-rise rounded-2xl border border-edge/70 bg-surface-1/65 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              <span className="font-mono text-signal">{total}</span> sonuç bulundu
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-edge/80 bg-surface-2/60 px-3 py-2 text-xs text-ink-soft hover:border-signal/50"
            >
              <Sparkle size={13} />
              Aramayı temizle
            </Link>
          </div>
        </section>
      ) : (
        <ProductFilter
          selectedCategory={category}
          selectedSort={sort}
          selectedBrand={brand}
          selectedMinPrice={minPriceInput}
          selectedMaxPrice={maxPriceInput}
          selectedStock={stockFilter}
          onCategoryChange={(nextCategory) => {
            router.push(nextCategory ? `/?category=${nextCategory}` : "/");
            setPage(1);
          }}
          onSortChange={(nextSort) => {
            setSort(nextSort);
            setPage(1);
          }}
          onBrandChange={(nextBrand) => {
            setBrand(nextBrand);
            setPage(1);
          }}
          onMinPriceChange={(nextMin) => {
            setMinPriceInput(nextMin);
            setPage(1);
          }}
          onMaxPriceChange={(nextMax) => {
            setMaxPriceInput(nextMax);
            setPage(1);
          }}
          onStockChange={(nextStock) => {
            setStockFilter(nextStock);
            setPage(1);
          }}
          onResetAdvancedFilters={() => {
            setBrand("");
            setMinPriceInput("");
            setMaxPriceInput("");
            setStockFilter("all");
            setPage(1);
          }}
          totalCount={productsQuery.data?.total}
        />
      )}

      {!isLoading && !isError && !isSearch && items.length > 0 ? (
        <PriceDropHighlights products={items} />
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="animate-shimmer h-[350px] rounded-2xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <section className="rounded-2xl border border-danger/50 bg-danger/10 p-8 text-center">
          <p className="text-sm font-medium text-danger">API bağlantısı kurulamadığı için veriler yüklenemedi.</p>
          <p className="mt-2 text-xs text-ink-muted">Backend kontrol: http://localhost:8300/api/health</p>
        </section>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <section className="rounded-2xl border border-edge/70 bg-surface-1/55 p-10 text-center">
          <p className="font-display text-2xl text-ink">Sonuç bulunamadı</p>
          <p className="mt-2 text-sm text-ink-muted">
            {isSearch ? "Farklı bir marka veya model dene." : "Seçilen filtrelere uygun ürün yok."}
          </p>
        </section>
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">Ürün Listesi</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{total.toLocaleString("tr-TR")} kayıt</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {!isSearch && pages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 rounded-xl border border-edge/80 bg-surface-1 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-signal/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={15} />
                Önceki
              </button>
              <span className="rounded-full border border-edge/75 bg-surface-2/65 px-4 py-2 font-mono text-xs text-ink-soft">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((currentPage) => Math.min(pages, currentPage + 1))}
                disabled={page >= pages}
                className="inline-flex items-center gap-2 rounded-xl border border-edge/80 bg-surface-1 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-signal/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sonraki
                <ArrowRight size={15} />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
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
