// models/Group.js
import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // Lista repozytoriów z GitHuba
  repo_ids: [{ type: Number }],

  // właściciel grupy
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

});

export default mongoose.model("Group", GroupSchema);
