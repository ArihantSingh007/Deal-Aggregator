import { z } from "zod";

// Shared building blocks
const positiveNumber = z.coerce.number().positive();

// Admin form fields for optional URLs always submit as "" rather than omitting
// the key, so this preprocesses blank strings to undefined before validating
// the rest as a real URL — avoids ever rejecting a legitimately empty field.
const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().url().optional()
);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(50).optional(),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  brand: z.string().trim().min(1, "Brand is required").max(100),
  categoryId: z.string().trim().min(1, "Category is required"),
  description: z.string().max(5000).optional().default(""),
  images: z.array(z.string().url()).default([]),
  amazonUrl: optionalUrl,
  flipkartUrl: optionalUrl,
  amazonAffiliateLink: optionalUrl,
  flipkartAffiliateLink: optionalUrl,
  currentPrice: positiveNumber,
  originalPrice: positiveNumber,
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).default(0),
  availability: z.enum(["IN_STOCK", "OUT_OF_STOCK", "LIMITED_STOCK"]).default("IN_STOCK"),
  isFeatured: z.coerce.boolean().default(false),
});

// Same as create, but every field is optional since PATCH only sends what changed.
export const productUpdateSchema = productCreateSchema.partial();

export const priceHistoryCreateSchema = z.object({
  productId: z.string().trim().min(1),
  price: positiveNumber,
  platform: z.enum(["AMAZON", "FLIPKART"]),
  timestamp: z.coerce.date().optional(),
});

export const priceHistoryUpdateSchema = z.object({
  price: positiveNumber.optional(),
  platform: z.enum(["AMAZON", "FLIPKART"]).optional(),
  timestamp: z.coerce.date().optional(),
});

export const wishlistCreateSchema = z.object({
  productId: z.string().trim().min(1),
});

export const priceAlertCreateSchema = z.object({
  productId: z.string().trim().min(1),
  targetPrice: positiveNumber,
});

export const dealSuggestionReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const importProductSchema = z.object({
  url: z.string().trim().url("Enter a valid product URL"),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
