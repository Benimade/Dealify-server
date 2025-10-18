
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetchProducts from "./fetchProducts.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ المسار الأساسي
app.get("/", (req, res) => {
  res.json({ message: "Dealify API is running 🚀" });
});

// ✅ مسار جلب المنتجات
app.get("/products", async (req, res) => {
  try {
    const keyword = req.query.keyword || "phone";
    const products = await fetchProducts(keyword);
    res.json({ success: true, products });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
