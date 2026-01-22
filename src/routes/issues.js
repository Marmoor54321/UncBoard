import express from "express";
import axios from "axios";
import Status from "../models/Status.js";
import IssueStatus from "../models/IssueStatus.js";

const router = express.Router();

// Pobieranie issue z GitHub + synchronizacja ze statusami w DB
router.get("/:owner/:repo", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).send("Not authenticated");

  const { owner, repo } = req.params;
  const repo_id = req.query.repo_id;

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
      { headers: { Authorization: `token ${token}` } }
    );

    const githubIssues = response.data;
    const statuses = await Status.find({ repo_id });
    const defaultStatus = statuses.find((s) => s.order === 1);
    const existing = await IssueStatus.find({ repo_id });

    const newStatuses = [];
    for (const issue of githubIssues) {
      const already = existing.find((e) => e.issue_id === issue.id);
      if (!already && defaultStatus) {
        newStatuses.push({
          repo_id,
          issue_id: issue.id,
          status_id: defaultStatus._id,
        });
      }
    }

    if (newStatuses.length > 0) {
      await IssueStatus.insertMany(newStatuses);
    }

    const issueStatuses = await IssueStatus.find({ repo_id }).populate("status_id");

    const issuesWithStatus = githubIssues.map((issue) => {
      const statusRecord = issueStatuses.find((s) => s.issue_id === issue.id);
      return {
        ...issue,
        status: statusRecord?.status_id?.order || 1,
        status_id: statusRecord?.status_id?._id || null,
      };
    });

    res.json(issuesWithStatus);
  } catch (err) {
    console.error("GitHub API error:", err.response?.data || err.message);
    res.status(500).send("Failed to fetch issues");
  }
});

// Tworzenie nowego issue na GitHub
router.post("/:owner/:repo", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { title, body = "", repo_id, status_id, assignees, labels, milestone } = req.body;
  const { owner, repo: repoName } = req.params;

  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
  if (!repo_id || !status_id) return res.status(400).json({ message: "repo_id and status_id are required" });

  try {
    const githubPayload = {
      title: title.trim(),
      body: body.trim() || undefined,
      assignees: assignees || [],
      labels: labels || [],
    };
    if (milestone) githubPayload.milestone = milestone;

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

    await IssueStatus.create({
      repo_id,
      issue_id: createdIssue.id,
      status_id: targetStatus._id,
    });

    res.status(201).json({
      ...createdIssue,
      status: targetStatus.name,
      status_id: targetStatus._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create issue", details: err.response?.data });
  }
});

// Uniwersalna aktualizacja Issue (PATCH)
router.patch("/:owner/:repo/:number", async (req, res) => {
  let token = req.session.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { owner, repo, number } = req.params;
  const { title, body, state, state_reason, milestone, labels, assignees } = req.body;

  const payload = {};
  if (title !== undefined) payload.title = title;
  if (body !== undefined) payload.body = body;
  if (state !== undefined) payload.state = state;
  if (state_reason !== undefined) payload.state_reason = state_reason;
  if (milestone !== undefined) payload.milestone = milestone;
  if (labels !== undefined) payload.labels = labels;
  if (assignees !== undefined) payload.assignees = assignees;

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
    res.status(500).json({ message: "Failed to update issue" });
  }
});

// Pobieranie osi czasu (timeline)
router.get("/:owner/:repo/:number/timeline", async (req, res) => {
  const token = req.session.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const { owner, repo, number } = req.params;
  try {
    const headers = { Authorization: `token ${token}`, Accept: "application/vnd.github+json" };
    const [commentsRes, eventsRes] = await Promise.all([
      axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`, { headers }),
      axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${number}/events`, { headers }),
    ]);

    const combined = [...commentsRes.data, ...eventsRes.data];
    combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    res.json(combined);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch timeline" });
  }
});

// Zarządzanie komentarzami (POST, PATCH, DELETE)
router.post("/:owner/:repo/:number/comments", async (req, res) => {
  const token = req.session.token || req.headers.authorization?.split(" ")[1];
  const { body } = req.body;
  const { owner, repo, number } = req.params;

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${number}/comments`,
      { body },
      { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
    );
    res.status(201).json(response.data);
  } catch (err) {
    res.status(500).json({ message: "Error adding comment" });
  }
});

router.patch("/:owner/:repo/comments/:commentId", async (req, res) => {
  const token = req.session.token || req.headers.authorization?.split(" ")[1];
  const { body } = req.body;
  const { owner, repo, commentId } = req.params;

  try {
    const response = await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`,
      { body },
      { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: "Error updating comment" });
  }
});

router.delete("/:owner/:repo/comments/:commentId", async (req, res) => {
  const token = req.session.token || req.headers.authorization?.split(" ")[1];
  const { owner, repo, commentId } = req.params;

  try {
    await axios.delete(
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`,
      { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
    );
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Error deleting comment" });
  }
});

export default router;