import express from 'express';
import multer from 'multer';
import path from 'path';
import ResearchPaper from '../models/ResearchPaper.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files will be stored in the "uploads/papers" directory.
    // Ensure this directory exists or create it manually.
    cb(null, 'uploads/papers');
  },
  filename: (req, file, cb) => {
    // Create a unique file name with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `paper-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// @route   POST /api/papers
// @desc    Upload a new research paper
// @access  Private (Students only)
router.post('/', protect, authorize('student'), upload.single('paper'), async (req, res) => {
  try {
    const { title, abstract, keywords } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // Save the local file path instead of an S3 location
    const paper = await ResearchPaper.create({
      title,
      abstract,
      authors: [req.user._id],
      team: req.user.team,
      project: req.body.projectId,
      paperUrl: req.file.path, // Local file path
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : []
    });

    res.status(201).json(paper);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/papers
// @desc    Get all research papers (faculty/reviewer) or team papers (students)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let papers;
    
    if (['faculty', 'reviewer'].includes(req.user.role)) {
      papers = await ResearchPaper.find()
        .populate('authors', 'name sapId')
        .populate('team', 'name')
        .populate('project', 'title')
        .sort('-createdAt');
    } else {
      papers = await ResearchPaper.find({ team: req.user.team })
        .populate('authors', 'name sapId')
        .populate('project', 'title')
        .sort('-createdAt');
    }

    res.json(papers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/papers/:id/feedback
// @desc    Submit feedback for a paper
// @access  Private (Faculty and Reviewers)
router.post('/:id/feedback', protect, authorize('faculty', 'reviewer'), async (req, res) => {
  try {
    const { comments } = req.body;
    const paper = await ResearchPaper.findById(req.params.id);

    if (!paper) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    if (req.user.role === 'faculty') {
      paper.facultyFeedback = {
        comments,
        submittedBy: req.user._id,
        submittedAt: Date.now()
      };
    } else {
      paper.reviewerFeedback = {
        comments,
        submittedBy: req.user._id,
        submittedAt: Date.now()
      };
    }

    // Optionally update status if both feedbacks are present
    if (paper.facultyFeedback && paper.reviewerFeedback) {
      paper.status = 'under-review';
    }

    await paper.save();
    res.json(paper);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
