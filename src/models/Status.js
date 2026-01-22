import mongoose from "mongoose";

const StatusSchema = new mongoose.Schema({
  repo_id: { type: Number },

  name: { type: String, required: true },

  is_default: { type: Boolean, default: false },   // TO DO, IN PROGRESS, IN REVIEW, DONE
  order: { type: Number, default: 0 },             // pozycja kolumny w Kanbanie

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, 
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("Status", StatusSchema);
