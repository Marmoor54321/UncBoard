import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import createGitHubRoutes from "./routes/githubAuth.js";
import Status from "./models/Status.js";
import IssueStatus from "./models/IssueStatus.js";
import Group from "./models/Group.js";
import { createGitHubEndpoint } from "./utils/githubEndpoint.js";
import http from "http";
import { Server } from "socket.io";
import Message from "./models/Message.js";



dotenv.config();
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL Twojego frontendu (Vite)
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

app.get("/api/chat/:orgId", async (req, res) => {
  try {
    const { orgId } = req.params;
    // Pobierz 50 ostatnich wiadomości dla danej organizacji
    const messages = await Message.find({ org_id: orgId })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json(messages.reverse()); // Zwracamy w kolejności chronologicznej
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera przy pobieraniu czatu" });
  }
});

// 3. Logika Socket.io (Komunikacja Real-time)
io.on("connection", (socket) => {
  console.log("⚡ Użytkownik połączony:", socket.id);

  // Użytkownik wchodzi do czatu konkretnej organizacji
  socket.on("join_room", (orgId) => {
    String(orgId)
    socket.join(orgId);
    console.log(`👤 Użytkownik dołączył do pokoju organizacji: ${orgId}`);
  });

  // Obsługa wysyłania wiadomości
  socket.on("send_message", async (data) => {
    const { org_id, sender, text } = data;
    const room = String(org_id);

    try {
      // Zapisz wiadomość w MongoDB
      const newMessage = new Message({
        org_id,
        sender,
        text
      });
      await newMessage.save();

      // Rozślij wiadomość do wszystkich w TYM SAMYM pokoju (organizacji)
      io.to(org_id).emit("receive_message", newMessage);
    } catch (err) {
      console.error("Błąd zapisu wiadomości:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Użytkownik rozłączony");
  });
});



createGitHubEndpoint(app, "/api/github/repos", "GET", () => "/user/repos");

// User repos
  // app.get("/api/github/repos", async (req, res) => {
  //   const token = req.session.token;
  //   if (!token) return res.status(401).send("Not authenticated");

  //   try {
  //     const response = await axios.get("https://api.github.com/user/repos", {
  //       headers: { Authorization: `token ${token}` },
  //     });
  //     res.json(response.data);
  //   } catch (err) {
  //     res.status(500).send("Failed to fetch repositories");
  //   }
  // });
  
  createGitHubEndpoint(
  app,
  "/api/github/repos/collaborators",
  "GET",
  (req) => `/repos/${req.query.owner}/${req.query.repo}/collaborators`
);

createGitHubEndpoint(
  app,
  "/api/github/repos/labels",
  "GET",
  (req) => `/repos/${req.query.owner}/${req.query.repo}/labels`
);

createGitHubEndpoint(
  app,
  "/api/github/repos/milestones",
  "GET",
  (req) => `/repos/${req.query.owner}/${req.query.repo}/milestones`
);

createGitHubEndpoint(
  app,
  "/api/github/user/orgs",
  "GET",
  () => "/user/orgs"
);

// createGitHubEndpoint(
//   app,
//   "/api/github/orgs/repos",
//   "GET",
//   (req) => {
//     const org = req.query.org;
//     console.log(req.query.org);
//     if (!org) throw { status: 400, message: "Organization name is required" };
//     // Dodajemy parametry: sortowanie po aktualizacji i limit 100
//     return `/orgs/${org}/repos?sort=updated&direction=desc&per_page=100`;
//   }
// );

app.get("/api/github/orgs/repos", async (req, res) => {
  const token = req.session.token;
  const org = req.query.org;

  if (!token) return res.status(401).send("Not authenticated");
  if (!org) return res.status(400).send("Organization name is required");

  try {
    const response = await axios.get(`https://api.github.com/orgs/${org}/repos?sort=updated&direction=desc&per_page=100`, {
      headers: { 
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json"
      },
    });

    // SPRAWDZANIE ID ORGANIZACJI:
    // Pobieramy ID z pierwszego lepszego repozytorium na liście
    if (response.data && response.data.length > 0) {
      const org_id = response.data[0].owner.id;
      console.log(`-----------------------------------`);
      console.log(`🏢 Organizacja: ${org}`);
      console.log(`🆔 ID Organizacji (org_id): ${org_id}`);
      console.log(`-----------------------------------`);
    } else {
      console.log(`⚠️ Organizacja ${org} nie ma repozytoriów lub nie mam do nich dostępu.`);
    }

    res.json(response.data);
  } catch (err) {
    console.error("Błąd podczas pobierania repozytoriów organizacji:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch organization repositories");
  }
});

createGitHubEndpoint(
  app,
  "/api/github/repos/assignees",
  "GET",
  (req) => `/repos/${req.query.owner}/${req.query.repo}/assignees`
);

  app.get("/api/github/repo-data", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { owner, repo } = req.query;
  if (!owner || !repo) return res.status(400).send("Missing owner or repo");

  const headers = { Authorization: `token ${token}` };

  try {
    const [collaborators, labels, milestones] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}/collaborators`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/labels`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/milestones`, { headers }),
    ]);

    res.json({
      collaborators: collaborators.data,
      labels: labels.data,
      milestones: milestones.data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch repository data");
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
  try {
    const { repo_id, name, user_id } = req.body;

    if (!repo_id || !name) {
      return res.status(400).json("Missing required fields");
    }

    // sprawdzenie duplikatu niezależnie od wielkości liter
    const exists = await Status.findOne({ 
      repo_id, 
      name: { $regex: `^${name}$`, $options: 'i' } 
    });

    if (exists) {
      return res.status(400).json("A status with this name already exists");
    }
    const count = await Status.countDocuments({ repo_id });

    const status = await Status.create({
      repo_id,
      name,
      created_by: user_id || null,
      order: count + 1
    });

    res.json(status);

  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
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



//CRUD dla grup
// tworzenie grupy
app.post("/api/group/create", async (req, res) => {
  try {
    const { name, repo_ids, created_by } = req.body;

    if (!name || !created_by) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // sprawdzenie czy już istnieje grupa o tej samej nazwie u tego samego użytkownika
    const existing = await Group.findOne({ name, created_by });
    if (existing) {
      return res.status(400).json({ message: "Group with this name already exists" });
    }

    const group = new Group({
      name,
      repo_ids: repo_ids || [],
      created_by
    });

    await group.save();
    res.status(201).json(group);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//pobieranie grup użytkownika
app.get("/api/groups/:ownerId", async (req, res) => {
  try { 
    const groups = await Group.find({ created_by: req.params.ownerId });
    res.json(groups);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
});

//usuwanie grupy
app.delete("/api/group/:groupId/delete", async (req, res) => { 
  try {
    await Group.findByIdAndDelete(req.params.groupId);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
});

//dodawanie repozytorium do grupy
app.post("/api/group/:groupId/add-repo", async (req, res) => {
  try {
    console.log("Group id ", req.params.groupId);
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if(group.repo_ids.includes(req.body.repo_id)){
      return res.status(500).json({message: "Repo already in the group"})
    }
    group.repo_ids.push(req.body.repo_id);
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//usuwanie repozytorium z grupy
app.post("/api/group/:groupId/remove-repo", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    const before = group.repo_ids.length;
    group.repo_ids = group.repo_ids.filter(id => id !== Number(req.body.repo_id));
     if (group.repo_ids.length === before) {
      return res.status(400).json({ message: "Repo not found in group" });
    }
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
});
app.post("/api/github/issues/:owner/:repo", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { title, body = "", repo_id, status_id, assignees, labels, milestone } = req.body;
  const { owner, repo: repoName } = req.params;

  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
  if (!repo_id || !status_id) return res.status(400).json({ message: "repo_id and status_id are required" });

  const githubPayload = {
    title: title.trim(),
    body: body.trim() || undefined,
    assignees: assignees || [], 
    labels: labels || [],
  };

  if (milestone) {
    githubPayload.milestone = milestone;
  }

  try {
    const githubResponse = await axios.post(
      `https://api.github.com/repos/${owner}/${repoName}/issues`,
      githubPayload,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const createdIssue = githubResponse.data;

    const targetStatus = await Status.findOne({ _id: status_id, repo_id });
    if (!targetStatus) {
      return res.status(400).json({ message: "Status not found for this repo" });
    }

    await IssueStatus.create({
      repo_id,
      issue_id: createdIssue.id,
      status_id: targetStatus._id,
    });

    const issueWithStatus = {
      ...createdIssue,
      status: targetStatus.name,
      status_id: targetStatus._id
    };

    console.log("Zwrócone issue ma status:", issueWithStatus.status);

    res.status(201).json(issueWithStatus);
  } catch (err) {
    console.error("Błąd GitHub API:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to create issue", details: err.response?.data });
  }
});

