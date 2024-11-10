import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    cart: { type: Array, default: [] },
    wishlist: { type: Array, default: [] },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    pincode: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
});

const User = mongoose.model("User", userSchema);

export default User;
