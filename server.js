import express from "express";
import axios from "axios";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(express.json());

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

//Redirect to GitHub
app.get("/auth/github", (req, res) => {
  const redirectUri = "http://localhost:3000/auth/github/callback";
  res.redirect(
   `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo,user,read:project,project`

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
  console.log(token);
  const res2 = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` },
  });
  console.log(res2.headers["x-oauth-scopes"]);
  
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

// get project items and columns 
app.get("/api/github/project-items/:owner/:repo", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { owner, repo } = req.params;

  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        projectsV2(first: 1) {
          nodes {
            id
            title
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
            items(first: 100) {
              nodes {
                id
                content {
                  ... on Issue {
                    id
                    number
                    title
                    body
                  }
                }
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    `;

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query },
      { headers: { Authorization: `bearer ${token}` } }
    );

    //console.log(JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error fetching project items");
  }
});




app.listen(3000, () => console.log("Server running on http://localhost:3000"));
