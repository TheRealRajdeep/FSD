import mongoose from 'mongoose';

const ResearchPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  abstract: {
    type: String,
    required: true
  },
  authors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  paperUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under-review', 'accepted', 'rejected'],
    default: 'pending'
  },
  facultyFeedback: {
    comments: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date
  },
  reviewerFeedback: {
    comments: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date
  },
  keywords: [String],
  submissionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const ResearchPaper = mongoose.model('ResearchPaper', ResearchPaperSchema);

export default ResearchPaper;