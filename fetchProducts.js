
import fetch from "node-fetch";
import cheerio from "cheerio";

const cache = new Map();
const CACHE_DURATION = (process.env.CACHE_DURATION || 1800) * 1000;

function buildAffiliateLink(url) {
  const base = process.env.AFF_LINK_BASE || "https://s.click";
  const shortKey = process.env.AFF_SHORT_KEY || "";
  const tracking = process.env.TRACKING_ID || "";
  return `${base}?aff_short_key=${shortKey}&tracking_id=${tracking}&url=${encodeURIComponent(url)}`;
}

export async function getProducts(keyword) {
  const now = Date.now();
  if (cache.has(keyword)) {
    const { data, expiry } = cache.get(keyword);
    if (now < expiry) return data;
  }

  console.log(`🔍 Fetching products for keyword: ${keyword}`);
  const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}`;
  const res = await fetch(searchUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (DealifyBot)" },
  });
  const html = await res.text();

  const $ = cheerio.load(html);
  const products = [];
  $("a[href*='/item/']").each((i, el) => {
    if (products.length >= 20) return false;
    const href = $(el).attr("href");
    const title = $(el).attr("title") || $(el).find("img").attr("alt") || "";
    const img = $(el).find("img").attr("src") || $(el).find("img").attr("image-src") || "";
    const price = $(el).closest("div").find(".price").first().text().trim() || "";
    if (href && title) {
      const productUrl = href.startsWith("http") ? href : `https://www.aliexpress.com${href}`;
      products.push({
        title,
        price,
        image: img,
        link: buildAffiliateLink(productUrl),
      });
    }
  });

  cache.set(keyword, { data: products, expiry: now + CACHE_DURATION });
  console.log(`✅ Found ${products.length} products.`);
  return products;
}


  cache.set(keyword, { data: products, expiry: now + CACHE_DURATION });
  return products;
}
