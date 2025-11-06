import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import createGitHubRoutes from "./routes/githubAuth.js";
import Status from "./models/Status.js";
import IssueStatus from "./models/IssueStatus.js";




dotenv.config();
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(express.json());

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.use(
  createGitHubRoutes(CLIENT_ID, CLIENT_SECRET)
);


// Połącz z MongoDB
mongoose.connect('mongodb://localhost:27017/uncboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Połączono z MongoDB"))
.catch(err => console.log(err));

// User repos
  app.get("/api/github/repos", async (req, res) => {
    const token = req.session.token;
    if (!token) return res.status(401).send("Not authenticated");

    try {
      const response = await axios.get("https://api.github.com/user/repos", {
        headers: { Authorization: `token ${token}` },
      });
      res.json(response.data);
    } catch (err) {
      res.status(500).send("Failed to fetch repositories");
    }
  });
  
app.post("/api/statuses/default", async (req, res) => {
  try {
    const { repo_id } = req.body;
    if (!repo_id) return res.status(400).json({ message: "repo_id is required" });

    const existing = await Status.find({ repo_id });
    if (existing.length > 0) {
      return res.status(200).json({ message: "Default statuses already exist" });
    }

    const defaults = [
      { name: "TO DO", is_default: true, order: 1 },
      { name: "IN PROGRESS", is_default: true, order: 2 },
      { name: "IN REVIEW", is_default: true, order: 3 },
      { name: "DONE", is_default: true, order: 4 },
    ];

    const created = await Status.insertMany(defaults.map(s => ({ ...s, repo_id })));
    res.status(201).json({ message: "Default statuses created successfully", statuses: created });

  } catch (err) {
    console.error("Error creating default statuses:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get repository issues
app.get("/api/github/issues/:owner/:repo", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { owner, repo } = req.params;
  const repo_id = req.query.repo_id; // frontend powinien przekazać id repo

  try {
    // 1. Pobierz issue z GitHuba
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      { headers: { Authorization: `token ${token}` } }
    );

    const githubIssues = response.data;

    // 2. Pobierz wszystkie statusy repo
    const statuses = await Status.find({ repo_id });
    const todoStatus = statuses.find(s => s.name === "TO DO");

    // 3. Pobierz powiązania z IssueStatus
    const existing = await IssueStatus.find({ repo_id });

    // 4. Utwórz brakujące wpisy w IssueStatus
    const newStatuses = [];
    for (const issue of githubIssues) {
      const already = existing.find(e => e.issue_id === issue.id);
      if (!already) {
        newStatuses.push({
          repo_id,
          issue_id: issue.id,
          status_id: todoStatus._id, // domyślny status TO DO
        });
      }
    }

    if (newStatuses.length > 0) {
      await IssueStatus.insertMany(newStatuses);
      console.log(`✅ Added ${newStatuses.length} new issue-status records.`);
    }

    // 5. Pobierz aktualne przypisania (po ewentualnym dodaniu)
    const issueStatuses = await IssueStatus.find({ repo_id }).populate("status_id");

    // 6. Dołącz statusy do issue
    const issuesWithStatus = githubIssues.map(issue => {
      const status = issueStatuses.find(s => s.issue_id === issue.id);
      return {
        ...issue,
        status: status ? status.status_id.name : "TO DO",
      };
    });

    res.json(issuesWithStatus);

  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch issues");
  }
});



//endpoints dla statusów

//pobieranie statusów dla repozytorium
app.get("/api/statuses/:repoId", async (req, res) => {
  const statuses = await Status.find({ repo_id: req.params.repoId }).sort({ order: 1 });
  res.json(statuses);
});

//dodawanie nowego statusu
app.post("/api/statuses", async (req, res) => {
  const { repo_id, name, user_id } = req.body;

  const count = await Status.countDocuments({ repo_id });

  const status = await Status.create({
    repo_id,
    name,
    created_by: user_id,
    order: count + 1
  });

  res.json(status);
});

//usuwanie statusu
app.delete("/api/statuses/:statusId", async (req, res) => {
  const status = await Status.findById(req.params.statusId);

  if (!status) return res.status(404).send("Status not found");

  if (status.is_default)
    return res.status(400).send("Cannot delete default status");

  await status.deleteOne();

  res.sendStatus(200);
});



app.listen(3000, () => console.log("Server running on http://localhost:3000"));
