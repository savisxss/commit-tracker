const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Project = require('../models/Project');
const Commit = require('../models/Commit');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true })
      .select('-webhookSecret')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description, repositoryUrl } = req.body;

    const webhookSecret = crypto.randomBytes(32).toString('hex');

    const project = new Project({
      name,
      description,
      repositoryUrl,
      webhookSecret
    });

    await project.save();

    // Return project without webhook secret for security
    const projectResponse = project.toObject();
    delete projectResponse.webhookSecret;

    res.status(201).json({
      ...projectResponse,
      webhookUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/webhook/${project._id}`,
      webhookSecret: webhookSecret // Only return on creation
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Project name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select('-webhookSecret');
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { name, description, repositoryUrl, isActive } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, repositoryUrl, isActive },
      { new: true, runValidators: true }
    ).select('-webhookSecret');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Project name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const projectId = req.params.id;

    const stats = await Commit.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: null,
          totalCommits: { $sum: 1 },
          firstCommit: { $min: '$timestamp' },
          lastCommit: { $max: '$timestamp' },
          uniqueAuthors: { $addToSet: '$author.email' },
          totalVotesUp: { $sum: '$votes.up' },
          totalVotesDown: { $sum: '$votes.down' }
        }
      },
      {
        $addFields: {
          uniqueAuthorsCount: { $size: '$uniqueAuthors' },
          daysSinceFirst: {
            $divide: [
              { $subtract: ['$lastCommit', '$firstCommit'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    ]);

    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;