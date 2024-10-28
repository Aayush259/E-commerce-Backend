import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    image: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    description: { type: String, required: true },
    yearAdded: { type: Number, required: true },
    rating: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discountPercentage: {type: Number, required: true}
});

const Product = mongoose.model("Products", productSchema);

export default Product;
