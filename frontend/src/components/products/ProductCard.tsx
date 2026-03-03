import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import type { Product } from "@/types/product";

interface Props {
  product: Product;
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

export function ProductCard({ product }: Props) {
  const sortedSitePrices = [...product.site_prices].sort((a, b) => a.price - b.price);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group animate-card-reveal block h-full"
      aria-label={`${product.name} detayına git`}
    >
      <article className="editorial-card relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:border-signal/60 hover:shadow-[0_35px_55px_-36px_rgba(245,245,245,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_45%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative h-44 overflow-hidden border-b border-edge/70 bg-surface-2/60">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              unoptimized
              className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-muted">Görsel yok</div>
          )}
        </div>

        <div className="relative flex flex-1 flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="rounded-full border border-signal/50 bg-signal-soft/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
              {product.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
              <Clock3 size={12} />
              {formatUpdatedDate(product.updated_at)}
            </span>
          </div>

          {product.brand ? <p className="text-xs text-ink-muted">{product.brand}</p> : null}
          <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-tight text-ink">{product.name}</h3>

          <div className="mt-4 space-y-2">
            {sortedSitePrices.slice(0, 3).map((sitePrice, index) => {
              const inStockClass = sitePrice.in_stock ? "text-ink" : "text-ink-muted line-through";
              const indicatorClass = sitePrice.in_stock ? "dot-green" : "dot-red";

              return (
                <div
                  key={`${sitePrice.site}-${sitePrice.url}`}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs ${
                    index === 0 ? "border-signal/50 bg-signal-soft/40" : "border-edge/60 bg-surface-1/55"
                  }`}
                >
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className={indicatorClass} />
                    {sitePrice.site_display_name}
                  </span>
                  <span className={`font-mono text-[13px] font-semibold ${inStockClass}`}>
                    {formatPrice(sitePrice.price)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-edge/65 pt-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">En Düşük</p>
              <p className="font-mono text-sm font-semibold text-signal">
                {product.min_price ? formatPrice(product.min_price) : "-"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-signal transition-transform duration-300 group-hover:translate-x-1">
              Detay
              <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        <div className="px-4 pb-3">
          <MiniSparkline productId={product.id} />
        </div>
      </article>
    </Link>
  );
}
