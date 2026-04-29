"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GitCompareArrows, Store, Trash2, X } from "lucide-react";
import type { Product } from "@/types/product";

interface Props {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

function formatPrice(price: number | null) {
  if (!price) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

function getStockSummary(product: Product) {
  const inStock = product.site_prices.filter((sitePrice) => sitePrice.in_stock).length;
  return `${inStock}/${product.site_prices.length}`;
}

function getSpread(product: Product) {
  const prices = product.site_prices.map((sitePrice) => sitePrice.price).filter(Number.isFinite);
  if (prices.length < 2) return null;
  return Math.max(...prices) - Math.min(...prices);
}

function collectSpecKeys(products: Product[]) {
  const keyCounts = new Map<string, number>();

  for (const product of products) {
    for (const key of Object.keys(product.specs ?? {})) {
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(keyCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "tr"))
    .slice(0, 8)
    .map(([key]) => key);
}

export function ProductComparePanel({ products, onRemove, onClear }: Props) {
  if (products.length === 0) return null;

  const specKeys = collectSpecKeys(products);
  const canCompare = products.length >= 2;

  return (
    <section className="glass-panel animate-rise rounded-2xl p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-ink-muted">
            <GitCompareArrows size={14} />
            Karşılaştırma
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            {canCompare ? "Seçilen ürünleri yan yana oku" : "Karşılaştırmak için bir ürün daha seç"}
          </h2>
        </div>

        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-lg border border-edge/80 bg-surface-2/65 px-3 py-2 text-xs text-ink-muted hover:border-signal/55 hover:text-ink-soft"
        >
          <Trash2 size={14} />
          Temizle
        </button>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="grid min-w-[720px] gap-3"
          style={{ gridTemplateColumns: `160px repeat(${products.length}, minmax(190px, 1fr))` }}
        >
          <div className="control-surface rounded-xl p-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
            Ürün
          </div>
          {products.map((product) => (
            <article key={product.id} className="control-surface relative rounded-xl p-3">
              <button
                onClick={() => onRemove(product.id)}
                className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-md border border-edge/75 bg-black/50 text-ink-muted hover:border-signal/50 hover:text-ink"
                aria-label={`${product.name} karşılaştırmadan çıkar`}
              >
                <X size={14} />
              </button>
              <div className="relative h-24 rounded-lg border border-edge/60 bg-surface-2/55">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill unoptimized className="object-contain p-3" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink-muted">Görsel yok</div>
                )}
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-muted">{product.brand || product.category}</p>
              <Link href={`/products/${product.id}`} className="mt-1 line-clamp-2 block text-sm font-semibold text-ink hover:text-ink-soft">
                {product.name}
              </Link>
            </article>
          ))}

          <div className="rounded-lg border border-edge/70 bg-surface-2/45 p-3 text-sm text-ink-muted">En düşük fiyat</div>
          {products.map((product) => (
            <div key={`${product.id}-price`} className="rounded-lg border border-edge/70 bg-surface-1/70 p-3 font-mono text-sm font-semibold text-signal">
              {formatPrice(product.min_price)}
            </div>
          ))}

          <div className="rounded-lg border border-edge/70 bg-surface-2/45 p-3 text-sm text-ink-muted">Mağaza makası</div>
          {products.map((product) => (
            <div key={`${product.id}-spread`} className="rounded-lg border border-edge/70 bg-surface-1/70 p-3 font-mono text-sm text-ink-soft">
              {formatPrice(getSpread(product))}
            </div>
          ))}

          <div className="rounded-lg border border-edge/70 bg-surface-2/45 p-3 text-sm text-ink-muted">Stok yoğunluğu</div>
          {products.map((product) => (
            <div key={`${product.id}-stock`} className="rounded-lg border border-edge/70 bg-surface-1/70 p-3 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-2">
                <Store size={14} />
                {getStockSummary(product)} mağaza
              </span>
            </div>
          ))}

          <div className="rounded-lg border border-edge/70 bg-surface-2/45 p-3 text-sm text-ink-muted">Kategori</div>
          {products.map((product) => (
            <div key={`${product.id}-category`} className="rounded-lg border border-edge/70 bg-surface-1/70 p-3 text-sm text-ink-soft">
              {product.category}
            </div>
          ))}

          {specKeys.map((key) => (
            <Fragment key={key}>
              <div key={`${key}-label`} className="rounded-lg border border-edge/70 bg-surface-2/45 p-3 text-sm text-ink-muted">
                {key}
              </div>
              {products.map((product) => (
                <div key={`${product.id}-${key}`} className="rounded-lg border border-edge/70 bg-surface-1/70 p-3 text-sm text-ink-soft">
                  {String(product.specs?.[key] ?? "-")}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      {canCompare ? (
        <div className="mt-4 flex justify-end">
          <Link
            href={`/products/${products[0].id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-signal/55 bg-signal-soft/55 px-3 py-2 text-xs text-signal hover:bg-signal-soft"
          >
            İlk ürünü detayda aç
            <ArrowUpRight size={14} />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
