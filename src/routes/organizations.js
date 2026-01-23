import express from "express";
import Organization from "../models/Organization.js";
import User from "../models/User.js";

const router = express.Router();

// --- ZARZĄDZANIE ORGANIZACJĄ ---

// 1. Tworzenie nowej organizacji
router.post("/create", async (req, res) => {
  try {
    const { name, description, created_by } = req.body;

    if (!name || !created_by) {
      return res.status(400).json({ message: "Name and creator ID are required" });
    }

    // Sprawdź czy nazwa jest zajęta
    const existing = await Organization.findOne({ name });
    if (existing) return res.status(400).json({ message: "Organization name already taken" });

    const organization = new Organization({
      name,
      description,
      created_by,
      // Twórca automatycznie staje się właścicielem w tablicy members
      members: [{ user: created_by, role: "owner" }]
    });

    await organization.save();
    res.status(201).json(organization);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Pobieranie organizacji, do których należy użytkownik
router.get("/user/:userId", async (req, res) => {
  try {
    const orgs = await Organization.find({ 
      "members.user": req.params.userId 
    }).populate("members.user", "login avatar_url");
    
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Pobranie szczegółów konkretnej organizacji
router.get("/:orgId", async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId)
      .populate("members.user", "login avatar_url html_url");
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Usuwanie organizacji
router.delete("/:orgId", async (req, res) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.orgId);
    if (!org) return res.status(404).json({ message: "Organization not found" });
    
    res.status(200).json({ message: "Organization deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ZARZĄDZANIE CZŁONKAMI ---

// 4. Dodawanie członka do organizacji
router.post("/:orgId/members/add", async (req, res) => {
  try {
    const { user_id, role } = req.body; // role: 'admin' lub 'member'
    const org = await Organization.findById(req.params.orgId);

    if (!org) return res.status(404).json({ message: "Organization not found" });

    // Sprawdź czy użytkownik już tam jest
    const isMember = org.members.some(m => m.user.toString() === user_id);
    if (isMember) return res.status(400).json({ message: "User is already a member" });

    org.members.push({ user: user_id, role: role || "member" });
    await org.save();

    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Zmiana roli członka (np. z member na admin)
router.patch("/:orgId/members/role", async (req, res) => {
  try {
    const { user_id, new_role } = req.body;
    const org = await Organization.findById(req.params.orgId);

    const member = org.members.find(m => m.user.toString() === user_id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    member.role = new_role;
    await org.save();
    res.json({ message: "Role updated successfully", org });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Usuwanie członka
router.post("/:orgId/members/remove", async (req, res) => {
  try {
    const { user_id } = req.body;
    const org = await Organization.findById(req.params.orgId);

    org.members = org.members.filter(m => m.user.toString() !== user_id);
    await org.save();
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ZARZĄDZANIE REPOZYTORIAMI ---

// 7. Dodawanie repozytorium do organizacji
router.post("/:orgId/repos/add", async (req, res) => {
  try {
    const { repo_id } = req.body;
    const org = await Organization.findById(req.params.orgId);

    if (org.repo_ids.includes(repo_id)) {
      return res.status(400).json({ message: "Repo already exists in organization" });
    }

    org.repo_ids.push(repo_id);
    await org.save();
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Usuwanie repozytorium z organizacji
router.post("/:orgId/repos/remove", async (req, res) => {
  try {
    const { repo_id } = req.body;
    const org = await Organization.findById(req.params.orgId);

    org.repo_ids = org.repo_ids.filter(id => id !== Number(repo_id));
    await org.save();
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;