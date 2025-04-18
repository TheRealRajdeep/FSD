import mongoose from 'mongoose';

const RubricItemSchema = new mongoose.Schema({
  criterion: {
    type: String,
    required: true
  },
  description: String,
  maxScore: {
    type: Number,
    required: true
  },
  facultyScore: {
    value: {
      type: Number,
      default: null
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    submittedAt: Date,
    comments: String,
    locked: {
      type: Boolean,
      default: false
    }
  },
  reviewerScore: {
    value: {
      type: Number,
      default: null
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    submittedAt: Date,
    comments: String,
    locked: {
      type: Boolean,
      default: false
    }
  }
});

const EvaluationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  evaluationType: {
    type: String,
    enum: ['milestone', 'final'],
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  rubricItems: [RubricItemSchema],
  facultySubmitted: {
    type: Boolean,
    default: false
  },
  reviewerSubmitted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'faculty-evaluated', 'reviewer-evaluated', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Evaluation = mongoose.model('Evaluation', EvaluationSchema);

export default Evaluation;