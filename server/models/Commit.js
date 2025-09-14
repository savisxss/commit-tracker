const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
  sha: {
    type: String,
    required: true,
    unique: true
  },
  message: {
    type: String,
    required: true
  },
  author: {
    name: String,
    email: String,
    avatar: String,
    username: String
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  branch: String,
  timestamp: {
    type: Date,
    required: true
  },
  url: String,
  filesChanged: [{
    filename: String,
    additions: Number,
    deletions: Number,
    status: String
  }],
  stats: {
    additions: Number,
    deletions: Number,
    total: Number
  },
  votes: {
    up: { type: Number, default: 0 },
    down: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

commitSchema.index({ timestamp: -1 });
commitSchema.index({ projectId: 1, timestamp: -1 });

module.exports = mongoose.model('Commit', commitSchema);