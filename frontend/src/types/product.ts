export interface SitePrice {
  site: string;
  site_display_name: string;
  url: string;
  price: number;
  currency: string;
  in_stock: boolean;
  last_updated: string | null;
}

export interface Product {
  id: string;
  name: string;
  normalized_name: string;
  brand: string;
  category: string;
  specs: Record<string, string>;
  site_prices: SitePrice[];
  min_price: number | null;
  min_price_site: string | null;
  image_url: string | null;
  last_scraped: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface ProductFilters {
  category?: string;
  site?: string;
  brand?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}
