import express from 'express';
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Students - Team leaders only)
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    
    // Check if user is a team leader
    const team = await Team.findOne({ leader: req.user._id });
    
    if (!team) {
      return res.status(403).json({ message: 'Only team leaders can create projects' });
    }
    
    // Check if team already has a project
    if (team.project) {
      return res.status(400).json({ message: 'Your team already has a project' });
    }
    
    // Create project
    const project = await Project.create({
      title,
      description,
      team: team._id,
      startDate,
      endDate
    });
    
    // Update team with project reference
    await Team.findByIdAndUpdate(team._id, { project: project._id });
    
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private (Faculty and Reviewers)
router.get('/', protect, authorize('faculty', 'reviewer'), async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('team', 'name members leader')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/team
// @desc    Get project for user's team
// @access  Private (Students)
router.get('/team', protect, authorize('student'), async (req, res) => {
  try {
    // Get user's team
    const user = await User.findById(req.user._id).populate('team');
    
    if (!user.team) {
      return res.status(404).json({ message: 'You are not part of any team' });
    }
    
    // Get team's project
    const project = await Project.findOne({ team: user.team._id });
    
    if (!project) {
      return res.status(404).json({ message: 'Your team does not have a project yet' });
    }
    
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: 'team',
        populate: {
          path: 'members leader',
          select: 'name sapId email'
        }
      });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // For students, check if they are part of the team
    if (req.user.role === 'student') {
      const isTeamMember = project.team.members.some(
        member => member._id.toString() === req.user._id.toString()
      );
      
      if (!isTeamMember) {
        return res.status(403).json({ message: 'Access denied. You are not a member of this project team' });
      }
    }
    
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Team leader only)
router.put('/:id', protect, authorize('student'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the team leader
    const team = await Team.findById(project.team);
    
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can update project details' });
    }
    
    const { title, description, startDate, endDate } = req.body;
    
    // Update project
    project.title = title || project.title;
    project.description = description || project.description;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;
    
    await project.save();
    
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:id/document
// @desc    Add document to project
// @access  Private (Team members only)
router.post('/:id/document', protect, authorize('student'), async (req, res) => {
  try {
    const { title, fileUrl } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is a team member
    const team = await Team.findById(project.team);
    const isTeamMember = team.members.some(
      member => member.toString() === req.user._id.toString()
    );
    
    if (!isTeamMember) {
      return res.status(403).json({ message: 'Only team members can add documents' });
    }
    
    // Add document
    project.documents.push({
      title,
      fileUrl,
      uploadedAt: Date.now()
    });
    
    await project.save();
    
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;