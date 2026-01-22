import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/uncboard');
    console.log("✅ Połączono z MongoDB");
  } catch (err) {
    console.error("❌ Błąd połączenia z MongoDB:", err);
    process.exit(1);
  }
};

export default connectDB;