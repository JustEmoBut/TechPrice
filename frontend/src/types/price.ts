export interface PricePoint {
  id: string;
  product_id: string;
  site: string;
  site_display_name: string;
  price: number;
  in_stock: boolean;
  scraped_at: string;
  price_change: number | null;
  price_change_pct: number | null;
}

export interface PriceHistoryResponse {
  product_id: string;
  history: PricePoint[];
}
