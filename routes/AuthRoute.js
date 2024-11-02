import express from "express";
import dotenv from "dotenv";
import bycrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

dotenv.config();

const router = express.Router();

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Token missing" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    })
};

router.get("/user", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ email: user.email });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user" });
    }
})

router.post("/signup", async (req, res) => {
    try {
        const hashedPassword = await bycrypt.hash(req.body.password, 10);

        const email = req.body.email;

        const existingUser = await User.findOne({ email });

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

router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (user && await bycrypt.compare(req.body.password, user.password)) {
            const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
            user.refreshToken = refreshToken;

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })

            res.json({ message: "Logged in successfully", accessToken, user });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(400).json({ message: "Error logging in" });
    }
});

router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(403).json({ message: "Refresh token required" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user && user.refreshToken === refreshToken) {
            const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const newRefreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

            user.refreshToken = newRefreshToken;
            await user.save();

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
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

router.post("/logout", async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.refreshToken = null;
        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
    } catch (error) {
        res.status(500).json({ message: "Error logging out" });
    }
});

export default router;
