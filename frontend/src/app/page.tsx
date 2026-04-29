"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Gauge, RotateCcw, ScanSearch } from "lucide-react";
import { HeroStats } from "@/components/home/HeroStats";
import { PriceDropHighlights } from "@/components/home/PriceDropHighlights";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductComparePanel } from "@/components/products/ProductComparePanel";
import { ProductFilter } from "@/components/products/ProductFilter";
import { useProducts, useSearchProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";

type StockFilter = "all" | "in_stock" | "out_stock";

const CATEGORY_LABELS: Record<string, string> = {
  GPU: "Ekran Kartı",
  CPU: "İşlemci",
  RAM: "Bellek",
  SSD: "Depolama",
  MOBO: "Anakart",
  PSU: "Güç Kaynağı",
  CASE: "Kasa",
};

function parsePrice(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const queryTerm = searchParams.get("q") ?? "";
  const isSearch = queryTerm.length >= 2;

  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const [brand, setBrand] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);

  const minPrice = useMemo(() => parsePrice(minPriceInput), [minPriceInput]);
  const maxPrice = useMemo(() => parsePrice(maxPriceInput), [maxPriceInput]);
  const inStock = stockFilter === "all" ? undefined : stockFilter === "in_stock";

  const productsQuery = useProducts({
    category: category || undefined,
    sort,
    page,
    per_page: 24,
    brand: brand.trim() || undefined,
    min_price: minPrice,
    max_price: maxPrice,
    in_stock: inStock,
  });

  const searchQuery = useSearchProducts(queryTerm);

  const isLoading = isSearch ? searchQuery.isLoading : productsQuery.isLoading;
  const isError = isSearch ? searchQuery.isError : productsQuery.isError;
  const items = isSearch ? (searchQuery.data?.items ?? []) : (productsQuery.data?.items ?? []);
  const total = isSearch ? (searchQuery.data?.total ?? 0) : (productsQuery.data?.total ?? 0);
  const pages = isSearch ? 1 : (productsQuery.data?.pages ?? 1);

  const categoryLabel = useMemo(() => {
    if (!category) return "Tüm Segmentler";
    return CATEGORY_LABELS[category.toUpperCase()] ?? category.toUpperCase();
  }, [category]);

  const visibleMin = items.reduce<number | null>((lowest, product) => {
    if (!product.min_price) return lowest;
    return lowest === null ? product.min_price : Math.min(lowest, product.min_price);
  }, null);

  const toggleCompare = (product: Product) => {
    setComparedProducts((currentProducts) => {
      if (currentProducts.some((currentProduct) => currentProduct.id === product.id)) {
        return currentProducts.filter((currentProduct) => currentProduct.id !== product.id);
      }

      if (currentProducts.length >= 4) return currentProducts;
      return [...currentProducts, product];
    });
  };

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="glass-panel scanline animate-rise overflow-hidden rounded-2xl p-5 md:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-edge/80 bg-surface-1/70 px-3 py-1 text-xs uppercase tracking-[0.22em] text-ink-muted">
              <ScanSearch size={14} />
              Canlı donanım pazarı
            </div>
            <h1 className="max-w-4xl font-display text-4xl font-semibold leading-[1.04] text-ink md:text-6xl">
              {isSearch ? `"${queryTerm}" için fiyat sinyalleri` : "Parça fiyatlarını komuta panelinden yönet"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-soft md:text-base">
              Segment seç, stok durumunu ayıkla, mağaza makasını gör ve fiyat geçmişine tek hamlede in.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="control-surface rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">Ekrandaki en düşük fiyat</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-ink">
                {visibleMin
                  ? new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                      maximumFractionDigits: 0,
                    }).format(visibleMin)
                  : "-"}
              </p>
            </div>
            <div className="control-surface rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">Görünüm</p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft">
                <Gauge size={16} />
                {isSearch ? "Arama sonuçları" : categoryLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <HeroStats total={total} categoryLabel={categoryLabel} isSearch={isSearch} query={queryTerm} />
        </div>
      </section>

      {isSearch ? (
        <section className="control-surface animate-rise rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              <span className="font-mono text-ink">{total}</span> sonuç listelendi.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-edge/80 bg-surface-2/65 px-3 py-2 text-xs text-ink-soft hover:border-signal/55"
            >
              <RotateCcw size={14} />
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

      <ProductComparePanel
        products={comparedProducts}
        onRemove={(productId) =>
          setComparedProducts((currentProducts) =>
            currentProducts.filter((currentProduct) => currentProduct.id !== productId)
          )
        }
        onClear={() => setComparedProducts([])}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-shimmer h-[390px] rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <section className="rounded-xl border border-danger/50 bg-danger/10 p-8 text-center">
          <p className="text-sm font-medium text-danger">API bağlantısı kurulamadı, veriler yüklenemedi.</p>
          <p className="mt-2 text-xs text-ink-muted">Backend kontrol: http://localhost:8300/api/health</p>
        </section>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <section className="control-surface rounded-xl p-10 text-center">
          <p className="font-display text-2xl text-ink">Sonuç bulunamadı</p>
          <p className="mt-2 text-sm text-ink-muted">
            {isSearch ? "Farklı bir marka, model veya ürün kodu dene." : "Seçili filtrelere uygun ürün yok."}
          </p>
        </section>
      ) : null}

      {!isLoading && !isError && items.length > 0 ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-ink-muted">Ürün Matrisi</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{categoryLabel}</h2>
            </div>
            <p className="rounded-full border border-edge/80 bg-surface-1/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-ink-muted">
              {total.toLocaleString("tr-TR")} kayıt
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isCompared={comparedProducts.some((currentProduct) => currentProduct.id === product.id)}
                compareDisabled={comparedProducts.length >= 4}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>

          {!isSearch && pages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 rounded-lg border border-edge/80 bg-surface-1 px-4 py-2 text-sm text-ink-soft hover:border-signal/60 disabled:opacity-40"
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
                className="inline-flex items-center gap-2 rounded-lg border border-edge/80 bg-surface-1 px-4 py-2 text-sm text-ink-soft hover:border-signal/60 disabled:opacity-40"
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
