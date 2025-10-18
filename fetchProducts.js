
import fetch from "node-fetch";

const cache = new Map();
const CACHE_DURATION = process.env.CACHE_DURATION * 1000;

export async function getProducts(keyword) {
  const now = Date.now();

  if (cache.has(keyword)) {
    const { data, expiry } = cache.get(keyword);
    if (now < expiry) return data;
  }

  const url = `https://agentrouter.org/api/proxy/ali?keywords=${encodeURIComponent(keyword)}&page_no=1&page_size=20&app_key=${process.env.ALIEXPRESS_APP_KEY}&affiliate_id=${process.env.AFFILIATE_TRUE_KEY}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${process.env.AGENTROUTER_TOKEN}`,
      "Content-Type": "application/json"
    }
  });

  const json = await response.json();

  const products = (json.result || []).map(p => ({
    productId: p.productId,
    title: p.productTitle,
    price: p.minPrice,
    currency: p.currency,
    link: `${process.env.AFF_LINK_BASE}?${p.productUrl.split('?')[1] || ''}`
  }));

  cache.set(keyword, { data: products, expiry: now + CACHE_DURATION });
  return products;
}