// Uniwersalny endpoint do aktualizacji Issue (Tytuł, Opis, Status, Labele, Milestone, Assignees)
app.patch("/api/github/issues/:owner/:repo/:number", async (req, res) => {
  let token = req.session.token;
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) return res.status(401).json({ message: "Not authenticated" });
  const { owner, repo, number } = req.params;
  
  // Wyciągamy wszystkie możliwe pola z body
  const { title, body, state, state_reason, milestone, labels, assignees } = req.body;

  // Budujemy dynamiczny obiekt payload - wyślemy do GitHub tylko to, co przysłał frontend
  const payload = {};
  if (title !== undefined) payload.title = title;
  if (body !== undefined) payload.body = body;
  if (state !== undefined) payload.state = state;             // 'open' lub 'closed'
  if (state_reason !== undefined) payload.state_reason = state_reason; // 'completed' lub 'not_planned'
  if (milestone !== undefined) payload.milestone = milestone; // numer milestone lub null
  if (labels !== undefined) payload.labels = labels;          // tablica stringów (np. ["bug"])
  if (assignees !== undefined) payload.assignees = assignees; // tablica stringów (np. ["johndoe"])

  // Sprawdzamy czy w ogóle jest co aktualizować
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "No valid fields provided for update" });
  }

  try {
    const response = await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${number}`,
      payload,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error updating issue:", err.response?.data || err.message);
    res.status(500).json({ 
      message: "Failed to update issue", 
      details: err.response?.data 
    });
  }
});
// Dodaj nowy komentarz do issue
app.post("/api/github/issues/:owner/:repo/:number/comments", async (req, res) => {
  let token = req.session.token;
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { owner, repo, number } = req.params;
  const { body } = req.body; 

  if (!body) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`,
      { body: body },
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    res.status(201).json(response.data);
  } catch (err) {
    console.error("Error creating comment:", err.response?.data || err.message);
    res.status(500).json({ 
      message: "Failed to create comment", 
      details: err.response?.data 
    });
  }
});

