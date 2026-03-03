"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldCheck, Store } from "lucide-react";
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
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-shimmer h-[360px] rounded-2xl" />
          <div className="space-y-3">
            <div className="animate-shimmer h-8 rounded-lg" />
            <div className="animate-shimmer h-28 rounded-xl" />
            <div className="animate-shimmer h-28 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <section className="rounded-2xl border border-danger/45 bg-danger/10 p-10 text-center">
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

      <section className="glass-panel animate-rise rounded-3xl p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-edge/70 bg-surface-1/60">
            {product.image_url ? (
              <div className="relative h-[340px] md:h-[420px]">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  unoptimized
                  className="object-contain p-8"
                />
              </div>
            ) : (
              <div className="flex h-[340px] items-center justify-center text-sm text-ink-muted md:h-[420px]">
                Görsel bulunamadı
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <span className="rounded-full border border-signal/50 bg-signal-soft/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-signal">
                {product.category}
              </span>
              {product.brand ? <p className="mt-3 text-sm text-ink-muted">{product.brand}</p> : null}
              <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink md:text-3xl">
                {product.name}
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-edge/70 bg-surface-2/65 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">En Düşük Fiyat</p>
                <p className="mt-2 font-mono text-xl font-semibold text-signal">
                  {product.min_price ? formatPrice(product.min_price) : "-"}
                </p>
                <p className="mt-1 text-xs text-ink-muted">{product.min_price_site ?? "Kaynak bekleniyor"}</p>
              </article>
              <article className="rounded-xl border border-edge/70 bg-surface-2/65 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">Toplam Mağaza</p>
                <p className="mt-2 font-mono text-xl font-semibold text-ink">{sortedPrices.length}</p>
                <p className="mt-1 text-xs text-ink-muted">Canlı karşılaştırma aktif</p>
              </article>
            </div>

            <p className="inline-flex items-center gap-2 text-xs text-success">
              <ShieldCheck size={14} />
              Stok ve fiyat verisi son tarama verisine dayanır.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-edge/70 bg-surface-1/65 p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">Mağaza Karşılaştırması</h2>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
            <Store size={13} />
            Canlı fiyat tablosu
          </p>
        </div>

        <div className="space-y-2">
          {sortedPrices.map((sitePrice) => {
            const isBest = bestInStock?.site === sitePrice.site;
            return (
              <article
                key={`${sitePrice.site}-${sitePrice.url}`}
                className={`flex flex-col gap-3 rounded-xl border px-4 py-3 md:flex-row md:items-center md:justify-between ${
                  isBest
                    ? "border-signal/55 bg-signal-soft/45"
                    : "border-edge/70 bg-surface-2/60"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{sitePrice.site_display_name}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {sitePrice.in_stock ? "Stokta" : "Stok dışı"}
                    {isBest ? " - en iyi aktif fiyat" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                  <p
                    className={`font-mono text-sm font-semibold ${
                      sitePrice.in_stock ? "text-ink" : "text-ink-muted line-through"
                    }`}
                  >
                    {formatPrice(sitePrice.price)}
                  </p>
                  <a
                    href={sitePrice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
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

      <section className="rounded-2xl border border-edge/70 bg-surface-1/65 p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">30 Günlük Fiyat Eğrisi</h2>
        <p className="mt-1 text-sm text-ink-muted">Her mağazanın gün bazlı fiyat değişimleri.</p>
        <div className="mt-5">
          <PriceHistoryChart productId={product.id} days={30} />
        </div>
      </section>

      {product.specs && Object.keys(product.specs).length > 0 ? (
        <section className="rounded-2xl border border-edge/70 bg-surface-1/65 p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Teknik Özellikler</h2>
          <div className="mt-4 divide-y divide-edge/60 rounded-xl border border-edge/65 bg-surface-2/55">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="grid gap-1 px-4 py-3 md:grid-cols-[200px_1fr] md:gap-4">
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
