import express from 'express';
import Evaluation from '../models/Evaluation.js';
import Project from '../models/Project.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/evaluations
// @desc    Create a new evaluation
// @access  Private (Faculty only)
router.post('/', protect, authorize('faculty'), async (req, res) => {
  try {
    const { projectId, evaluationType, dueDate, rubricItems } = req.body;
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Create evaluation
    const evaluation = await Evaluation.create({
      project: projectId,
      team: project.team,
      evaluationType,
      dueDate,
      rubricItems
    });
    
    res.status(201).json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/evaluations
// @desc    Get all evaluations
// @access  Private (Faculty and Reviewers)
router.get('/', protect, authorize('faculty', 'reviewer'), async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .populate('project', 'title status')
      .populate('team', 'name')
      .sort({ createdAt: -1 });
    
    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/evaluations/team/:teamId
// @desc    Get evaluations for a team
// @access  Private (Students in the team, Faculty, Reviewers)
router.get('/team/:teamId', protect, async (req, res) => {
  try {
    // For students, check if they are part of the team
    if (req.user.role === 'student') {
      if (req.user.team.toString() !== req.params.teamId) {
        return res.status(403).json({ message: 'Access denied. You are not a member of this team' });
      }
    }
    
    const evaluations = await Evaluation.find({ team: req.params.teamId })
      .populate('project', 'title status')
      .sort({ createdAt: -1 });
    
    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/evaluations/:id
// @desc    Get evaluation by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('project', 'title description status')
      .populate('team', 'name members');
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    // For students, check if they are part of the team
    if (req.user.role === 'student') {
      if (req.user.team.toString() !== evaluation.team._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You are not a member of this team' });
      }
    }
    
    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/evaluations/:id/faculty-score
// @desc    Submit faculty scores
// @access  Private (Faculty only)
router.put('/:id/faculty-score', protect, authorize('faculty'), async (req, res) => {
  try {
    const { rubricScores } = req.body;
    
    const evaluation = await Evaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    // Check if faculty already submitted
    if (evaluation.facultySubmitted) {
      return res.status(400).json({ message: 'Faculty scores already submitted' });
    }
    
    // Update rubric items with faculty scores
    rubricScores.forEach(score => {
      const rubricItem = evaluation.rubricItems.id(score.itemId);
      
      if (rubricItem) {
        rubricItem.facultyScore = {
          value: score.value,
          submittedBy: req.user._id,
          submittedAt: Date.now(),
          comments: score.comments,
          locked: true
        };
      }
    });
    
    evaluation.facultySubmitted = true;
    
    // Update status
    if (evaluation.reviewerSubmitted) {
      evaluation.status = 'completed';
    } else {
      evaluation.status = 'faculty-evaluated';
    }
    
    await evaluation.save();
    
    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/evaluations/:id/reviewer-score
// @desc    Submit reviewer scores
// @access  Private (Reviewers only)
router.put('/:id/reviewer-score', protect, authorize('reviewer'), async (req, res) => {
  try {
    const { rubricScores } = req.body;
    
    const evaluation = await Evaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    // Check if reviewer already submitted
    if (evaluation.reviewerSubmitted) {
      return res.status(400).json({ message: 'Reviewer scores already submitted' });
    }
    
    // Update rubric items with reviewer scores
    rubricScores.forEach(score => {
      const rubricItem = evaluation.rubricItems.id(score.itemId);
      
      if (rubricItem) {
        rubricItem.reviewerScore = {
          value: score.value,
          submittedBy: req.user._id,
          submittedAt: Date.now(),
          comments: score.comments,
          locked: true
        };
      }
    });
    
    evaluation.reviewerSubmitted = true;
    
    // Update status
    if (evaluation.facultySubmitted) {
      evaluation.status = 'completed';
    } else {
      evaluation.status = 'reviewer-evaluated';
    }
    
    await evaluation.save();
    
    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;