import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

async function fetchProducts(keyword = "phone") {
  try {
    const url = `https://aliexpress-datahub.p.rapidapi.com/item_search?query=${encodeURIComponent(keyword)}&page=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "aliexpress-datahub.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    });

    const text = await response.text();

    // 🔍 تحقق إن كانت الاستجابة HTML (خطأ)
    if (text.startsWith("<!DOCTYPE html>") || text.startsWith("<html")) {
      console.error("❌ RapidAPI returned HTML instead of JSON. Check your endpoint or API key.");
      return {
        success: false,
        message: "RapidAPI returned HTML (invalid endpoint or key)",
        products: [],
      };
    }

    const data = JSON.parse(text);

    if (!data || !data.result || !data.result.items) {
      return { success: false, message: "No products found", products: [] };
    }

    const products = data.result.items.map((item) => ({
      id: item.item_id,
      title: item.title,
      price: item.sale_price,
      image: item.image,
      url: item.detail_url,
    }));

    return { success: true, products };
  } catch (error) {
    console.error("❌ fetchProducts error:", error);
    return { success: false, message: error.message, products: [] };
  }
}

export default fetchProducts;
