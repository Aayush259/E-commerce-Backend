import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

const router = express.Router();

// Middleware to authenticate the user.
const authMiddleware = (req, res, next) => {
    // Extract the token from the request headers.
    const token = req.headers.authorization?.split(" ")[1];

    // If no token is found, return a 403 Forbidden response.
    if (!token) return res.status(403).json({ message: "Token missing" });

    // Verify the token using the JWT secret.
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    })
};

// Route to get all products.
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to get products by IDs.
router.get("/productByIds", async (req, res) => {
    try {
        const productIds = req.body.ids;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: "Invalid productIds" });
        }

        const productPromises = productIds.map(id => {
            if (typeof id !== "string") {
                throw new Error("Invalid productIds");
            }
            return Product.findById(id);
        })

        const products = await Promise.all(productPromises);

        res.json({ message: "Products fetched successfully", products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

// Route to delete a product by ID.
router.delete("/delete", async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findByIdAndDelete(id);
        res.json({ message: "Deleted Successfully", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to add a product to cart.
router.post("/addToCart", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;
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

// Route to remove a product from cart.
router.post("/removeFromCart", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;
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

// Route to get the cart items.
router.get("/getCart", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
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

// Route to clear the cart.
router.post("/clearCart", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await User.updateOne({ _id: userId }, { $set: { cart: [] } });

        res.json({ message: "Cart cleared successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

// Route to add a product to wishlist.
router.post("/addToWishlist", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;
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

// Route to remove a product from wishlist.
router.post("/removeFromWishlist", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;
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

// Route to get the wishlist items.
router.get("/getWishlist", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
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
