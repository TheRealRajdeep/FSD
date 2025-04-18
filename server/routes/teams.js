import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Team from "../models/Team.js";
import { protect, authorize } from "../middleware/auth.js";
import { uploadLogo } from "../middleware/upload.js";

const router = express.Router();

// @route   POST /api/teams
// @desc    Create a new team
// @access  Private
router.post("/", protect, uploadLogo.single("logo"), async (req, res) => {
  try {
    // Check if user already has a team
    const existingUserTeam = await User.findById(req.user._id).select("team");
    if (existingUserTeam.team) {
      return res
        .status(400)
        .json({ message: "You are already part of a team" });
    }

    // Parse fields that might be sent as JSON strings
    let techStack = [];
    let lookingFor = [];

    if (req.body.techStack) {
      try {
        techStack = JSON.parse(req.body.techStack);
      } catch (e) {
        // If parsing fails, check if it's already an array
        techStack = Array.isArray(req.body.techStack)
          ? req.body.techStack
          : [req.body.techStack];
      }
    }

    if (req.body.lookingFor) {
      try {
        lookingFor = JSON.parse(req.body.lookingFor);
      } catch (e) {
        // If parsing fails, check if it's already an array
        lookingFor = Array.isArray(req.body.lookingFor)
          ? req.body.lookingFor
          : [req.body.lookingFor];
      }
    }

    // Generate a unique team code
    const teamCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Create the team
    const team = new Team({
      name: req.body.name,
      description: req.body.description,
      maxMembers: req.body.maxMembers,
      leader: req.user._id,
      members: [req.user._id],
      projectIdea: req.body.projectIdea,
      techStack,
      lookingFor,
      githubUrl: req.body.githubUrl,
      teamCode,
    });

    // Handle logo upload if present
    if (req.file) {
      team.logo = req.file.path;
    }

    await team.save();

    // Update user's team
    await User.findByIdAndUpdate(req.user._id, { team: team._id });

    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/teams
// @desc    Get all teams
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("leader", "name sapId email")
      .populate("members", "name sapId email")
      .populate("project", "title status");

    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/teams/:id
// @desc    Get team by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("leader", "name sapId email")
      .populate("members", "name sapId email")
      .populate("project", "title description status");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/teams/:id/join
// @desc    Join a team
// @access  Private (Students only)
router.post("/:id/join", protect, authorize("student"), async (req, res) => {
  try {
    // Check if user is already in a team
    const user = await User.findById(req.user._id);
    if (user.team) {
      return res
        .status(400)
        .json({ message: "You are already a member of a team" });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if team is open for new members
    if (!team.isOpen) {
      return res
        .status(400)
        .json({ message: "This team is not accepting new members" });
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ message: "Team is already full" });
    }

    // Check if user is already a member
    if (team.members.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You are already a member of this team" });
    }

    // Add user to team
    team.members.push(req.user._id);
    await team.save();

    // Update user's team
    await User.findByIdAndUpdate(req.user._id, { team: team._id });

    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/teams/:id/leave
// @desc    Leave a team
// @access  Private (Students only)
router.post("/:id/leave", protect, authorize("student"), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is a member
    if (!team.members.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You are not a member of this team" });
    }

    // Check if user is the leader
    if (team.leader.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message:
          "Team leader cannot leave the team. Transfer leadership first or delete the team.",
      });
    }

    // Remove user from team
    team.members = team.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );
    await team.save();

    // Update user's team
    await User.findByIdAndUpdate(req.user._id, { team: null });

    res.json({ message: "Successfully left the team" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/teams/:id
// @desc    Update team
// @access  Private (Team leader only)
router.put("/:id", protect, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is the team leader
    if (team.leader.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only team leader can update team details" });
    }

    const { name, description, isOpen } = req.body;

    // Update team
    team.name = name || team.name;
    team.description = description || team.description;
    team.isOpen = isOpen !== undefined ? isOpen : team.isOpen;

    await team.save();

    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/teams/join-by-code
// @desc    Join a team using team code
// @access  Private (Students only)
router.post(
  "/join-by-code",
  protect,
  authorize("student"),
  async (req, res) => {
    try {
      const { teamCode } = req.body;

      // Check if user is already in a team
      const user = await User.findById(req.user._id);
      if (user.team) {
        return res
          .status(400)
          .json({ message: "You are already a member of a team" });
      }

      // Find team by code
      const team = await Team.findOne({ teamCode });
      if (!team) {
        return res.status(404).json({ message: "Invalid team code" });
      }

      // Check if team is open for new members
      if (!team.isOpen) {
        return res
          .status(400)
          .json({ message: "This team is not accepting new members" });
      }

      // Check if team is full
      if (team.members.length >= team.maxMembers) {
        return res.status(400).json({ message: "Team is already full" });
      }

      // Add user to team
      team.members.push(req.user._id);
      await team.save();

      // Update user's team
      await User.findByIdAndUpdate(req.user._id, { team: team._id });

      res.json(team);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
