
import express from "express";
import cors from "cors";
import fetchProducts from "./fetchProducts.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// 📦 مسار API الرئيسي
app.get("/api/products", async (req, res) => {
  const keyword = req.query.keyword || "phone";

  const products = await fetchProducts(keyword);

  // فقط قائمة المنتجات بدون success أو message
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
