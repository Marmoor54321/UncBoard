import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import createGitHubRoutes from "./routes/auth.js";
import githubRoutes from "./routes/github.js";
import statusRoutes from "./routes/statuses.js";
import issueRoutes from "./routes/issues.js";
import groupRoutes from "./routes/groups.js";
import IssueStatus from "./models/IssueStatus.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(session({ 
  secret: process.env.SESSION_SECRET || "secret", 
  resave: false, 
  saveUninitialized: true 
}));

// Baza danych
connectDB();

// Konfiguracja OAuth GitHub
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
app.use(createGitHubRoutes(CLIENT_ID, CLIENT_SECRET));

// Routing - Wszystkie grupy tras
app.use("/api/github", githubRoutes); 
app.use("/api/github/issues", issueRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/group", groupRoutes);

app.put("/api/issue-status", async (req, res) => {
  try {
    const { issue_id, repo_id, status_id } = req.body;
    let issueStatus = await IssueStatus.findOneAndUpdate(
      { issue_id, repo_id },
      { status_id, updated_at: new Date() },
      { upsert: true, new: true }
    );
    res.json({ message: "Issue status updated", issueStatus });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));