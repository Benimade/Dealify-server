import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

async function fetchProducts(keyword = "phone") {
  try {
    const url = `https://aliexpress-business-api.p.rapidapi.com/affiliate-products-by-keyword.php?keyword=${encodeURIComponent(keyword)}&page=1&language=en&currency=USD`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "aliexpress-business-api.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    });

    const text = await response.text();

    // في حالة أعاد السيرفر HTML بدل JSON (خطأ مفتاح API أو سيرفر)
    if (text.startsWith("<!DOCTYPE html>") || text.startsWith("<html")) {
      console.error("❌ RapidAPI returned HTML instead of JSON");
      return [];
    }

    const data = JSON.parse(text);

    if (!data || !data.result || !Array.isArray(data.result)) {
      return [];
    }

    // تحويل النتائج إلى تنسيق موحد
    const products = data.result.map((p) => ({
      id: p.product_id || p.item_id,
      title: p.product_title,
      price: p.sale_price,
      image: p.product_main_image_url || p.image_url,
      url: p.product_detail_url,
    }));

    return products;
  } catch (error) {
    console.error("❌ fetchProducts error:", error);
    return [];
  }
}

export default fetchProducts;

