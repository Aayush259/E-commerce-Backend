import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import cors from "cors";
import ProductRoute from "./routes/ProductRoute.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors({
    origin: "*",
}));

const port = process.env.PORT || 3000;

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.log(error);
    }
};

connectToMongoDB();

app.get("/", (req, res) => {
  res.json({
    "/products": "Get all products",
  });
});

app.use("/products", ProductRoute);

app.listen(port, () => {
  console.log("Server is running on port", port);
});
