import crypto from "crypto";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const APP_KEY = process.env.APP_KEY;
const APP_SECRET = process.env.APP_SECRET;
const TRACKING_ID = process.env.TRACKING_ID;

// 🧠 كاش لتخزين النتائج لمدة 30 دقيقة
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000;

// 🔐 توليد التوقيع
function generateSign(params) {
  const sortedKeys = Object.keys(params).sort();
  let signStr = APP_SECRET;
  sortedKeys.forEach((key) => (signStr += key + params[key]));
  signStr += APP_SECRET;
  return crypto.createHash("sha256").update(signStr).digest("hex").toUpperCase();
}

// 📦 الدالة الرئيسية لجلب المنتجات
export async function fetchProducts(keyword = "electronics", page = 1) {
  const cacheKey = `${keyword}_${page}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("⚡ Using cached data for:", keyword);
    return cached.data;
  }

  const timestamp = Date.now();

  const params = {
    app_key: APP_KEY,
    keywords: keyword,
    page_no: page,
    page_size: 10,
    timestamp,
    sign_method: "sha256",
  };

  const sign = generateSign(params);
  const queryString = new URLSearchParams({ ...params, sign }).toString();

  const url = `https://api-sg.aliexpress.com/openapi/param2/2/aliexpress.open/api.listPromotionProduct/?${queryString}`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const data = JSON.parse(text);

    const products =
      data?.resp_result?.result?.products?.map((p) => ({
        id: p.product_id,
        title: p.product_title,
        price: p.sale_price,
        discount: p.discount,
        productUrl: `${p.product_detail_url}?aff_trace_key=${TRACKING_ID}`,
        imageUrl: p.product_main_image_url,
      })) || [];

    // حفظ النتائج في الكاش
    cache.set(cacheKey, { timestamp: Date.now(), data: products });

    return products;
  } catch (error) {
    console.error("❌ fetchProducts error:", error.message);
    return [];
  }
}

