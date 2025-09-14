const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  repositoryUrl: {
    type: String,
    required: true
  },
  webhookSecret: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastCommitAt: Date,
  totalCommits: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Project', projectSchema);