// Shared contract that any future automated data source must implement.
// Nothing in this folder is wired up or scheduled — these are placeholder
// interfaces so an automatic scraper or official API integration can be
// dropped in later without changing the rest of the app.

export interface ScrapedProductData {
  sourceUrl: string;
  platform: "AMAZON" | "FLIPKART";
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  images: string[];
  fetchedAt: Date;
}

export interface ProductDataSource {
  /** Fetches a single product's current listing data from the given URL. */
  fetchProduct(url: string): Promise<ScrapedProductData>;

  /** Fetches only the current price — used for lightweight periodic price checks. */
  fetchCurrentPrice(url: string): Promise<number>;
}
