import type { ProductDataSource, ScrapedProductData } from "./types";
import { signPaApiRequest } from "./aws-sigv4";

/**
 * Amazon Product Advertising API 5.0 data source.
 *
 * Requires an approved Amazon Associates account with PA-API access. Sign up at
 * https://affiliate-program.amazon.in (or your region's Associates program),
 * then generate API credentials under Tools > Product Advertising API.
 *
 * Required env vars (see .env.example):
 *   AMAZON_PAAPI_ACCESS_KEY
 *   AMAZON_PAAPI_SECRET_KEY
 *   AMAZON_PAAPI_PARTNER_TAG   (your Associates tracking ID, e.g. "yoursite-21")
 *   AMAZON_PAAPI_HOST          (default: webservices.amazon.in)
 *   AMAZON_PAAPI_REGION        (default: eu-west-1, correct for the India marketplace)
 *
 * Note: PA-API is rate-limited and, for new accounts, initially capped very low
 * (often 1 request/second and a small daily quota) until you generate qualifying
 * sales — see Amazon's TPS documentation. Design any batch "refresh all prices"
 * job around that (small delay between requests, see /api/admin/refresh-prices).
 */
export class AmazonDataSource implements ProductDataSource {
  private get config() {
    const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
    const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
    const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG;
    if (!accessKey || !secretKey || !partnerTag) {
      throw new Error(
        "Amazon PA-API is not configured. Set AMAZON_PAAPI_ACCESS_KEY, AMAZON_PAAPI_SECRET_KEY, " +
          "and AMAZON_PAAPI_PARTNER_TAG in your .env file. See README.md for setup instructions."
      );
    }
    return {
      accessKey,
      secretKey,
      partnerTag,
      host: process.env.AMAZON_PAAPI_HOST || "webservices.amazon.in",
      region: process.env.AMAZON_PAAPI_REGION || "eu-west-1",
    };
  }

  /** Extracts the 10-character ASIN from a typical amazon.in/amazon.com product URL. */
  private extractAsin(url: string): string {
    const patterns = [/\/dp\/([A-Z0-9]{10})/i, /\/gp\/product\/([A-Z0-9]{10})/i, /[?&]asin=([A-Z0-9]{10})/i];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].toUpperCase();
    }
    throw new Error(`Couldn't find an ASIN in this Amazon URL: ${url}`);
  }

  private async getItems(asins: string[]) {
    const { accessKey, secretKey, partnerTag, host, region } = this.config;

    const payload = JSON.stringify({
      ItemIds: asins,
      Resources: [
        "ItemInfo.Title",
        "ItemInfo.ByLineInfo",
        "Images.Primary.Large",
        "Images.Variants.Large",
        "Offers.Listings.Price",
        "Offers.Listings.Availability.Message",
        "CustomerReviews.Count",
        "CustomerReviews.StarRating",
      ],
      PartnerTag: partnerTag,
      PartnerType: "Associates",
      Marketplace: host.includes(".in") ? "www.amazon.in" : "www.amazon.com",
    });

    const { url, headers } = signPaApiRequest({
      method: "POST",
      host,
      path: "/paapi5/getitems",
      region,
      service: "ProductAdvertisingAPI",
      target: "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
      payload,
      accessKey,
      secretKey,
    });

    const res = await fetch(url, { method: "POST", headers, body: payload });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Amazon PA-API request failed (${res.status}): ${body.slice(0, 500)}`);
    }
    return res.json();
  }

  async fetchProduct(url: string): Promise<ScrapedProductData> {
    const asin = this.extractAsin(url);
    const data = await this.getItems([asin]);
    const item = data?.ItemsResult?.Items?.[0];
    if (!item) throw new Error(`Amazon returned no data for ASIN ${asin}. It may be invalid, unavailable, or region-mismatched.`);

    const listing = item.Offers?.Listings?.[0];
    const price = listing?.Price?.Amount;
    const inStock = (listing?.Availability?.Message || "").toLowerCase().includes("in stock") || !!price;

    return {
      sourceUrl: url,
      platform: "AMAZON",
      name: item.ItemInfo?.Title?.DisplayValue || "",
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      price: typeof price === "number" ? price : 0,
      rating: item.CustomerReviews?.StarRating?.Value,
      reviewCount: item.CustomerReviews?.Count,
      inStock,
      images: [
        item.Images?.Primary?.Large?.URL,
        ...(item.Images?.Variants?.map((v: any) => v.Large?.URL) || []),
      ].filter(Boolean),
      fetchedAt: new Date(),
    };
  }

  async fetchCurrentPrice(url: string): Promise<number> {
    const asin = this.extractAsin(url);
    const data = await this.getItems([asin]);
    const price = data?.ItemsResult?.Items?.[0]?.Offers?.Listings?.[0]?.Price?.Amount;
    if (typeof price !== "number") throw new Error(`No current price returned for ASIN ${asin}.`);
    return price;
  }
}
