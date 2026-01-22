import express from "express";
import Status from "../models/Status.js";
import IssueStatus from "../models/IssueStatus.js";

const router = express.Router();

// Pobieranie statusów dla repozytorium
router.get("/:repoId", async (req, res) => {
  try {
    const statuses = await Status.find({ repo_id: req.params.repoId }).sort({ order: 1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching statuses" });
  }
});

// Tworzenie domyślnych statusów
router.post("/default", async (req, res) => {
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

    const created = await Status.insertMany(defaults.map((s) => ({ ...s, repo_id })));
    res.status(201).json({ message: "Default statuses created", statuses: created });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Dodawanie nowego statusu
router.post("/", async (req, res) => {
  try {
    const { repo_id, name, user_id } = req.body;
    if (!repo_id || !name) return res.status(400).json("Missing required fields");

    const exists = await Status.findOne({
      repo_id,
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (exists) return res.status(400).json("A status with this name already exists");

    const count = await Status.countDocuments({ repo_id });
    const status = await Status.create({
      repo_id,
      name,
      created_by: user_id || null,
      order: count + 1,
    });

    res.json(status);
  } catch (err) {
    res.status(500).json("Server error");
  }
});

// Edycja nazwy statusu
router.put("/:statusId", async (req, res) => {
  try {
    const { name } = req.body;
    const status = await Status.findById(req.params.statusId);
    if (!status) return res.status(404).json({ message: "Status not found" });

    status.name = name.trim();
    await status.save();
    res.json({ message: "Status updated", status });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Zmiana kolejności (move left/right)
router.put("/:repoId/:statusId/move", async (req, res) => {
  const { direction } = req.body;
  const { repoId, statusId } = req.params;

  try {
    const status = await Status.findById(statusId);
    const statuses = await Status.find({ repo_id: repoId }).sort({ order: 1 });

    if (direction === "left" && status.order > 1) {
      const target = statuses.find((s) => s.order === status.order - 1);
      if (target) { target.order += 1; await target.save(); }
      status.order -= 1;
      await status.save();
    } else if (direction === "right" && status.order < statuses.length) {
      const target = statuses.find((s) => s.order === status.order + 1);
      if (target) { target.order -= 1; await target.save(); }
      status.order += 1;
      await status.save();
    }
    res.json({ message: "Moved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error moving status" });
  }
});

// Usuwanie statusu
router.delete("/:statusId", async (req, res) => {
  try {
    const { repo_id } = req.body;
    const { statusId } = req.params;

    const statusToDelete = await Status.findById(statusId);
    if (!statusToDelete) return res.status(404).send("Status not found");

    let targetStatus = await Status.findOne({ repo_id, _id: { $ne: statusId } }).sort({ order: 1 });
    if (!targetStatus) return res.status(400).send("Cannot delete the only status");

    await IssueStatus.updateMany({ status_id: statusId }, { $set: { status_id: targetStatus._id } });

    const deletedOrder = statusToDelete.order;
    await statusToDelete.deleteOne();

    await Status.updateMany({ repo_id, order: { $gt: deletedOrder } }, { $inc: { order: -1 } });

    res.json({ targetStatusId: targetStatus._id });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

export default router;