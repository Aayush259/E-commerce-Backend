import express from "express";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
