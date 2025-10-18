
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

export default async function fetchProducts(keyword) {
  try {
  const apiUrl = "https://api.aliexpress.com/openapi/param2/2/aliexpress.open/api.listPromotionProduct/";

    const params = new URLSearchParams({
      app_key: process.env.APP_KEY,
      keywords: keyword || "phone",
      page_no: "1",
      page_size: "20",
      fields: "productId,productTitle,productUrl,productMainImageUrl,salePrice"
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    // ✅ تأكد من وجود البيانات المطلوبة
    if (!data.result || !data.result.products) {
      return [];
    }

    // ✅ تحويل البيانات إلى صيغة منظمة
    const products = data.result.products.map((p) => ({
      id: p.productId,
      title: p.productTitle,
      price: p.salePrice,
      image: p.productMainImageUrl,
      link: p.productUrl
    }));

    return products;

  } catch (error) {
    console.error("❌ fetchProducts error:", error.message);
    return [];
  }
}
