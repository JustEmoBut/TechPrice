import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchProduct, searchProducts, fetchCategories } from "@/lib/api";
import type { ProductFilters } from "@/types/product";

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

export function useSearchProducts(q: string) {
  return useQuery({
    queryKey: ["products", "search", q],
    queryFn: () => searchProducts(q),
    enabled: q.length >= 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
  });
}

