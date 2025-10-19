import express from "express";
import dotenv from "dotenv";
import { fetchProducts } from "./fetchProducts.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ message: "Dealify server is running 🚀" });
});

app.get("/api/products", async (req, res) => {
  const keyword = req.query.keyword || "smartphone";
  const page = req.query.page || 1;

  const products = await fetchProducts(keyword, page);
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
