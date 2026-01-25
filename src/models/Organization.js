// models/Organization.js
import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },

  // Lista repozytoriów z GitHuba (ID repozytoriów)
  repo_ids: [{ type: Number }],

  // Członkowie organizacji z rolami
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
      joined_at: { type: Date, default: Date.now }
    }
  ],

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Organization", OrganizationSchema);