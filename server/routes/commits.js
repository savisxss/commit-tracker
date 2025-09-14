const express = require('express');
const router = express.Router();
const Commit = require('../models/Commit');
const Project = require('../models/Project');

// Get all commits with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const projectId = req.query.projectId;
    const skip = (page - 1) * limit;

    let query = {};
    if (projectId) {
      query.projectId = projectId;
    }

    const commits = await Commit.find(query)
      .populate('projectId', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Commit.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      commits,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get commit statistics
router.get('/stats', async (req, res) => {
  try {
    const projectId = req.query.projectId;
    let matchQuery = {};
    if (projectId) {
      matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const stats = await Commit.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalCommits: { $sum: 1 },
          firstCommit: { $min: '$timestamp' },
          lastCommit: { $max: '$timestamp' },
          totalAdditions: { $sum: '$stats.additions' },
          totalDeletions: { $sum: '$stats.deletions' },
          uniqueAuthors: { $addToSet: '$author.email' }
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
      },
      {
        $addFields: {
          commitsPerDay: {
            $cond: {
              if: { $gt: ['$daysSinceFirst', 0] },
              then: { $divide: ['$totalCommits', '$daysSinceFirst'] },
              else: 0
            }
          }
        }
      }
    ]);

    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on commit
router.post('/:id/vote', async (req, res) => {
  try {
    const { type } = req.body; // 'up' or 'down'
    const commitId = req.params.id;

    if (!['up', 'down'].includes(type)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const updateField = type === 'up' ? 'votes.up' : 'votes.down';
    const commit = await Commit.findByIdAndUpdate(
      commitId,
      { $inc: { [updateField]: 1 } },
      { new: true }
    );

    if (!commit) {
      return res.status(404).json({ error: 'Commit not found' });
    }

    res.json({ votes: commit.votes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get commits by date range
router.get('/by-date', async (req, res) => {
  try {
    const { startDate, endDate, projectId } = req.query;

    let query = {};
    if (projectId) query.projectId = projectId;
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const commits = await Commit.find(query)
      .populate('projectId', 'name')
      .sort({ timestamp: -1 });

    res.json(commits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;