"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useProduct } from "@/hooks/useProducts";
import { PriceHistoryChart } from "@/components/charts/PriceHistoryChart";

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
      <div className="space-y-6">
        <div className="animate-shimmer h-6 w-48 rounded-md" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="animate-shimmer h-80 rounded-lg" />
          <div className="space-y-3">
            <div className="animate-shimmer h-5 w-full rounded-md" />
            <div className="animate-shimmer h-5 w-3/4 rounded-md" />
            <div className="animate-shimmer h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-20 text-center">
        <p className="text-[#ef4444] font-medium">Urun bulunamadi.</p>
        <Link
          href="/"
          className="inline-block mt-4 px-5 py-2 rounded-md text-sm border border-[#27272a] bg-[#111113] text-[#f4f4f5] hover:bg-[#18181b] transition-colors"
        >
          Ana Sayfaya Don
        </Link>
      </div>
    );
  }

  const sortedPrices = [...product.site_prices].sort((a, b) => a.price - b.price);
  const cheapestInStock = sortedPrices.find((sp) => sp.in_stock);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5 text-[#52525b]">
        <Link href="/" className="hover:text-[#a1a1aa] transition-colors">Ana Sayfa</Link>
        <span>/</span>
        <Link href={`/?category=${product.category}`} className="hover:text-[#a1a1aa] transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-[#a1a1aa] truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Ust Bolum */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Resim */}
        {product.image_url ? (
          <div className="relative h-80 rounded-lg bg-[#111113] border border-[#27272a] overflow-hidden">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-8"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-80 rounded-lg bg-[#111113] border border-[#27272a] flex items-center justify-center text-[#52525b] text-sm">
            Gorsel yok
          </div>
        )}

        {/* Fiyat ve Bilgiler */}
        <div className="space-y-5">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase text-[#93c5fd] bg-[#1e3a5f] mb-2">
              {product.category}
            </span>
            {product.brand && (
              <p className="text-sm text-[#71717a]">{product.brand}</p>
            )}
            <h1 className="text-xl font-bold leading-tight text-[#f4f4f5] mt-1">{product.name}</h1>
          </div>

          {/* Fiyat tablosu */}
          <div className="bg-[#111113] border border-[#27272a] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a]">
              <h2 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                Site Fiyat Karsilastirmasi
              </h2>
            </div>
            <div className="divide-y divide-[#27272a]">
              {sortedPrices.map((sp) => {
                const isCheapest = cheapestInStock?.site === sp.site;
                return (
                  <div
                    key={sp.url}
                    className={`flex items-center px-4 py-3 gap-3 ${
                      isCheapest ? "border-l-2 border-l-[#3b82f6] bg-[#1e3a5f]/20" : ""
                    }`}
                  >
                    {/* Site adi */}
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-medium text-sm text-[#f4f4f5]">
                        {sp.site_display_name}
                      </span>
                      {isCheapest && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#1e3a5f] text-[#93c5fd] border border-[#1d4ed8]/30">
                          En ucuz
                        </span>
                      )}
                    </div>

                    {/* Fiyat */}
                    <span className="font-mono font-bold text-sm text-[#f4f4f5]">
                      {formatPrice(sp.price)}
                    </span>

                    {/* Stok */}
                    {sp.in_stock ? (
                      <span className="flex items-center gap-1 text-xs text-[#22c55e]">
                        <span className="dot-green" />
                        Stokta
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[#52525b]">
                        <span className="dot-red" />
                        Tukendi
                      </span>
                    )}

                    {/* Siteye Git */}
                    <a
                      href={sp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                        sp.in_stock
                          ? "text-[#93c5fd] border-[#1d4ed8]/40 hover:bg-[#1e3a5f]/40"
                          : "text-[#3f3f46] border-[#27272a] pointer-events-none"
                      }`}
                    >
                      Siteye Git &rarr;
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fiyat Gecmisi Grafigi */}
      <div className="bg-[#111113] border border-[#27272a] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#27272a]">
          <h2 className="text-sm font-semibold text-[#f4f4f5]">Fiyat Gecmisi (Son 30 Gun)</h2>
        </div>
        <div className="p-5">
          <PriceHistoryChart productId={product.id} days={30} />
        </div>
      </div>

      {/* Teknik Ozellikler */}
      {product.specs && Object.keys(product.specs).length > 0 && (
        <div className="bg-[#111113] border border-[#27272a] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#27272a]">
            <h2 className="text-sm font-semibold text-[#f4f4f5]">Teknik Ozellikler</h2>
          </div>
          <div className="divide-y divide-[#27272a]">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="flex px-5 py-3">
                <span className="w-1/3 text-sm text-[#71717a]">{key}</span>
                <span className="flex-1 text-sm text-[#f4f4f5]">{value as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
