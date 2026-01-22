import express from "express";
import axios from "axios";
import { createGitHubEndpoint } from "../utils/githubEndpoint.js";

const router = express.Router();

// Pobieranie repozytoriów użytkownika
createGitHubEndpoint(router, "/repos", "GET", () => "/user/repos");

// Pobieranie kolaboratorów, labeli i milestone'ów (pojedynczo)
createGitHubEndpoint(router, "/repos/collaborators", "GET", (req) => `/repos/${req.query.owner}/${req.query.repo}/collaborators`);
createGitHubEndpoint(router, "/repos/labels", "GET", (req) => `/repos/${req.query.owner}/${req.query.repo}/labels`);
createGitHubEndpoint(router, "/repos/milestones", "GET", (req) => `/repos/${req.query.owner}/${req.query.repo}/milestones`);

// Zbiorczy endpoint danych repozytorium (repo-data)
router.get("/repo-data", async (req, res) => {
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

export default router;