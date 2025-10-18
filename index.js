
import express from "express";
import dotenv from "dotenv";
import { getProducts } from "./fetchProducts.js";
import { trackShipment } from "./trackShipment.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/products", async (req, res) => {
  try {
    const keyword = req.query.keyword || "electronics";
    const products = await getProducts(keyword);
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/track", async (req, res) => {
  try {
    const { trackingNumber, courier } = req.query;
    if (!trackingNumber || !courier)
      return res.status(400).json({ success: false, message: "trackingNumber and courier required" });

    const trackingInfo = await trackShipment(trackingNumber, courier);
    res.json({ success: true, trackingInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
