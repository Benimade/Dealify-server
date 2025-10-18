
import fetch from "node-fetch";

const cache = new Map();
const CACHE_DURATION = process.env.CACHE_DURATION * 1000;

export async function getProducts(keyword) {
  const now = Date.now();

  if (cache.has(keyword)) {
    const { data, expiry } = cache.get(keyword);
    if (now < expiry) {
      console.log(`Returning cached products for "${keyword}"`);
      return data;
    }
  }

  console.log(`Fetching products for "${keyword}" from AgentRouter...`);
  console.log("Raw response from AgentRouter:", JSON.stringify(json, null, 2));


 const url = `https://api.agentrouter.org/v1/route?target=ali&keywords=${encodeURIComponent(keyword)}&page_no=1&page_size=20&app_key=${process.env.ALIEXPRESS_APP_KEY}&affiliate_id=${process.env.AFFILIATE_TRUE_KEY}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${process.env.AGENTROUTER_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Network/Fetch error:", err);
    throw new Error("Failed to fetch from AgentRouter");
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    console.error("Failed to parse JSON from AgentRouter:", err);
    throw new Error("Invalid JSON response from AgentRouter");
  }

  console.log("Raw response from AgentRouter:", JSON.stringify(json, null, 2));

  if (!json.result || json.result.length === 0) {
    console.warn(`No products found for keyword "${keyword}"`);
    return [];
  }

  const products = json.result.map(p => ({
    productId: p.productId,
    title: p.productTitle,
    price: p.minPrice,
    currency: p.currency,
    link: `${process.env.AFF_LINK_BASE}?${p.productUrl.split('?')[1] || ''}`
  }));

  console.log(`Returning ${products.length} products for "${keyword}"`);

  cache.set(keyword, { data: products, expiry: now + CACHE_DURATION });
  return products;
}

