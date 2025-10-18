import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

async function fetchProducts(keyword = "phone") {
  try {
    const url = `https://aliexpress-business-api.p.rapidapi.com/affiliate-search.php?query=${encodeURIComponent(keyword)}&page=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "aliexpress-business-api.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    });

    const text = await response.text();

    // 🧠 تحقق إذا RapidAPI أرجع HTML بدل JSON (علامة خطأ)
    if (text.startsWith("<!DOCTYPE html>") || text.startsWith("<html")) {
      console.error("❌ RapidAPI returned HTML instead of JSON. Check the endpoint or key.");
      return { success: false, message: "RapidAPI returned HTML (invalid endpoint or key)", products: [] };
    }

    const data = JSON.parse(text);

    // 🔍 تحقق أن البيانات موجودة
    if (!data || !data.result || !Array.isArray(data.result)) {
      return { success: false, message: "No products found", products: [] };
    }

    // 🔧 استخراج المنتجات
    const products = data.result.map((p) => ({
      id: p.product_id || p.item_id,
      title: p.product_title,
      price: p.sale_price,
      image: p.product_main_image_url || p.image_url,
      url: p.product_detail_url,
    }));

    return { success: true, products };
  } catch (error) {
    console.error("❌ fetchProducts error:", error);
    return { success: false, message: error.message, products: [] };
  }
}

export default fetchProducts;
