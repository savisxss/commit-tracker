const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Project = require('../models/Project');
const Commit = require('../models/Commit');

// GitHub webhook endpoint
router.post('/:projectId', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const signature = req.headers['x-hub-signature-256'];
    const body = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify webhook signature
    if (signature && project.webhookSecret) {
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', project.webhookSecret)
        .update(body)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(body.toString());

    // Handle push events
    if (req.headers['x-github-event'] === 'push') {
      await handlePushEvent(payload, project);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handlePushEvent(payload, project) {
  const { commits, repository, ref } = payload;
  const branch = ref.replace('refs/heads/', '');

  for (const commitData of commits) {
    try {
      // Check if commit already exists
      const existingCommit = await Commit.findOne({ sha: commitData.id });
      if (existingCommit) continue;

      // Extract author information
      const author = {
        name: commitData.author.name,
        email: commitData.author.email,
        username: commitData.author.username,
        avatar: `https://github.com/${commitData.author.username}.png?size=40`
      };

      // Process file changes
      const filesChanged = commitData.added.concat(commitData.removed, commitData.modified).map(filename => ({
        filename,
        status: commitData.added.includes(filename) ? 'added' :
               commitData.removed.includes(filename) ? 'removed' : 'modified'
      }));

      const commit = new Commit({
        sha: commitData.id,
        message: commitData.message,
        author,
        projectId: project._id,
        branch,
        timestamp: new Date(commitData.timestamp),
        url: commitData.url,
        filesChanged
      });

      await commit.save();

      // Update project statistics
      await Project.findByIdAndUpdate(project._id, {
        $inc: { totalCommits: 1 },
        lastCommitAt: new Date(commitData.timestamp)
      });

    } catch (error) {
      console.error('Error processing commit:', error);
    }
  }
}

module.exports = router;