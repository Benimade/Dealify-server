
import fetch from "node-fetch";
import cheerio from "cheerio";
import crypto from "crypto";

const cache = new Map();
const CACHE_DURATION = (process.env.CACHE_DURATION || 1800) * 1000;
const USE_OFFICIAL = (process.env.USE_OFFICIAL_API || "false").toLowerCase() === "true";

function buildAffiliateLink(productUrlQuery) {
  // productUrlQuery: الجزء بعد ? في رابط المنتج الأصلي (إن وُجد)
  // ممكن تعديل هذا الجزء إذا كان لديك طريقة محددة لإنشاء s.click links
  if (!productUrlQuery) return process.env.AFF_LINK_BASE || "https://s.click";
  return `${process.env.AFF_LINK_BASE}?${productUrlQuery}&aff_short_key=${process.env.AFF_SHORT_KEY || ""}&tracking_id=${process.env.TRACKING_ID || ""}`;
}

// If you use the official AliExpress Open API you normally need to sign the request.
// This function demonstrates a common signing pattern (SHA256) — verify with AliExpress docs and adapt if required.
function signParams(params, appSecret) {
  // params is object of key->value
  const keys = Object.keys(params).sort();
  const query = keys.map(k => `${k}${params[k]}`).join('');
  const toSign = `${appSecret}${query}${appSecret}`;
  // sha256 then uppercase hex (adjust if AliExpress expects MD5 or other)
  return crypto.createHash('sha256').update(toSign).digest('hex').toUpperCase();
}

async function fetchOfficialAli(keyword) {
  // Example endpoint used historically:
  // https://api-sg.aliexpress.com/openapi/param2/2/aliexpress.open/api.listPromotionProduct/
  // You MUST check AliExpress Open API docs for exact param names and sign method.
  const endpoint = 'https://api-sg.aliexpress.com/openapi/param2/2/aliexpress.open/api.listPromotionProduct/';
  const timestamp = Date.now();
  const params = {
    keywords: keyword,
    page_no: 1,
    page_size: 20,
    app_key: process.env.APP_KEY || '',
    timestamp
    // other params as required...
  };

  // create sign if APP_SECRET exists
  let sign = '';
  if (process.env.APP_SECRET) {
    sign = signParams(params, process.env.APP_SECRET);
  }

  // build url (note: this might need encoding or different param names)
  const url = `${endpoint}?${Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&')}&sign=${sign}`;

  console.log("Fetching Official AliExpress API URL:", url);

  const resp = await fetch(url);
  const text = await resp.text();
  try {
    const json = JSON.parse(text);
    return json;
  } catch (err) {
    console.error("Official API returned non-JSON:", text);
    throw new Error("Official AliExpress API returned invalid JSON. Check APP_KEY/APP_SECRET and sign method.");
  }
}

async function fetchViaScrape(keyword) {
  // Simple scraping: fetch search page and try to extract embedded JSON or product blocks.
  const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}`;
  console.log("Scraping AliExpress search page:", searchUrl);

  const resp = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; DealifyBot/1.0; +https://example.com)"
    }
  });

  const html = await resp.text();

  // Try to find JSON embedded in the page (var store = ... or window.runParams or similar)
  // This is somewhat heuristic and may need adapting if AliExpress changes their page.
  const $ = cheerio.load(html);

  // Attempt 1: look for <script> tags containing "window.runParams" or "var ytInitialData" or similar
  const scripts = $('script').get().map(s => $(s).html()).filter(Boolean);
  for (const s of scripts) {
    if (s.includes('window.runParams') || s.includes('window.__INITIAL_STATE__') || s.includes('window.__INITIAL_PROPS__')) {
      // try to extract first JSON-looking object
      const jsonMatch = s.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // try to dig common paths for products
          // this is heuristic; adapt based on actual structure
          const results = parsed?.mods?.itemList?.content?.[0]?.list;
          if (results && Array.isArray(results) && results.length > 0) return { result: results };
        } catch (e) {
          // continue to next
        }
      }
    }
  }

  // Attempt 2: parse product cards from HTML
  const products = [];
  // select product links/cards - heuristic selectors
  $('a[href*="/item/"]').each((i, el) => {
    if (products.length >= 20) return;
    const href = $(el).attr('href');
    const title = $(el).attr('title') || $(el).find('img').attr('alt') || $(el).text().trim();
    const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
    // find price near element
    const priceEl = $(el).closest('div').find('.price').first();
    const price = priceEl ? priceEl.text().trim() : null;
    products.push({
      productId: href ? href.split('/item/')[1]?.split('.html')[0] : `scrape_${i}`,
      productTitle: title || `Product ${i}`,
      minPrice: price || null,
      currency: null,
      productUrl: href?.startsWith('http') ? href : `https://www.aliexpress.com${href}`,
      image: img || null
    });
  });

  return { result: products };
}

export async function getProducts(keyword) {
  const now = Date.now();
  if (cache.has(keyword)) {
    const { data, expiry } = cache.get(keyword);
    if (now < expiry) {
      console.log(`Returning cached products for "${keyword}"`);
      return data;
    }
  }

  let raw;
  try {
    if (USE_OFFICIAL) {
      raw = await fetchOfficialAli(keyword);
    } else {
      raw = await fetchViaScrape(keyword);
    }
  } catch (err) {
    console.error("Fetch products error:", err);
    throw err;
  }

  console.log("Raw fetch result preview:", Array.isArray(raw.result) ? `items=${raw.result.length}` : typeof raw);

  if (!raw || !raw.result || raw.result.length === 0) {
    console.warn(`No products returned for "${keyword}"`);
    cache.set(keyword, { data: [], expiry: now + CACHE_DURATION });
    return [];
  }

  const products = raw.result.slice(0, 20).map(p => {
    // attempt to normalize fields from either official API or scraped object
    const productUrl = p.productUrl || p.productDetailUrl || p.url || (p.productId ? `https://www.aliexpress.com/item/${p.productId}.html` : null);
    const queryPart = productUrl && productUrl.includes('?') ? productUrl.split('?')[1] : `productId=${p.productId || ''}`;
    return {
      productId: p.productId || (p.productIdString) || null,
      title: p.productTitle || p.title || p.name || '',
      price: p.minPrice || p.price || null,
      currency: p.currency || null,
      image: p.image || p.imageUrl || p.pic_url || p.image_src || null,
      link: buildAffiliateLink(queryPart)
    };
  });

  cache.set(keyword, { data: products, expiry: now + CACHE_DURATION });
  return products;
}
