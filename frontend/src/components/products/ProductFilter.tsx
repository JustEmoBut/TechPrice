"use client";

import { Cpu, Database, HardDrive, Layers, LayoutGrid, Monitor, Shield, SlidersHorizontal, Zap } from "lucide-react";
import { useCategories } from "@/hooks/useProducts";

const KNOWN_CATEGORIES = [
  { name: "GPU", label: "Ekran Kartı", icon: Monitor },
  { name: "CPU", label: "İşlemci", icon: Cpu },
  { name: "RAM", label: "Bellek", icon: Database },
  { name: "SSD", label: "SSD", icon: HardDrive },
  { name: "MOBO", label: "Anakart", icon: Layers },
  { name: "PSU", label: "Güç", icon: Zap },
  { name: "CASE", label: "Kasa", icon: Shield },
];

type StockFilter = "all" | "in_stock" | "out_stock";

interface Props {
  selectedCategory?: string;
  selectedSort?: string;
  selectedBrand?: string;
  selectedMinPrice?: string;
  selectedMaxPrice?: string;
  selectedStock?: StockFilter;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
  onBrandChange: (brand: string) => void;
  onMinPriceChange: (minPrice: string) => void;
  onMaxPriceChange: (maxPrice: string) => void;
  onStockChange: (stock: StockFilter) => void;
  onResetAdvancedFilters: () => void;
  totalCount?: number;
}

function categoryIsActive(selectedCategory: string | undefined, name: string) {
  return (selectedCategory ?? "").toUpperCase() === name.toUpperCase();
}

export function ProductFilter({
  selectedCategory,
  selectedSort,
  selectedBrand,
  selectedMinPrice,
  selectedMaxPrice,
  selectedStock = "all",
  onCategoryChange,
  onSortChange,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onStockChange,
  onResetAdvancedFilters,
  totalCount,
}: Props) {
  const { data: categoryData } = useCategories();

  const countMap = Object.fromEntries(
    (categoryData?.categories ?? []).map((category) => [category.name.toUpperCase(), category.product_count])
  );

  return (
    <section className="glass-panel animate-rise rounded-2xl p-4 md:p-5">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-edge/80 bg-surface-1/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink-muted">
              <SlidersHorizontal size={14} />
              Filtre Konsolu
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold text-ink">Segment, fiyat ve stok ayarı</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Listeyi satın alma kararına yaklaştıran sinyallerle daralt.
            </p>
          </div>

          <div className="control-surface rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">Toplam</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-ink">{totalCount ?? "--"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            <button
              onClick={() => onCategoryChange("")}
              className={`group min-h-24 rounded-xl border p-3 text-left transition-all duration-300 ${
                !selectedCategory
                  ? "border-signal/75 bg-signal text-black"
                  : "border-edge/70 bg-surface-1/70 text-ink-muted hover:border-signal/45 hover:text-ink-soft"
              }`}
            >
              <LayoutGrid size={17} className="mb-3" />
              <p className="text-xs font-semibold uppercase tracking-wider">Hepsi</p>
              <p className="mt-2 font-mono text-[11px] opacity-75">{totalCount ?? "--"}</p>
            </button>

            {KNOWN_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const active = categoryIsActive(selectedCategory, category.name);
              const count = countMap[category.name.toUpperCase()];

              return (
                <button
                  key={category.name}
                  onClick={() => onCategoryChange(category.name)}
                  className={`group min-h-24 rounded-xl border p-3 text-left transition-all duration-300 ${
                    active
                      ? "border-signal/75 bg-signal text-black"
                      : "border-edge/70 bg-surface-1/70 text-ink-muted hover:border-signal/45 hover:text-ink-soft"
                  }`}
                >
                  <Icon size={17} className="mb-3" />
                  <p className="line-clamp-1 text-xs font-semibold uppercase tracking-wider">{category.label}</p>
                  <p className="mt-2 font-mono text-[11px] opacity-75">{count ?? "--"}</p>
                </button>
              );
            })}
          </div>

          <div className="control-surface rounded-xl p-3 md:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">İnce ayar</p>
              <button
                onClick={onResetAdvancedFilters}
                className="rounded-md border border-edge/75 bg-surface-2/60 px-3 py-1.5 text-xs text-ink-muted hover:border-signal/50 hover:text-ink-soft"
              >
                Temizle
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="text-xs text-ink-muted xl:col-span-1">
                Marka
                <input
                  type="text"
                  value={selectedBrand ?? ""}
                  onChange={(event) => onBrandChange(event.target.value)}
                  placeholder="MSI"
                  className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/70 px-3 text-sm text-ink placeholder:text-ink-muted/65 focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
                />
              </label>

              <label className="text-xs text-ink-muted">
                Min Fiyat
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={selectedMinPrice ?? ""}
                  onChange={(event) => onMinPriceChange(event.target.value)}
                  placeholder="0"
                  className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/70 px-3 text-sm text-ink placeholder:text-ink-muted/65 focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
                />
              </label>

              <label className="text-xs text-ink-muted">
                Max Fiyat
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={selectedMaxPrice ?? ""}
                  onChange={(event) => onMaxPriceChange(event.target.value)}
                  placeholder="100000"
                  className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/70 px-3 text-sm text-ink placeholder:text-ink-muted/65 focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
                />
              </label>

              <label className="text-xs text-ink-muted">
                Stok
                <select
                  value={selectedStock}
                  onChange={(event) => onStockChange(event.target.value as StockFilter)}
                  className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/70 px-3 text-sm text-ink focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
                >
                  <option value="all">Tümü</option>
                  <option value="in_stock">Stokta</option>
                  <option value="out_stock">Stok Dışı</option>
                </select>
              </label>

              <label className="text-xs text-ink-muted">
                Sıralama
                <select
                  value={selectedSort ?? "updated"}
                  onChange={(event) => onSortChange(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/70 px-3 text-sm text-ink focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
                >
                  <option value="updated">Son Güncellenen</option>
                  <option value="price_asc">Düşükten Yükseğe</option>
                  <option value="price_desc">Yüksekten Düşüğe</option>
                  <option value="name">Ada Göre</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
