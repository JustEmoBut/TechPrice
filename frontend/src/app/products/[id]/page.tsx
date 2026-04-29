"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, LineChart, ShieldCheck, Store } from "lucide-react";
import { PriceHistoryChart } from "@/components/charts/PriceHistoryChart";
import { useProduct } from "@/hooks/useProducts";

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="animate-shimmer h-8 w-60 rounded-lg" />
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-shimmer h-[420px] rounded-xl" />
          <div className="space-y-3">
            <div className="animate-shimmer h-10 rounded-lg" />
            <div className="animate-shimmer h-32 rounded-xl" />
            <div className="animate-shimmer h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <section className="rounded-xl border border-danger/45 bg-danger/10 p-10 text-center">
        <p className="font-display text-2xl text-danger">Ürün bulunamadı</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-edge/75 bg-surface-1 px-4 py-2 text-sm text-ink-soft hover:border-signal/55"
        >
          <ArrowLeft size={15} />
          Ana sayfaya dön
        </Link>
      </section>
    );
  }

  const sortedPrices = [...product.site_prices].sort((a, b) => a.price - b.price);
  const bestInStock = sortedPrices.find((sitePrice) => sitePrice.in_stock);
  const highestPrice = sortedPrices[sortedPrices.length - 1]?.price;
  const spread = product.min_price && highestPrice ? highestPrice - product.min_price : 0;

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <Link href="/" className="hover:text-ink-soft">Ana Sayfa</Link>
        <span>/</span>
        <Link href={`/?category=${product.category}`} className="hover:text-ink-soft">
          {product.category}
        </Link>
        <span>/</span>
        <span className="line-clamp-1 max-w-lg text-ink-soft">{product.name}</span>
      </nav>

      <section className="glass-panel scanline animate-rise overflow-hidden rounded-2xl p-5 md:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-xl border border-edge/70 bg-surface-1/68">
            <div className="absolute left-4 top-4 z-10 rounded-md border border-edge/80 bg-black/55 px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink-soft backdrop-blur">
              {product.category}
            </div>
            {product.image_url ? (
              <div className="relative h-[360px] md:h-[480px]">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  unoptimized
                  className="object-contain p-8"
                />
              </div>
            ) : (
              <div className="flex h-[360px] items-center justify-center text-sm text-ink-muted md:h-[480px]">
                Görsel bulunamadı
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div>
              {product.brand ? <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">{product.brand}</p> : null}
              <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink md:text-5xl">
                {product.name}
              </h1>
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-success">
                <ShieldCheck size={14} />
                Stok ve fiyat verisi son tarama verisine dayanır.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="control-surface rounded-xl p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">En düşük fiyat</p>
                <p className="mt-2 font-mono text-3xl font-semibold text-signal">
                  {product.min_price ? formatPrice(product.min_price) : "-"}
                </p>
                <p className="mt-1 text-xs text-ink-muted">{product.min_price_site ?? "Kaynak bekleniyor"}</p>
              </article>
              <article className="control-surface rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Makas</p>
                <p className="mt-2 font-mono text-xl font-semibold text-ink">{spread > 0 ? formatPrice(spread) : "-"}</p>
                <p className="mt-1 text-xs text-ink-muted">{sortedPrices.length} mağaza</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-edge/70 bg-surface-1/66 p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">Mağaza Karşılaştırması</h2>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
            <Store size={13} />
            Canlı tablo
          </p>
        </div>

        <div className="grid gap-3">
          {sortedPrices.map((sitePrice) => {
            const isBest = bestInStock?.site === sitePrice.site;
            return (
              <article
                key={`${sitePrice.site}-${sitePrice.url}`}
                className={`grid gap-3 rounded-xl border px-4 py-3 md:grid-cols-[1fr_auto] md:items-center ${
                  isBest ? "border-signal/60 bg-signal-soft/50" : "border-edge/70 bg-surface-2/60"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{sitePrice.site_display_name}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {sitePrice.in_stock ? "Stokta" : "Stok dışı"}
                    {isBest ? " - en iyi aktif fiyat" : ""}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 md:justify-end md:gap-6">
                  <p className={`font-mono text-sm font-semibold ${sitePrice.in_stock ? "text-ink" : "text-ink-muted line-through"}`}>
                    {formatPrice(sitePrice.price)}
                  </p>
                  <a
                    href={sitePrice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                      sitePrice.in_stock
                        ? "border-signal/55 text-signal hover:bg-signal-soft/45"
                        : "pointer-events-none border-edge/70 text-ink-muted"
                    }`}
                  >
                    Siteye git
                    <ExternalLink size={13} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-edge/70 bg-surface-1/66 p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">Fiyat geçmişi</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">30 Günlük Eğri</h2>
          </div>
          <LineChart size={18} className="text-ink-muted" />
        </div>
        <PriceHistoryChart productId={product.id} days={30} />
      </section>

      {product.specs && Object.keys(product.specs).length > 0 ? (
        <section className="rounded-2xl border border-edge/70 bg-surface-1/66 p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Teknik Özellikler</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-edge/65 bg-surface-2/55">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="grid gap-1 border-b border-edge/55 px-4 py-3 last:border-b-0 md:grid-cols-[220px_1fr] md:gap-4">
                <p className="text-sm text-ink-muted">{key}</p>
                <p className="text-sm text-ink">{String(value)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
