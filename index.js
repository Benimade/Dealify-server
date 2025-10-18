
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

    const data = await response.json();

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
    console.error("Error fetching products:", error);
    return { success: false, message: error.message, products: [] };
  }
}

// ✅ هذا السطر هو المهم لتفادي الخطأ
export default fetchProducts;
