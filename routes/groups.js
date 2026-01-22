import express from "express";
import Group from "../models/Group.js";

const router = express.Router();

// Tworzenie grupy
router.post("/create", async (req, res) => {
  try {
    const { name, repo_ids, created_by } = req.body;
    if (!name || !created_by) return res.status(400).json({ message: "Missing required fields" });

    const existing = await Group.findOne({ name, created_by });
    if (existing) return res.status(400).json({ message: "Group with this name already exists" });

    const group = new Group({ name, repo_ids: repo_ids || [], created_by });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pobieranie grup użytkownika
router.get("/:ownerId", async (req, res) => {
  try {
    const groups = await Group.find({ created_by: req.params.ownerId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Usuwanie grupy
router.delete("/:groupId/delete", async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.groupId);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dodawanie repozytorium do grupy
router.post("/:groupId/add-repo", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.repo_ids.includes(req.body.repo_id)) {
      return res.status(400).json({ message: "Repo already in the group" });
    }
    group.repo_ids.push(req.body.repo_id);
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Usuwanie repozytorium z grupy
router.post("/:groupId/remove-repo", async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    
    group.repo_ids = group.repo_ids.filter(id => id !== Number(req.body.repo_id));
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;