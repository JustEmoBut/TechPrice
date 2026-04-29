import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Clock3, GitCompareArrows, Store } from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import type { Product } from "@/types/product";

interface Props {
  product: Product;
  isCompared?: boolean;
  compareDisabled?: boolean;
  onToggleCompare?: (product: Product) => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatUpdatedDate(input: string | null) {
  if (!input) return "Bilinmiyor";
  return new Date(input).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

export function ProductCard({ product, isCompared = false, compareDisabled = false, onToggleCompare }: Props) {
  const sortedSitePrices = [...product.site_prices].sort((a, b) => a.price - b.price);
  const inStockCount = product.site_prices.filter((sitePrice) => sitePrice.in_stock).length;
  const highest = sortedSitePrices[sortedSitePrices.length - 1]?.price;
  const spread = product.min_price && highest ? highest - product.min_price : 0;

  return (
    <div className="group animate-card-reveal h-full">
      <article className="editorial-card relative flex h-full flex-col overflow-hidden rounded-xl transition-all duration-500 hover:-translate-y-1 hover:border-signal/60 hover:shadow-[0_34px_58px_-38px_rgba(245,245,245,0.34)]">
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-signal via-edge to-transparent opacity-40 transition-opacity group-hover:opacity-80" />

        <div className="relative h-48 border-b border-edge/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]">
          <div className="absolute left-3 top-3 z-10 rounded-md border border-edge/80 bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft backdrop-blur">
            {product.category}
          </div>
          {onToggleCompare ? (
            <button
              onClick={() => onToggleCompare(product)}
              disabled={!isCompared && compareDisabled}
              className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur ${
                isCompared
                  ? "border-signal/70 bg-signal text-black"
                  : "border-edge/80 bg-black/55 text-ink-soft hover:border-signal/55 disabled:opacity-45"
              }`}
              aria-label={isCompared ? `${product.name} karşılaştırmadan çıkar` : `${product.name} karşılaştırmaya ekle`}
            >
              {isCompared ? <Check size={12} /> : <GitCompareArrows size={12} />}
              {isCompared ? "Seçili" : "Kıyasla"}
            </button>
          ) : null}
          <Link href={`/products/${product.id}`} aria-label={`${product.name} detayına git`} className="block h-full">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                unoptimized
                className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.06]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-muted">Görsel yok</div>
            )}
          </Link>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {product.brand ? <p className="truncate text-xs uppercase tracking-[0.2em] text-ink-muted">{product.brand}</p> : null}
              <Link href={`/products/${product.id}`} className="mt-1 block hover:text-ink-soft">
                <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-semibold leading-tight text-ink">
                {product.name}
                </h3>
              </Link>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-ink-muted">
              <Clock3 size={12} />
              {formatUpdatedDate(product.updated_at)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-edge/65 bg-surface-2/55 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">En düşük</p>
              <p className="mt-1 font-mono text-sm font-semibold text-signal">
                {product.min_price ? formatPrice(product.min_price) : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-edge/65 bg-surface-2/55 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">Makas</p>
              <p className="mt-1 font-mono text-sm font-semibold text-ink-soft">
                {spread > 0 ? formatPrice(spread) : "-"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {sortedSitePrices.slice(0, 3).map((sitePrice, index) => (
              <div
                key={`${sitePrice.site}-${sitePrice.url}`}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs ${
                  index === 0 ? "border-signal/55 bg-signal-soft/45" : "border-edge/60 bg-surface-1/60"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2 text-ink-soft">
                  <span className={sitePrice.in_stock ? "dot-green" : "dot-red"} />
                  <span className="truncate">{sitePrice.site_display_name}</span>
                </span>
                <span className={`font-mono text-[12px] font-semibold ${sitePrice.in_stock ? "text-ink" : "text-ink-muted line-through"}`}>
                  {formatPrice(sitePrice.price)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4">
            <MiniSparkline productId={product.id} />
            <div className="mt-3 flex items-center justify-between border-t border-edge/65 pt-3">
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <Store size={13} />
                {inStockCount}/{product.site_prices.length} stokta
              </span>
              <Link
                href={`/products/${product.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-signal transition-transform duration-300 group-hover:translate-x-1"
              >
                İncele
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
