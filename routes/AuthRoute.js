import express from "express";
import dotenv from "dotenv";
import bycrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

// Route to get user details.
router.get("/user", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ email: user.email, name: user.name, _id: user._id, cart: user.cart, wishlist: user.wishlist, address: user.address, phone: user.phone, pincode: user.pincode, city: user.city, state: user.state });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user" });
    }
})

// Route to handle user signup.
router.post("/signup", async (req, res) => {
    try {
        // Hash the password before storing it in the database.
        const hashedPassword = await bycrypt.hash(req.body.password, 10);

        const email = req.body.email;

        // Check if the email is already in use.
        const existingUser = await User.findOne({ email });

        // If the email is already in use, return a 400 Bad Request response.
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(400).json({ message: "Error registering user", error });
    }
});

// Route to handle user login.
router.post("/login", async (req, res) => {
    try {
        // Check if the email exists in the database.
        const user = await User.findOne({ email: req.body.email });

        // If the email does not exist, return a 401 Unauthorized response.
        if (user && await bycrypt.compare(req.body.password, user.password)) {
            // Generate an access token and a refresh token.
            const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "4h" });
            const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            // Set the refresh token as an HTTP-only cookie.
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })

            res.json({ message: "Logged in successfully", accessToken, user });
            user.refreshToken = refreshToken;
            await user.save();
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(400).json({ message: "Error logging in" });
    }
});

// Route to refresh the access and refresh token.
router.post("/refresh", async (req, res) => {
    // Extract the refresh token from the request cookies.
    const refreshToken = req.cookies.refreshToken;

    // If no refresh token is found, return a 403 Forbidden response.
    if (!refreshToken) return res.status(403).json({ message: "Refresh token required" });

    try {
        // Verify the refresh token.
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Find the user associated with the refresh token.
        const user = await User.findById(decoded.id);

        // If the user exists and the refresh token matches, generate new access and refresh tokens.
        if (user && user.refreshToken === refreshToken) {
            const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "4h" });
            const newRefreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            user.refreshToken = newRefreshToken;
            await user.save();

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })

            res.json({ accessToken: newAccessToken });
        } else {
            res.status(403).json({ message: "Invalid refresh token" });
        }
    } catch (error) {
        res.status(403).json({ message: "Token expired or invalid" });
    }
});

// Route to handle user logout.
router.post("/logout", async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.refreshToken = null;
        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
    } catch (error) {
        res.status(500).json({ message: "Error logging out", error });
    }
});

// Route to update user contact information.
router.post("/updateContact", authMiddleware, async (req, res) => {
    try {
        // Check if the user exists.
        const user = await User.findById(req.user.id);

        // If the user does not exist, return a 404 Not Found response.
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the user's contact information.
        const { address, phone, pincode, city, state } = req.body;

        if (!address || !phone || !pincode || !city || !state) {
            return res.status(400).json({ message: "All fields are required" });
        }

        user.address = address;
        user.phone = phone;
        user.pincode = pincode;
        user.city = city;
        user.state = state;
        await user.save();

        res.json({ message: "Contact updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating contact", error });
    }
});

export default router;
