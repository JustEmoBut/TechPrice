"use client";

import { useCategories } from "@/hooks/useProducts";
import {
  LayoutGrid,
  Monitor,
  Cpu,
  Database,
  HardDrive,
  Layers,
  Zap,
  Box,
} from "lucide-react";

const KNOWN_CATEGORIES = [
  { name: "GPU",  label: "Ekran Karti",  sublabel: "GPU",  icon: Monitor   },
  { name: "CPU",  label: "Islemci",      sublabel: "CPU",  icon: Cpu       },
  { name: "RAM",  label: "RAM",          sublabel: "Bellek", icon: Database },
  { name: "SSD",  label: "SSD",          sublabel: "Depolama", icon: HardDrive },
  { name: "MOBO", label: "Anakart",      sublabel: "MB",   icon: Layers    },
  { name: "PSU",  label: "Guc Kaynagi", sublabel: "PSU",  icon: Zap       },
  { name: "CASE", label: "Kasa",         sublabel: "Case", icon: Box       },
];

interface Props {
  selectedCategory?: string;
  selectedSort?: string;
  onCategoryChange: (cat: string) => void;
  onSortChange: (sort: string) => void;
  totalCount?: number;
}

export function ProductFilter({
  selectedCategory,
  selectedSort,
  onCategoryChange,
  onSortChange,
  totalCount,
}: Props) {
  const { data: categoryData } = useCategories();

  const countMap = Object.fromEntries(
    (categoryData?.categories ?? []).map((c) => [c.name, c.product_count])
  );

  const isActive = (catName?: string) => {
    if (!catName) return !selectedCategory;
    return (selectedCategory ?? "").toUpperCase() === catName.toUpperCase();
  };

  return (
    <div className="space-y-3">
      {/* Kategori grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {/* Tumu */}
        <button
          onClick={() => onCategoryChange("")}
          className={`group flex flex-col items-center gap-2 py-3 px-2 rounded-lg border text-center transition-colors ${
            isActive()
              ? "bg-[#1e3a5f] border-[#3b82f6]/50 text-[#93c5fd]"
              : "bg-[#111113] border-[#27272a] text-[#71717a] hover:bg-[#18181b] hover:border-[#3f3f46] hover:text-[#d4d4d8]"
          }`}
        >
          <LayoutGrid size={18} strokeWidth={1.75} />
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium leading-none">Tumu</p>
            {totalCount !== undefined && (
              <p className="text-[10px] font-mono opacity-50">{totalCount}</p>
            )}
          </div>
        </button>

        {/* Kategoriler */}
        {KNOWN_CATEGORIES.map((cat) => {
          const count = countMap[cat.name];
          const Icon = cat.icon;
          const active = isActive(cat.name);
          return (
            <button
              key={cat.name}
              onClick={() => onCategoryChange(cat.name)}
              className={`group flex flex-col items-center gap-2 py-3 px-2 rounded-lg border text-center transition-colors ${
                active
                  ? "bg-[#1e3a5f] border-[#3b82f6]/50 text-[#93c5fd]"
                  : "bg-[#111113] border-[#27272a] text-[#71717a] hover:bg-[#18181b] hover:border-[#3f3f46] hover:text-[#d4d4d8]"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium leading-none">{cat.label}</p>
                {count !== undefined && (
                  <p className="text-[10px] font-mono opacity-50">{count}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sort — sag tarafta */}
      <div className="flex justify-end">
        <select
          value={selectedSort ?? "updated"}
          onChange={(e) => onSortChange(e.target.value)}
          className="h-8 px-3 rounded-md text-xs bg-[#18181b] border border-[#27272a] text-[#f4f4f5] focus:outline-none focus:border-[#3b82f6]/60 focus:ring-1 focus:ring-[#3b82f6]/30 transition-colors cursor-pointer"
        >
          <option value="updated">Son Guncellenen</option>
          <option value="price_asc">En Dusuk Fiyat</option>
          <option value="price_desc">En Yuksek Fiyat</option>
          <option value="name">Ada Gore</option>
        </select>
      </div>
    </div>
  );
}
