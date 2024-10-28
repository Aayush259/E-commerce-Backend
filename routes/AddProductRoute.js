import express from "express";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import multer from "multer";
import Product from "../models/Product.js";

dotenv.config();

const cloudName = process.env.CLOUD_NAME;
const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;

console.log(cloudName, apiKey, apiSecret);

cloudinary.v2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
});

// Set up multer with memory storage.
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post("/", upload.single('image'), async (req, res) => {

    try {
        const { name, category, brand, description, yearAdded, rating, originalPrice, discountPercentage } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "No image provided" });
        };

        // Upload image to Cloudinary.
        cloudinary.v2.uploader.upload_stream(
            {folder: "products"}, async (error, result) => {
                if (error) {
                    return res.status(500).json({ message: "Error uploading image to cloudinary:", error });
                }

                const product = new Product({
                    image: result.secure_url,
                    name,
                    category,
                    brand,
                    description,
                    yearAdded: Number(yearAdded),
                    rating: Number(rating),
                    originalPrice: Number(originalPrice),
                    discountPercentage: Number(discountPercentage),
                });

                await product.save();
                res.status(201).json({ message: "Product added successfully" });
            }
        ).end(req.file.buffer);
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

export default router;
