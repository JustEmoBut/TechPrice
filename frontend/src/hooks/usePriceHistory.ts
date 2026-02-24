import { useQuery } from "@tanstack/react-query";
import { fetchPriceHistory, fetchLowestPrice } from "@/lib/api";

export function usePriceHistory(productId: string, site?: string, days = 30) {
  return useQuery({
    queryKey: ["price-history", productId, site, days],
    queryFn: () => fetchPriceHistory(productId, site, days),
    enabled: !!productId,
  });
}

export function useLowestPrice(productId: string) {
  return useQuery({
    queryKey: ["lowest-price", productId],
    queryFn: () => fetchLowestPrice(productId),
    enabled: !!productId,
  });
}
