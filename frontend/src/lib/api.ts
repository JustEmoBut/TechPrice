import axios from "axios";
import type { Product, ProductListResponse, ProductFilters } from "@/types/product";
import type { PriceHistoryResponse } from "@/types/price";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8300",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ─── Ürünler ─────────────────────────────────────────────────────────────────

export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const { data } = await api.get("/api/products", { params });
  return data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data } = await api.get(`/api/products/${id}`);
  return data;
}

export async function searchProducts(q: string): Promise<{ items: Product[]; total: number }> {
  const { data } = await api.get("/api/products/search", { params: { q } });
  return data;
}

// ─── Fiyat Geçmişi ───────────────────────────────────────────────────────────

export async function fetchPriceHistory(
  productId: string,
  site?: string,
  days = 30
): Promise<PriceHistoryResponse> {
  const params: Record<string, unknown> = { days };
  if (site) params.site = site;
  const { data } = await api.get(`/api/prices/${productId}/history`, { params });
  return data;
}

export async function fetchLowestPrice(productId: string) {
  const { data } = await api.get(`/api/prices/${productId}/lowest`);
  return data;
}

// ─── Kategoriler ─────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<{ categories: { slug: string; name: string; product_count: number }[] }> {
  const { data } = await api.get("/api/categories");
  return data;
}

// ─── Sistem ─────────────────────────────────────────────────────────────────

export async function fetchHealth() {
  const { data } = await api.get("/api/health");
  return data;
}

export default api;
