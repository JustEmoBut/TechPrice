import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";
import { MiniSparkline } from "@/components/charts/MiniSparkline";

function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const allPrices = product.site_prices;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-[#111113] border border-[#27272a] rounded-lg h-full flex flex-col cursor-pointer transition-colors duration-150 hover:bg-[#18181b] hover:border-[#3f3f46]">
        {/* Resim */}
        {product.image_url && (
          <div className="relative h-44 w-full overflow-hidden rounded-t-lg bg-[#0f0f11]">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-4"
              unoptimized
            />
          </div>
        )}

        {/* Icerik */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Kategori badge */}
          <span className="inline-block self-start px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase text-[#93c5fd] bg-[#1e3a5f] mb-2">
            {product.category}
          </span>

          {product.brand && (
            <p className="text-[11px] text-[#52525b] mb-1">{product.brand}</p>
          )}
          <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-3 text-[#e4e4e7]">
            {product.name}
          </h3>

          {/* Site fiyatlari */}
          <div className="space-y-1.5 mt-auto">
            {allPrices.map((sp) => (
              <div key={sp.site} className="flex items-center justify-between">
                <span className="text-xs text-[#71717a] flex items-center gap-1.5">
                  <span className={sp.in_stock ? "dot-green" : "dot-red"} />
                  {sp.site_display_name}
                </span>
                <span
                  className={
                    sp.in_stock
                      ? "font-mono text-sm font-semibold text-[#f4f4f5]"
                      : "font-mono text-xs text-[#52525b] line-through"
                  }
                >
                  {formatPrice(sp.price)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fiyat Trend Sparkline */}
        <div className="px-4 pb-1">
          <MiniSparkline productId={product.id} />
        </div>

        {/* En Ucuz footer */}
        {product.min_price && (
          <div className="px-4 pb-4">
            <div className="rounded-md border border-[#1d4ed8]/30 bg-[#1e3a5f]/40 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-[#60a5fa]">En dusuk</span>
              <span className="font-mono font-bold text-sm text-[#93c5fd]">
                {formatPrice(product.min_price)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
