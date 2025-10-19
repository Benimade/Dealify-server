import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const APP_KEY = process.env.APP_KEY;
const APP_SECRET = process.env.APP_SECRET;
const TRACKING_ID = process.env.TRACKING_ID;
const PORT = process.env.PORT || 3000;

// 🧠 كاش في الذاكرة لتخزين النتائج 30 دقيقة
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 دقيقة

// 🔐 دالة لتوليد التوقيع
function generateSign(params) {
  const sortedKeys = Object.keys(params).sort();
  let signStr = APP_SECRET;
  sortedKeys.forEach((key) => {
    signStr += key + params[key];
  });
  signStr += APP_SECRET;
  return crypto.createHash("sha256").update(signStr).digest("hex").toUpperCase();
}

// 🛍️ دالة لجلب المنتجات من AliExpress API
async function fetchProducts(keyword = "electronics", page = 1) {
  const cacheKey = `${keyword}_${page}`;
  const cached = cache.get(cacheKey);

  // 📦 إذا كانت النتيجة موجودة ومحدّثة حديثاً، نعيدها من الكاش
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("⚡ Cached result used for:", keyword);
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

  const queryString = new URLSearchParams({
    ...params,
    sign,
  }).toString();

  const url = `https://api-sg.aliexpress.com/openapi/param2/2/aliexpress.open/api.listPromotionProduct/?${queryString}`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    const data = JSON.parse(text);

    // ✅ معالجة النتائج
    const products =
      data?.resp_result?.result?.products?.map((p) => ({
        id: p.product_id,
        title: p.product_title,
        price: p.sale_price,
        discount: p.discount,
        productUrl: `${p.product_detail_url}?aff_trace_key=${TRACKING_ID}`,
        imageUrl: p.product_main_image_url,
      })) || [];

    // تخزين في الكاش
    cache.set(cacheKey, { timestamp: Date.now(), data: products });

    return products;
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    return [];
  }
}

// 🌐 API endpoint
app.get("/api/products", async (req, res) => {
  const keyword = req.query.keyword || "smartphone";
  const page = req.query.page || 1;

  const products = await fetchProducts(keyword, page);
  res.json(products);
});

// 🟢 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
