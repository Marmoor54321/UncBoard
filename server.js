import express from "express";
import axios from "axios";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

//Redirect to GitHub
app.get("/auth/github", (req, res) => {
  const redirectUri = "http://localhost:3000/auth/github/callback";
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo,user`
  );
});

//Handle callback + exchange for access token
app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;
  const tokenRes = await axios.post(
    `https://github.com/login/oauth/access_token`,
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    },
    { headers: { Accept: "application/json" } }
  );

  const accessToken = tokenRes.data.access_token;
  req.session.token = accessToken;
  res.redirect("http://localhost:5173/dashboard");
});

// Get GitHub user info
app.get("/api/github/user", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const userRes = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` },
  });
  res.json(userRes.data);
});

// Get user repos
app.get("/api/github/repos", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  try {
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `token ${token}` },
    });
    res.json(response.data);
  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch repositories");
  }
});



app.listen(3000, () => console.log("Server running on http://localhost:3000"));
