// routes/githubAuth.js
import express from "express";
import axios from "axios";

const router = express.Router();

export default function createGitHubRoutes(CLIENT_ID, CLIENT_SECRET) {
  // Redirect to GitHub
  router.get("/auth/github", (req, res) => {
    const redirectUri = "http://localhost:3000/auth/github/callback";
    res.redirect(
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo,user,read:project,project`
    );
  });

  // Callback + token exchange
  router.get("/auth/github/callback", async (req, res) => {
    const code = req.query.code;
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    req.session.token = tokenRes.data.access_token;
    res.redirect("http://localhost:5173/dashboard");
  });

  // GitHub user info
  router.get("/api/github/user", async (req, res) => {
    const token = req.session.token;
    if (!token) return res.status(401).send("Not authenticated");

    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${token}` },
      });
      res.json(response.data);
    } catch (err) {
      res.status(500).send("Failed to fetch user");
    }
  });

  // User repos
  router.get("/api/github/repos", async (req, res) => {
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

  return router;
}
