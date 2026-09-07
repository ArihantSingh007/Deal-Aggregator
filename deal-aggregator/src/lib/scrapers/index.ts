import { AmazonDataSource } from "./amazon-scraper.interface";
import { FlipkartDataSource } from "./flipkart-scraper.interface";
import type { ProductDataSource } from "./types";

export type Platform = "AMAZON" | "FLIPKART";

/** Guesses the platform from a product URL's hostname. */
export function detectPlatform(url: string): Platform | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("amazon.")) return "AMAZON";
    if (host.includes("flipkart.")) return "FLIPKART";
    return null;
  } catch {
    return null;
  }
}

export function getDataSource(platform: Platform): ProductDataSource {
  return platform === "AMAZON" ? new AmazonDataSource() : new FlipkartDataSource();
}

export { AmazonDataSource, FlipkartDataSource };
export type { ProductDataSource, ScrapedProductData } from "./types";
