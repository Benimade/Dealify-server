
import express from "express";
import dotenv from "dotenv";
import { getProducts } from "./fetchProducts.js";
import { trackShipment } from "./trackShipment.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ success: true, message: "Dealify server running (no AgentRouter)" });
});

app.get("/products", async (req, res) => {
  try {
    const keyword = req.query.keyword || "electronics";
    const products = await getProducts(keyword);
    res.json({ success: true, products });
  } catch (err) {
    console.error("Error in /products:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/track", async (req, res) => {
  try {
    const { trackingNumber, courier } = req.query;
    if (!trackingNumber || !courier) {
      return res.status(400).json({ success: false, message: "trackingNumber and courier are required" });
    }
    const result = await trackShipment(trackingNumber, courier);
    res.json({ success: true, result });
  } catch (err) {
    console.error("Error in /track:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
