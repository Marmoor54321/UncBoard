// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  github_id: { type: Number, unique: true, required: true },
  login: String,
  avatar_url: String,
  html_url: String,

  created_at: { type: Date, default: Date.now },
  last_login: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
