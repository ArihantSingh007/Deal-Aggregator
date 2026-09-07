import type { ProductDataSource, ScrapedProductData } from "./types";

/**
 * Flipkart Affiliate API data source.
 *
 * Requires an approved Flipkart Affiliate account. Apply at
 * https://affiliate.flipkart.com — once approved, find your Affiliate ID and
 * Affiliate Token under Account > API Access.
 *
 * Required env vars (see .env.example):
 *   FLIPKART_AFFILIATE_ID
 *   FLIPKART_AFFILIATE_TOKEN
 *
 * Note: the exact response shape below follows Flipkart's published Affiliate
 * API docs as of this writing. Flipkart has changed field names between API
 * versions before — if a field comes back undefined, log the raw response
 * once and adjust the mapping in `mapResponseToProduct` below.
 */
export class FlipkartDataSource implements ProductDataSource {
  private get config() {
    const affiliateId = process.env.FLIPKART_AFFILIATE_ID;
    const token = process.env.FLIPKART_AFFILIATE_TOKEN;
    if (!affiliateId || !token) {
      throw new Error(
        "Flipkart Affiliate API is not configured. Set FLIPKART_AFFILIATE_ID and " +
          "FLIPKART_AFFILIATE_TOKEN in your .env file. See README.md for setup instructions."
      );
    }
    return { affiliateId, token };
  }

  /** Extracts the Flipkart product ID from the `pid=` query parameter on a product URL. */
  private extractProductId(url: string): string {
    const match = url.match(/[?&]pid=([A-Z0-9]+)/i);
    if (!match) {
      throw new Error(
        `Couldn't find a "pid=" parameter in this Flipkart URL: ${url}. Open the product page on ` +
          `flipkart.com directly (not a shortened share link) and copy the full URL — it should contain "&pid=".`
      );
    }
    return match[1];
  }

  private async getProduct(productId: string) {
    const { affiliateId, token } = this.config;
    const res = await fetch(`https://affiliate-api.flipkart.net/affiliate/1.0/product.json?id=${productId}`, {
      headers: { "Fk-Affiliate-Id": affiliateId, "Fk-Affiliate-Token": token },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Flipkart Affiliate API request failed (${res.status}): ${body.slice(0, 500)}`);
    }
    return res.json();
  }

  private mapResponseToProduct(data: any, url: string): ScrapedProductData {
    const details = data?.productBaseInfoV1;
    if (!details) throw new Error("Flipkart response didn't contain productBaseInfoV1 — the API shape may have changed.");

    const price = details.flipkartSpecialPrice?.amount ?? details.flipkartSellingPrice?.amount;

    return {
      sourceUrl: url,
      platform: "FLIPKART",
      name: details.title || "",
      brand: details.attributes?.brand,
      price: typeof price === "number" ? price : 0,
      originalPrice: details.maximumRetailPrice?.amount,
      rating: details.productRating?.value ? Number(details.productRating.value) : undefined,
      reviewCount: details.productRating?.count,
      inStock: details.inStock !== false,
      images: (details.imageUrls && Object.values(details.imageUrls)) || [],
      fetchedAt: new Date(),
    };
  }

  async fetchProduct(url: string): Promise<ScrapedProductData> {
    const productId = this.extractProductId(url);
    const data = await this.getProduct(productId);
    return this.mapResponseToProduct(data, url);
  }

  async fetchCurrentPrice(url: string): Promise<number> {
    const productId = this.extractProductId(url);
    const data = await this.getProduct(productId);
    const price = data?.productBaseInfoV1?.flipkartSpecialPrice?.amount ?? data?.productBaseInfoV1?.flipkartSellingPrice?.amount;
    if (typeof price !== "number") throw new Error(`No current price returned for Flipkart product ${productId}.`);
    return price;
  }
}
