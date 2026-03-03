"use client";

import { Cpu, Database, HardDrive, Layers, LayoutGrid, Monitor, Shield, Zap } from "lucide-react";
import { useCategories } from "@/hooks/useProducts";

const KNOWN_CATEGORIES = [
  { name: "GPU", label: "Ekran Kartı", icon: Monitor },
  { name: "CPU", label: "İşlemci", icon: Cpu },
  { name: "RAM", label: "RAM", icon: Database },
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.26em] text-ink-muted">Kategori Radarı</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Donanım Segmentleri</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-edge/80 bg-surface-1/70 px-3 py-1 text-xs text-ink-muted">
            Toplam <span className="font-mono text-ink-soft">{totalCount ?? "--"}</span>
          </div>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Sırala
            <select
              value={selectedSort ?? "updated"}
              onChange={(event) => onSortChange(event.target.value)}
              className="ml-2 h-9 rounded-lg border border-edge/80 bg-surface-1 px-3 text-xs text-ink focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
            >
              <option value="updated">Son Güncellenen</option>
              <option value="price_asc">Düşükten Yükseğe</option>
              <option value="price_desc">Yüksekten Düşüğe</option>
              <option value="name">Ada Göre</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <button
          onClick={() => onCategoryChange("")}
          className={`group rounded-xl border px-3 py-3 text-left transition-all duration-300 ${
            !selectedCategory
              ? "border-signal/70 bg-signal-soft/80 text-signal"
              : "border-edge/70 bg-surface-1/70 text-ink-muted hover:border-signal/40 hover:text-ink-soft"
          }`}
        >
          <LayoutGrid size={16} className="mb-2" />
          <p className="text-xs font-medium uppercase tracking-wider">Hepsi</p>
          <p className="mt-1 font-mono text-[11px] opacity-75">{totalCount ?? "--"}</p>
        </button>

        {KNOWN_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const active = categoryIsActive(selectedCategory, category.name);
          const count = countMap[category.name.toUpperCase()];

          return (
            <button
              key={category.name}
              onClick={() => onCategoryChange(category.name)}
              className={`group rounded-xl border px-3 py-3 text-left transition-all duration-300 ${
                active
                  ? "border-signal/70 bg-signal-soft/80 text-signal"
                  : "border-edge/70 bg-surface-1/70 text-ink-muted hover:border-signal/40 hover:text-ink-soft"
              }`}
            >
              <Icon size={16} className="mb-2" />
              <p className="line-clamp-1 text-xs font-medium uppercase tracking-wider">{category.label}</p>
              <p className="mt-1 font-mono text-[11px] opacity-75">{count ?? "--"}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-edge/70 bg-surface-1/65 p-3 md:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Gelişmiş Filtreler</p>
          <button
            onClick={onResetAdvancedFilters}
            className="rounded-md border border-edge/75 bg-surface-2/55 px-3 py-1 text-xs text-ink-muted transition-colors hover:border-signal/45 hover:text-ink-soft"
          >
            Filtreleri Temizle
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs text-ink-muted">
            Marka
            <input
              type="text"
              value={selectedBrand ?? ""}
              onChange={(event) => onBrandChange(event.target.value)}
              placeholder="Örn: MSI"
              className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/65 px-3 text-sm text-ink placeholder:text-ink-muted/65 focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
            />
          </label>

          <label className="text-xs text-ink-muted">
            Min Fiyat (₺)
            <input
              type="number"
              min={0}
              step={100}
              value={selectedMinPrice ?? ""}
              onChange={(event) => onMinPriceChange(event.target.value)}
              placeholder="0"
              className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/65 px-3 text-sm text-ink placeholder:text-ink-muted/65 focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
            />
          </label>

          <label className="text-xs text-ink-muted">
            Max Fiyat (₺)
            <input
              type="number"
              min={0}
              step={100}
              value={selectedMaxPrice ?? ""}
              onChange={(event) => onMaxPriceChange(event.target.value)}
              placeholder="100000"
              className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/65 px-3 text-sm text-ink placeholder:text-ink-muted/65 focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
            />
          </label>

          <label className="text-xs text-ink-muted">
            Stok Durumu
            <select
              value={selectedStock}
              onChange={(event) => onStockChange(event.target.value as StockFilter)}
              className="mt-1 h-10 w-full rounded-lg border border-edge/80 bg-surface-2/65 px-3 text-sm text-ink focus:border-signal/70 focus:outline-none focus:ring-2 focus:ring-signal/25"
            >
              <option value="all">Tümü</option>
              <option value="in_stock">Sadece Stokta</option>
              <option value="out_stock">Sadece Stok Dışı</option>
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
