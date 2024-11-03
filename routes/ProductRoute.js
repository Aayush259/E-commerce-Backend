import express from "express";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import User from "../models/User.js";

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

router.delete("/delete", async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findByIdAndDelete(id);
        res.json({ message: "Deleted Successfully", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/addToCart", async (req, res) => {
    try {
        const { productId, userId } = req.body;
        const user = await User.findById(userId);
        const product = await Product.findById(productId);

        if (!user || !product) {
            return res.status(404).json({ message: "User or Product not found" });
        }

        if (user.cart.includes(productId)) {
            return res.status(400).json({ message: "Product already in cart" });
        }

        user.cart.push(productId);
        await user.save();

        res.json({ message: "Product added to cart" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/removeFromCart", async (req, res) => {
    try {
        const { productId, userId } = req.body;
        const user = await User.findById(userId);
        const product = await Product.findById(productId);

        if (!user || !product) {
            return res.status(404).json({ message: "User or Product not found" });
        }

        const index = user.cart.indexOf(productId);

        if (index === -1) {
            return res.status(400).json({ message: "Product not in cart" });
        }

        user.cart.splice(index, 1);
        await user.save();

        res.json({ message: "Product removed from cart" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/getCart", async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const cartItems = await Product.find({ _id: { $in: user.cart } });

        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/addToWishlist", async (req, res) => {
    try {
        const { productId, userId } = req.body;
        const user = await User.findById(userId);
        const product = await Product.findById(productId);

        if (!user || !product) {
            return res.status(404).json({ message: "User or Product not found" });
        }

        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ message: "Product already in wishlist" });
        }

        user.wishlist.push(productId);
        await user.save();

        res.json({ message: "Product added to wishlist" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/removeFromWishlist", async (req, res) => {
    try {
        const { productId, userId } = req.body;
        const user = await User.findById(userId);
        const product = await Product.findById(productId);

        if (!user || !product) {
            return res.status(404).json({ message: "User or Product not found" });
        }

        const index = user.wishlist.indexOf(productId);

        if (index === -1) {
            return res.status(400).json({ message: "Product not in wishlist" });
        }

        user.wishlist.splice(index, 1);
        await user.save();

        res.json({ message: "Product removed from wishlist" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/getWishlist", async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const wishlistItems = await Product.find({ _id: { $in: user.wishlist } });

        res.json(wishlistItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export default router;
