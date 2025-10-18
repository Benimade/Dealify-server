
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
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.result || !data.result.products) {
      return [];
    }

    // 🔗 توليد الروابط مع التتبع والعمولة
    const products = data.result.products.map((p) => {
      let finalLink = p.productUrl;

      // 🧩 إذا وُجد aff_short_key → رابط عمولة رسمي
      if (process.env.AFF_SHORT_KEY) {
        finalLink = `https://s.click.aliexpress.com/deep_link.htm?aff_short_key=${process.env.AFF_SHORT_KEY}&dp=${encodeURIComponent(p.productUrl)}`;
      }
      // 🧩 إذا لا يوجد aff_short_key ولكن يوجد tracking أو aff_trace_key → أضفهم كرابط تتبع
      else if (process.env.AFF_TRACE_KEY || process.env.TRACKING_ID) {
        const tracking = process.env.AFF_TRACE_KEY || process.env.TRACKING_ID;
        finalLink = `${p.productUrl}?aff_fcid=${tracking}`;
      }

      return {
        id: p.productId,
        title: p.productTitle,
        price: p.salePrice,
        image: p.productMainImageUrl,
        link: finalLink
      };
    });

    return products;

  } catch (error) {
    console.error("❌ fetchProducts error:", error.message);
    return [];
  }
}
