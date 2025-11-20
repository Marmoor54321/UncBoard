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
  const repo_id = req.query.repo_id; 

  try {
    // issue z GitHuba
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      { headers: { Authorization: `token ${token}` } }
    );

    const githubIssues = response.data;

    // wszystkie statusy repo
    const statuses = await Status.find({ repo_id });
    const defaultStatus = statuses.find(s => s.order === 1);

    // powiązania z IssueStatus
    const existing = await IssueStatus.find({ repo_id });

    //  brakujące wpisy w IssueStatus
    const newStatuses = [];
    for (const issue of githubIssues) {
      const already = existing.find(e => e.issue_id === issue.id);
      if (!already) {
        newStatuses.push({
          repo_id,
          issue_id: issue.id,
          status_id: defaultStatus._id, // domyślny status -  order 1
        });
      }
    }

    if (newStatuses.length > 0) {
      await IssueStatus.insertMany(newStatuses);
      console.log(`Added ${newStatuses.length} new issue-status records.`);
    }

    // aktualne przypisania (po ewentualnym dodaniu)
    const issueStatuses = await IssueStatus.find({ repo_id }).populate("status_id");

    // statusy do issue
    const issuesWithStatus = githubIssues.map(issue => {
      const status = issueStatuses.find(s => s.issue_id === issue.id);
      return {
        ...issue,
        status: status ? status.status_id.order : 1,
      };
    });

    res.json(issuesWithStatus);

  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch issues");
  }
});

app.put("/api/issue-status", async (req, res) => {
  try {
    const { issue_id, repo_id, status_id } = req.body
    if (!issue_id || !repo_id || !status_id)
      return res.status(400).json({ message: "Missing fields" })

    let issueStatus = await IssueStatus.findOne({ issue_id, repo_id })
    if (issueStatus) {
      issueStatus.status_id = status_id
      issueStatus.updated_at = new Date()
      await issueStatus.save()
    } else {
      issueStatus = await IssueStatus.create({ issue_id, repo_id, status_id })
    }

    res.json({ message: "Issue status updated", issueStatus })
  } catch (err) {
    console.error("Error updating issue status:", err)
    res.status(500).json({ message: "Server error" })
  }
})


//endpoints dla statusów

//pobieranie statusów dla repozytorium
app.get("/api/statuses/:repoId", async (req, res) => {
  const statuses = await Status.find({ repo_id: req.params.repoId }).sort({ order: 1 });
  res.json(statuses);
});

//zmiana kolejności statusów
app.put("/api/statuses/:repoId/:statusId/move", async (req, res) => {
  const { direction } = req.body; // 'left' 'right'
  const { repoId, statusId } = req.params;

  if (!["left", "right"].includes(direction)) {
    return res.status(400).json({ message: "Invalid direction. Use 'left' or 'right'." });
  }

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    const statuses = await Status.find({ repo_id: repoId }).sort({ order: 1 });

    const minOrder = statuses[0]?.order ?? 0;
    const maxOrder = statuses[statuses.length - 1]?.order ?? 0;

    if (direction === "left") {
      if (status.order === minOrder) {
        return res.status(400).json({ message: "Cannot move left. Already at the first position." });
      }

      const target = statuses.find(s => s.order === status.order - 1);
      if (target) {
        target.order += 1;
        await target.save();
      }

      status.order -= 1;
      await status.save();

      return res.json({ message: "Moved left successfully", status });
    }

    if (direction === "right") {
      if (status.order === maxOrder) {
        return res.status(400).json({ message: "Cannot move right. Already at the last position." });
      }

      const target = statuses.find(s => s.order === status.order + 1);
      if (target) {
        target.order -= 1;
        await target.save();
      }

      status.order += 1;
      await status.save();

      return res.json({ message: "Moved right successfully", status });
    }
  } catch (err) {
    console.error("Error updating status order:", err);
    return res.status(500).json({ message: "Server error" });
  }
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
  try {
    console.log(res.body);
    const { repo_id } = req.body;
    const { statusId } = req.params;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).send("Status not found");

    const firstStatus = await Status
      .findOne({ repo_id })
      .sort({ order: 1 }); // najmniejszy order

    if (!firstStatus)
      return res.status(400).send("No available status to assign issues to");

    //Zavezpieczneie jesli usuwany status jest pierwszy
    let targetStatus = firstStatus;
    if (String(firstStatus._id) === String(statusId)) {
      targetStatus = await Status
        .findOne({ repo_id, _id: { $ne: statusId } }) //$ne not equal żeby pominął samego siebie
        .sort({ order: 1 });

      if (!targetStatus)
        return res.status(400).send("Cannot delete the only status in repo");
    }

    await IssueStatus.updateMany(
      { status_id: statusId },
      { $set: { status_id: targetStatus._id } } //Przypisanie nowego status id dla issues
    );
    const deletedOrder = status.order;
    await status.deleteOne();
    await Status.updateMany(
      { repo_id, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );
    res.json({ targetStatusId: targetStatus._id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// edycja nazwy statusu
app.put("/api/statuses/:statusId", async (req, res) => {
  try {
    const { statusId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    status.name = name.trim();
    await status.save();

    res.json({ message: "Status updated", status });
  } catch (err) {
    console.error("Error updating status name:", err);
    res.status(500).json({ message: "Server error" });
  }
});



app.listen(3000, () => console.log("Server running on http://localhost:3000"));
