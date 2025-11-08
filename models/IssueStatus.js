import mongoose from "mongoose";

const IssueStatusSchema = new mongoose.Schema({
  repo_id: { type: Number, required: true },

  issue_id: { type: Number, required: true },  // GitHub issue ID

  status_id: { type: mongoose.Schema.Types.ObjectId, ref: "Status", required: true },

  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model("IssueStatus", IssueStatusSchema);
