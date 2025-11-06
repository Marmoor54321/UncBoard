import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import createGitHubRoutes from "./routes/githubAuth.js";


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

// Get repository issues
app.get("/api/github/issues/:owner/:repo", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { owner, repo } = req.params;

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch issues");
  }
});



app.listen(3000, () => console.log("Server running on http://localhost:3000"));