// Pobierz oś czasu issue (komentarze + wydarzenia)
app.get("/api/github/issues/:owner/:repo/:number/timeline", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { owner, repo, number } = req.params;

  try {
    const headers = { 
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json"
    };

    const [commentsRes, eventsRes] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${number}/events`, { headers })
    ]);

    const comments = commentsRes.data;
    const events = eventsRes.data;

    const combined = [...comments, ...events];
    combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json(combined);

  } catch (err) {
    console.error("Error fetching timeline:", err.response?.data || err.message);

    res.status(err.response?.status || 500).json({ message: "Failed to fetch timeline" });
  }
});

// Edytuj komentarz
app.patch("/api/github/issues/:owner/:repo/comments/:commentId", async (req, res) => {
  let token = req.session.token;
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { owner, repo, commentId } = req.params;
  const { body } = req.body; 

  if (!body) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  try {
    const response = await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`,
      { body: body },
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error updating comment:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ 
      message: "Failed to update comment", 
      details: err.response?.data 
    });
  }
});

// Usuń komentarz
app.delete("/api/github/issues/:owner/:repo/comments/:commentId", async (req, res) => {
  let token = req.session.token;
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { owner, repo, commentId } = req.params;

  try {
    await axios.delete(
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    res.status(204).send();
  } catch (err) {
    console.error("Error deleting comment:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ 
      message: "Failed to delete comment", 
      details: err.response?.data 
    });
  }
});

//app.listen(3000, () => console.log("Server running on http://localhost:3000"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
