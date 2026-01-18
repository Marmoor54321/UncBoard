// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  org_id: { type: String, required: true, index: true }, // ID organizacji GitHub
  sender: {
    github_id: { type: String, required: true },
    login: { type: String, required: true },
    avatar_url: String,
  },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);