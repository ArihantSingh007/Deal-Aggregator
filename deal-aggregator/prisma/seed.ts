import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { calculateDealScore, calculateSixMonthAverage } from "../src/lib/deal-score";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Generates a plausible last-6-months price walk ending at `currentPrice`. */
function generateHistory(originalPrice: number, currentPrice: number, months = 6) {
  const points: { price: number; daysAgo: number }[] = [];
  const steps = months * 2; // roughly bi-weekly price points
  for (let i = steps; i >= 0; i--) {
    const progress = 1 - i / steps;
    // Prices drift from ~originalPrice toward currentPrice with a little noise,
    // occasionally spiking back up to simulate real "fake discount" resets.
    const base = originalPrice + (currentPrice - originalPrice) * progress;
    const noise = (Math.sin(i * 1.7) * 0.02 + (Math.random() - 0.5) * 0.015) * base;
    points.push({ price: Math.max(currentPrice * 0.9, Math.round(base + noise)), daysAgo: i * 15 });
  }
  points[points.length - 1].price = currentPrice; // ensure it lands exactly on current price
  return points;
}

async function main() {
  console.log("Seeding database…");

  // --- Categories -----------------------------------------------------
  const categoryDefs = [
    { name: "Smartphones", icon: "smartphone" },
    { name: "Laptops", icon: "laptop" },
    { name: "Gaming", icon: "gamepad-2" },
    { name: "Electronics", icon: "cpu" },
    { name: "Accessories", icon: "headphones" },
    { name: "Home Appliances", icon: "wind" },
  ];

  const categories = await Promise.all(
    categoryDefs.map((c) =>
      prisma.category.upsert({
        where: { name: c.name },
        update: {},
        create: { name: c.name, slug: slugify(c.name), icon: c.icon },
      })
    )
  );
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c]));

  // --- Users ------------------------------------------------------------
  // Passwords are randomly generated and printed once — never hardcoded — so
  // that seeding a production database never leaves a publicly-known password
  // (the old hardcoded "Admin1234!" would have been sitting in this repo's
  // README/git history forever, which is a real, common way demo accounts get
  // used to break into deployed apps).
  //
  // Checked for existence explicitly (rather than blindly upserting) because
  // upsert's `update: {}` never touches an existing password hash — printing
  // a freshly generated password on a second run would be actively wrong,
  // since it wouldn't match what's actually stored from the first run.
  async function ensureSeedUser(email: string, name: string, role: "ADMIN" | "USER") {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`${name} account already exists (${email}) — password unchanged, not reprinted.`);
      return;
    }
    const plainPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    await prisma.user.create({ data: { email, name, passwordHash, role } });
    console.log(`${name} login: ${email} / ${plainPassword}`);
  }

  console.log("\n=== Seeded accounts (any password shown below appears once — save it now) ===");
  await ensureSeedUser("admin@dealledger.dev", "Admin", "ADMIN");
  await ensureSeedUser("demo@dealledger.dev", "Demo User", "USER");
  console.log("=============================================================\n");

  // --- Products -----------------------------------------------------
  const productDefs = [
    {
      name: "Samsung Galaxy S24 Ultra (256GB)",
      brand: "Samsung",
      category: "Smartphones",
      description: "Flagship Android phone with a 200MP camera, S Pen support, and a titanium frame.",
      images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800"],
      originalPrice: 129999,
      currentPrice: 104999,
      rating: 4.6,
      reviewCount: 8420,
      isFeatured: true,
    },
    {
      name: "Apple iPhone 15 (128GB)",
      brand: "Apple",
      category: "Smartphones",
      description: "iPhone 15 with the A16 Bionic chip, Dynamic Island, and a 48MP main camera.",
      images: ["https://images.unsplash.com/photo-1592286927505-1def25115481?w=800"],
      originalPrice: 79900,
      currentPrice: 68999,
      rating: 4.7,
      reviewCount: 15230,
      isFeatured: true,
    },
    {
      name: "Dell XPS 13 Plus (i7, 16GB)",
      brand: "Dell",
      category: "Laptops",
      description: "Ultra-portable laptop with a 13.4-inch OLED display and a 12th Gen Intel Core i7.",
      images: ["https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800"],
      originalPrice: 154990,
      currentPrice: 119990,
      rating: 4.4,
      reviewCount: 2310,
      isFeatured: true,
    },
    {
      name: "ASUS ROG Zephyrus G14",
      brand: "ASUS",
      category: "Gaming",
      description: "Compact gaming laptop with an RTX 4060, Ryzen 9, and a 165Hz QHD display.",
      images: ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800"],
      originalPrice: 189990,
      currentPrice: 149990,
      rating: 4.5,
      reviewCount: 1180,
      isFeatured: false,
    },
    {
      name: "Sony WH-1000XM5 Headphones",
      brand: "Sony",
      category: "Accessories",
      description: "Industry-leading noise cancelling over-ear headphones with 30-hour battery life.",
      images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800"],
      originalPrice: 34990,
      currentPrice: 22990,
      rating: 4.6,
      reviewCount: 9840,
      isFeatured: true,
    },
    {
      name: "Sony PlayStation 5 Slim",
      brand: "Sony",
      category: "Gaming",
      description: "Next-gen gaming console with ultra-high-speed SSD and ray tracing support.",
      images: ["https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800"],
      originalPrice: 54990,
      currentPrice: 49990,
      rating: 4.8,
      reviewCount: 5320,
      isFeatured: false,
    },
    {
      name: "LG 55-inch 4K OLED TV",
      brand: "LG",
      category: "Electronics",
      description: "OLED evo panel with Dolby Vision, Dolby Atmos, and a 120Hz refresh rate.",
      images: ["https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800"],
      originalPrice: 149990,
      currentPrice: 94990,
      rating: 4.5,
      reviewCount: 1760,
      isFeatured: true,
    },
    {
      name: "Dyson V15 Detect Vacuum",
      brand: "Dyson",
      category: "Home Appliances",
      description: "Cordless vacuum with laser dust detection and a LCD screen showing particle counts.",
      images: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800"],
      originalPrice: 62900,
      currentPrice: 47900,
      rating: 4.3,
      reviewCount: 640,
      isFeatured: false,
    },
    {
      name: "Logitech MX Master 3S Mouse",
      brand: "Logitech",
      category: "Accessories",
      description: "Ergonomic wireless mouse with an 8K DPI sensor and quiet clicks.",
      images: ["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800"],
      originalPrice: 9995,
      currentPrice: 7495,
      rating: 4.7,
      reviewCount: 4120,
      isFeatured: false,
    },
    {
      name: "OnePlus 12 (256GB)",
      brand: "OnePlus",
      category: "Smartphones",
      description: "Snapdragon 8 Gen 3 flagship with Hasselblad cameras and 100W fast charging.",
      images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800"],
      originalPrice: 69999,
      currentPrice: 64999,
      rating: 4.4,
      reviewCount: 2980,
      isFeatured: false,
    },
    {
      name: "Samsung 990 Pro 2TB SSD",
      brand: "Samsung",
      category: "Electronics",
      description: "PCIe 4.0 NVMe SSD with read speeds up to 7,450MB/s.",
      images: ["https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800"],
      originalPrice: 18999,
      currentPrice: 13999,
      rating: 4.8,
      reviewCount: 3410,
      isFeatured: false,
    },
    {
      name: "Instant Pot Duo 7-in-1",
      brand: "Instant Pot",
      category: "Home Appliances",
      description: "Multi-use programmable pressure cooker, slow cooker, rice cooker, and more.",
      images: ["https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800"],
      originalPrice: 12999,
      currentPrice: 7999,
      rating: 4.5,
      reviewCount: 12400,
      isFeatured: true,
    },
  ];

  for (const def of productDefs) {
    const baseSlug = slugify(def.name);

    const historyPoints = generateHistory(def.originalPrice, def.currentPrice);
    const historyForScoring = historyPoints.map((p) => ({
      price: p.price,
      timestamp: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000),
    }));
    const sixMonthAverage = calculateSixMonthAverage(historyForScoring);

    const dealResult = calculateDealScore({
      currentPrice: def.currentPrice,
      originalPrice: def.originalPrice,
      sixMonthAveragePrice: sixMonthAverage,
      rating: def.rating,
      reviewCount: def.reviewCount,
      availability: "IN_STOCK",
    });

    const product = await prisma.product.upsert({
      where: { slug: baseSlug },
      update: {},
      create: {
        name: def.name,
        slug: baseSlug,
        brand: def.brand,
        categoryId: categoryByName[def.category].id,
        description: def.description,
        images: def.images,
        amazonUrl: `https://www.amazon.in/s?k=${encodeURIComponent(def.name)}`,
        flipkartUrl: `https://www.flipkart.com/search?q=${encodeURIComponent(def.name)}`,
        amazonAffiliateLink: null,
        flipkartAffiliateLink: null,
        currentPrice: def.currentPrice,
        originalPrice: def.originalPrice,
        rating: def.rating,
        reviewCount: def.reviewCount,
        availability: "IN_STOCK",
        isFeatured: def.isFeatured,
        dealScore: dealResult.score,
        dealLabel: dealResult.label,
      },
    });

    // Only seed history if this product didn't already exist (idempotent re-seeding).
    const existingHistoryCount = await prisma.priceHistory.count({ where: { productId: product.id } });
    if (existingHistoryCount === 0) {
      await prisma.priceHistory.createMany({
        data: historyPoints.flatMap((p) => [
          { productId: product.id, price: p.price, platform: "AMAZON" as const, timestamp: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000) },
          { productId: product.id, price: Math.round(p.price * 1.01), platform: "FLIPKART" as const, timestamp: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000) },
        ]),
      });
    }
  }

  console.log(`Seeded ${productDefs.length} products across ${categoryDefs.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
