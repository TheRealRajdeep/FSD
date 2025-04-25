import express from "express";
import Evaluation from "../models/Evaluation.js";
import Project from "../models/Project.js";
import { protect, authorize } from "../middleware/auth.js";
import multer from "multer";
import xlsx from "xlsx";
import User from "../models/User.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx) are allowed"), false);
    }
  },
});

// @route   POST /api/evaluations
// @desc    Create a new evaluation
// @access  Private (Faculty only)
router.post("/", protect, authorize("faculty"), async (req, res) => {
  try {
    const { projectId, evaluationType, dueDate, rubricItems } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Create evaluation
    const evaluation = await Evaluation.create({
      project: projectId,
      team: project.team,
      evaluationType,
      dueDate,
      rubricItems,
    });

    res.status(201).json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/evaluations/excel-upload
// @desc    Create evaluation from Excel file
// @access  Private (Faculty only)
router.post(
  "/excel-upload",
  protect,
  authorize("faculty"),
  upload.single("excelFile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get evaluation type from request body, default to milestone
      const evaluationType = req.body.evaluationType || "milestone";

      // Validate evaluation type
      if (!["milestone", "final"].includes(evaluationType)) {
        return res.status(400).json({ message: "Invalid evaluation type" });
      }

      // Read Excel file
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      // Group data by project name
      const projectGroups = {};
      data.forEach((row) => {
        const projectName = row.ProjectName;
        if (!projectName) {
          return; // Skip rows without project name
        }

        if (!projectGroups[projectName]) {
          projectGroups[projectName] = [];
        }
        projectGroups[projectName].push(row);
      });

      if (Object.keys(projectGroups).length === 0) {
        return res
          .status(400)
          .json({ message: "No valid project data found in Excel file" });
      }

      // Process each project group
      const projectResults = [];
      for (const projectName of Object.keys(projectGroups)) {
        const projectData = projectGroups[projectName];

        // Find project by name
        const project = await Project.findOne({ title: projectName });
        if (!project) {
          projectResults.push({
            projectName,
            error: `Project "${projectName}" not found in the database`,
          });
          continue;
        }

        // Extract evaluation criteria from headers (exclude project identifiers)
        const criteriaColumns = Object.keys(projectData[0]).filter(
          (key) => key !== "ProjectName"
        );

        // Update the default criteria array
        const defaultCriteria = [
          { name: "Implementation Demonstration", maxScore: 20 },
          { name: "Project Recognition", maxScore: 10 },
          { name: "Black Book Draft", maxScore: 5 },
          { name: "Presentation Quality", maxScore: 5 },
          { name: "Contribution & Punctuality", maxScore: 5 },
        ];

        // Use criteria from Excel if available, otherwise use default criteria
        const finalCriteria =
          criteriaColumns.length > 0
            ? criteriaColumns
                .map((col) => {
                  // Match the column name to a default criterion if possible, excluding ProjectName, StudentName, SAPId
                  if (
                    col === "ProjectName" ||
                    col === "StudentName" ||
                    col === "SAPId"
                  ) {
                    return null;
                  }

                  const matchedCriterion = defaultCriteria.find(
                    (c) => c.name.toLowerCase() === col.toLowerCase()
                  );
                  return {
                    name: col,
                    maxScore: matchedCriterion ? matchedCriterion.maxScore : 5, // Default to 5 if no match
                  };
                })
                .filter(Boolean) // Remove null entries
            : defaultCriteria;

        // Create rubric items with scores from Excel
        const rubricItems = finalCriteria.map((criterionObj) => {
          const criterion = criterionObj.name;
          const maxScore = criterionObj.maxScore;

          // Update: Both faculty and reviewer can give full max score
          const facultyMaxScore = maxScore; // Changed from maxScore/2
          const reviewerMaxScore = maxScore; // Changed from maxScore/2

          // Initialize faculty score values
          const facultyScore = {
            value: null,
            submittedBy: req.user._id,
            submittedAt: Date.now(),
            comments: "",
            locked: false,
          };

          // If scores exist in Excel for the first row (project level), use them
          if (
            projectData[0] &&
            projectData[0][criterion] !== undefined &&
            projectData[0][criterion] !== null &&
            projectData[0][criterion] !== ""
          ) {
            const score = parseFloat(projectData[0][criterion]);
            if (!isNaN(score)) {
              // Validate and set the score - cap at facultyMaxScore
              const validScore = Math.min(Math.max(0, score), facultyMaxScore);
              facultyScore.value = validScore;
              facultyScore.comments = "Imported from Excel";
              facultyScore.locked = true; // Pre-filled scores are locked
            }
          }

          return {
            criterion,
            description: `Evaluation for ${criterion}`,
            maxScore,
            facultyMaxScore,
            reviewerMaxScore,
            facultyScore,
          };
        });

        // Create evaluation with the specified type
        const evaluation = await Evaluation.create({
          project: project._id,
          team: project.team,
          evaluationType: evaluationType,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks default
          rubricItems,
          excelData: projectData,
          hasPrefilledScores: rubricItems.some(
            (item) =>
              item.facultyScore.value !== null && item.facultyScore.locked
          ),
        });

        projectResults.push({
          projectName,
          evaluationId: evaluation._id,
          success: true,
          hasPrefilledScores: evaluation.hasPrefilledScores,
        });
      }

      res.status(201).json({ projectResults });
    } catch (error) {
      console.error(error);
      if (error.message === "Only Excel files (.xlsx) are allowed") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/evaluations
// @desc    Get all evaluations
// @access  Private (Faculty and Reviewers)
router.get("/", protect, authorize("faculty", "reviewer"), async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .populate("project", "title status")
      .populate("team", "name")
      .sort({ createdAt: -1 });

    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/evaluations/team/:teamId
// @desc    Get evaluations for a team
// @access  Private (Students in the team, Faculty, Reviewers)
router.get("/team/:teamId", protect, async (req, res) => {
  try {
    // For students, check if they are part of the team
    if (req.user.role === "student") {
      if (req.user.team.toString() !== req.params.teamId) {
        return res.status(403).json({
          message: "Access denied. You are not a member of this team",
        });
      }
    }

    const evaluations = await Evaluation.find({ team: req.params.teamId })
      .populate("project", "title status")
      .sort({ createdAt: -1 });

    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/evaluations/:id
// @desc    Get evaluation by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate("project", "title description status")
      .populate("team", "name members");

    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    // For students, check if they are part of the team
    if (req.user.role === "student") {
      if (req.user.team.toString() !== evaluation.team._id.toString()) {
        return res.status(403).json({
          message: "Access denied. You are not a member of this team",
        });
      }
    }

    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/evaluations/:id/faculty-score
// @desc    Submit faculty scores
// @access  Private (Faculty only)
router.put(
  "/:id/faculty-score",
  protect,
  authorize("faculty"),
  async (req, res) => {
    try {
      const { rubricScores, evaluationType } = req.body;

      const evaluation = await Evaluation.findById(req.params.id);

      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      // Check if faculty already submitted
      if (evaluation.facultySubmitted) {
        return res
          .status(400)
          .json({ message: "Faculty scores already submitted" });
      }

      // Validate scores against max score before updating
      const invalidScores = [];
      rubricScores.forEach((score) => {
        const rubricItem = evaluation.rubricItems.id(score.itemId);
        if (rubricItem && score.value > rubricItem.facultyMaxScore) {
          invalidScores.push({
            criterion: rubricItem.criterion,
            maxScore: rubricItem.facultyMaxScore,
            submittedScore: score.value,
          });
        }
      });

      // If any scores exceed their max, reject the submission
      if (invalidScores.length > 0) {
        return res.status(400).json({
          message: "Some scores exceed the maximum allowed value",
          invalidScores,
        });
      }

      // Update evaluation type if provided and valid
      if (
        evaluationType &&
        ["milestone", "final", "excel-based"].includes(evaluationType)
      ) {
        evaluation.evaluationType = evaluationType;
      }

      // Update rubric items with faculty scores (without comments)
      rubricScores.forEach((score) => {
        const rubricItem = evaluation.rubricItems.id(score.itemId);

        if (rubricItem) {
          rubricItem.facultyScore = {
            value: score.value,
            submittedBy: req.user._id,
            submittedAt: Date.now(),
            locked: true,
          };
        }
      });

      evaluation.facultySubmitted = true;

      // Update status
      if (evaluation.reviewerSubmitted) {
        evaluation.status = "completed";
      } else {
        evaluation.status = "faculty-evaluated";
      }

      await evaluation.save();

      res.json(evaluation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/evaluations/:id/reviewer-score
// @desc    Submit reviewer scores
// @access  Private (Reviewers only)
router.put(
  "/:id/reviewer-score",
  protect,
  authorize("reviewer"),
  async (req, res) => {
    try {
      const { rubricScores } = req.body;

      const evaluation = await Evaluation.findById(req.params.id);

      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      // Check if reviewer already submitted
      if (evaluation.reviewerSubmitted) {
        return res
          .status(400)
          .json({ message: "Reviewer scores already submitted" });
      }

      // Check if faculty has submitted first
      if (!evaluation.facultySubmitted) {
        return res
          .status(400)
          .json({ message: "Faculty must submit scores before reviewer" });
      }

      // Validate scores against max score before updating
      const invalidScores = [];
      rubricScores.forEach((score) => {
        const rubricItem = evaluation.rubricItems.id(score.itemId);
        if (rubricItem && score.value > rubricItem.reviewerMaxScore) {
          invalidScores.push({
            criterion: rubricItem.criterion,
            maxScore: rubricItem.reviewerMaxScore,
            submittedScore: score.value,
          });
        }
      });

      // If any scores exceed their max, reject the submission
      if (invalidScores.length > 0) {
        return res.status(400).json({
          message: "Some scores exceed the maximum allowed value",
          invalidScores,
        });
      }

      // Update rubric items with reviewer scores (without comments)
      rubricScores.forEach((score) => {
        const rubricItem = evaluation.rubricItems.id(score.itemId);

        if (rubricItem) {
          rubricItem.reviewerScore = {
            value: score.value,
            submittedBy: req.user._id,
            submittedAt: Date.now(),
            locked: true,
          };
        }
      });

      evaluation.reviewerSubmitted = true;

      // Update status
      evaluation.status = "completed";

      await evaluation.save();

      res.json(evaluation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
