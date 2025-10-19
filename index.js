
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetchProducts from "./fetchProducts.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔍 اختبار API
app.get("/", (req, res) => {
  res.json({ message: "Dealify server is running 🚀" });
});

// 🔎 جلب المنتجات
app.get("/api/products", async (req, res) => {
  const keyword = req.query.keyword || "phone";
  const data = await fetchProducts(keyword);
  res.json(data);
});

// ✅ استماع على Render
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
