const router = require('express').Router();
const Activity = require('../models/Activity');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/project/:projectId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = await Activity.find({ project: req.params.projectId })
      .populate('user', 'name email avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(activities);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;