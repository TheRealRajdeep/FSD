import mongoose from "mongoose";

const RubricItemSchema = new mongoose.Schema({
  criterion: {
    type: String,
    required: true,
  },
  description: String,
  maxScore: {
    type: Number,
    required: true,
  },
  facultyMaxScore: {
    type: Number,
    default: function () {
      return this.maxScore; // Changed: Faculty can give full max score
    },
  },
  reviewerMaxScore: {
    type: Number,
    default: function () {
      return this.maxScore; // Changed: Reviewer can give full max score
    },
  },
  facultyScore: {
    value: {
      type: Number,
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    submittedAt: Date,
    comments: String,
    locked: {
      type: Boolean,
      default: false,
    },
  },
  reviewerScore: {
    value: {
      type: Number,
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    submittedAt: Date,
    comments: String,
    locked: {
      type: Boolean,
      default: false,
    },
  },
});

const StudentScoreSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  sapId: String,
  criteriaScores: [
    {
      criterion: String,
      facultyScore: Number,
      reviewerScore: Number,
    },
  ],
});

const EvaluationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    evaluationType: {
      type: String,
      enum: ["milestone", "final", "excel-based"],
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    rubricItems: [RubricItemSchema],
    facultySubmitted: {
      type: Boolean,
      default: false,
    },
    reviewerSubmitted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "faculty-evaluated", "reviewer-evaluated", "completed"],
      default: "pending",
    },
    // New fields for Excel-based evaluations
    excelData: {
      type: Array,
      default: [],
    },
    facultyScoreData: {
      type: Array,
      default: [],
    },
    reviewerScoreData: {
      type: Array,
      default: [],
    },
    studentScores: [StudentScoreSchema],
    // Add flag to track if scores were pre-filled from Excel
    hasPrefilledScores: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Evaluation = mongoose.model("Evaluation", EvaluationSchema);

export default Evaluation;
