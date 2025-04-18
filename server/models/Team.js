import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  maxMembers: {
    type: Number,
    default: 5
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  teamCode: {
    type: String,
    unique: true,
    default: () => nanoid(8)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Team = mongoose.model('Team', TeamSchema);

export default Team;