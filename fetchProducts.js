
import fetch from "node-fetch";

const cache = new Map();
const CACHE_DURATION = (process.env.CACHE_DURATION || 1800) * 1000;

export async function getProducts(keyword) {
  const now = Date.now();

  // تحقق من الكاش
  if (cache.has(keyword)) {
    const { data, expiry } = cache.get(keyword);
    if (now < expiry) {
      console.log(`✅ Returning cached products for "${keyword}"`);
      return data;
    }
  }

  console.log(`🚀 Fetching products for "${keyword}" from AgentRouter...`);

  const url = `https://api.agentrouter.org/v1/route?target=ali&keywords=${encodeURIComponent(keyword)}&page_no=1&page_size=20&app_key=${process.env.ALIEXPRESS_APP_KEY}&affiliate_id=${process.env.AFFILIATE_TRUE_KEY}`;

  let json = null;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.AGENTROUTER_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const text = await response.text(); // <-- نقرأ النص أولاً لتجنب أخطاء parsing
    try {
      json = JSON.parse(text);
    } catch (parseErr) {
      console.error("❌ Failed to parse JSON:", text);
      throw new Error("Invalid JSON returned from AgentRouter");
    }

    if (!response.ok) {
      console.error("❌ AgentRouter returned an error:", json);
      throw new Error(json?.error?.message || "AgentRouter error");
    }
  } catch (err) {
    console.error("❌ Fetch failed:", err.message);
    throw new Error(`AgentRouter request failed: ${err.message}`);
  }

  console.log("🧾 Raw response from AgentRouter:", JSON.stringify(json, null, 2));

  if (!json.result || json.result.length === 0) {
    console.warn(`⚠️ No products found for keyword "${keyword}"`);
    return [];
  }

  const products = json.result.map((p) => ({
    productId: p.productId,
    title: p.productTitle,
    price: p.minPrice,
    currency: p.currency,
    link: `${process.env.AFF_LINK_BASE}?${p.productUrl.split("?")[1] || ""}`,
  }));

  console.log(`✅ Returning ${products.length} products for "${keyword}"`);

  cache.set(keyword, { data: products, expiry: now + CACHE_DURATION });
  return products;
}
