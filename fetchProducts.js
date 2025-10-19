import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

async function fetchProducts(keyword = "phone") {
  try {
    const url = `https://aliexpress-product-data-api.p.rapidapi.com/product/search?query=${encodeURIComponent(keyword)}&page=1&country=US&language=EN&currency=USD`;

    const response = await fetch(url, {
      headers: {
        "x-rapidapi-host": "aliexpress-product-data-api.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    });

    const data = await response.json();

    if (!data || !data.docs || !Array.isArray(data.docs)) {
      return [];
    }

    return data.docs.map((p) => ({
      id: p.productId,
      title: p.productTitle,
      price: p.appSalePrice,
      image: p.productMainImageUrl,
      url: p.productDetailUrl,
    }));
  } catch (err) {
    console.error("❌ fetchProducts error:", err);
    return [];
  }
}

export default fetchProducts;
