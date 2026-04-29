import Link from "next/link";
import { ArrowRight, TrendingDown } from "lucide-react";
import type { Product } from "@/types/product";

interface Props {
  products: Product[];
}

interface Opportunity {
  product: Product;
  lowPrice: number;
  highPrice: number;
  lowSite: string;
  savings: number;
  savingsPct: number;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

function buildOpportunities(products: Product[]): Opportunity[] {
  return products
    .map((product) => {
      const inStockPrices = product.site_prices.filter((sitePrice) => sitePrice.in_stock);
      if (inStockPrices.length < 2) return null;

      const sorted = [...inStockPrices].sort((a, b) => a.price - b.price);
      const low = sorted[0];
      const high = sorted[sorted.length - 1];
      const savings = high.price - low.price;
      if (savings <= 0) return null;

      return {
        product,
        lowPrice: low.price,
        highPrice: high.price,
        lowSite: low.site_display_name,
        savings,
        savingsPct: (savings / high.price) * 100,
      };
    })
    .filter((value): value is Opportunity => value !== null)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3);
}

export function PriceDropHighlights({ products }: Props) {
  const opportunities = buildOpportunities(products);

  if (opportunities.length === 0) return null;

  return (
    <section className="animate-rise rounded-2xl border border-edge/70 bg-surface-1/66 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-ink-muted">Makas İzleme</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Aynı ürün, farklı mağaza, net fark</h2>
        </div>
        <p className="inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/10 px-3 py-1 text-xs text-success">
          <TrendingDown size={14} />
          En yüksek tasarruf
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {opportunities.map((item, index) => (
          <Link
            key={item.product.id}
            href={`/products/${item.product.id}`}
            className="group control-surface rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-signal/55"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-sm font-semibold text-ink">{item.product.name}</p>
              <span className="rounded-md border border-edge/75 bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink-soft">
                %{item.savingsPct.toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-muted">En iyi aktif fiyat: {item.lowSite}</p>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink-muted">Tasarruf</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-signal-warm">{formatPrice(item.savings)}</p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-edge/70 pt-3 text-xs text-ink-soft">
              <span>{formatPrice(item.lowPrice)}</span>
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              <span>{formatPrice(item.highPrice)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
