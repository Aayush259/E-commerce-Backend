import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import ProductRoute from "./routes/ProductRoute.js";
import AddProductRoute from "./routes/AddProductRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(cors({
    origin: "https://aayush259.github.io/E-Commerce",
    credentials: true,    // Allows cookies to be sent
}));

const port = process.env.PORT || 3000;

const connectToMongoDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("Connected to MongoDB");
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
app.use("/addProduct", AddProductRoute);
app.use("/auth", AuthRoute);

app.listen(port, () => {
	console.log("Server is running on port", port);
});
