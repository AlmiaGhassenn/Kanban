const router = require('express').Router();
const crypto = require('crypto');
const Project = require('../models/Project');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      owner: req.user._id,
      columns: [
        { title: 'To Do', order: 0, color: '#94a3b8' },
        { title: 'In Progress', order: 1, color: '#f59e0b' },
        { title: 'Done', order: 2, color: '#10b981' },
      ],
    });

    await project.populate('owner', 'name email avatar');
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isAdmin(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const { name, description, color } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (Project.userRefToString(project.owner) !== Project.userRefToString(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can delete this project' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/share-token', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isAdmin(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    project.shareToken = project.shareToken || crypto.randomBytes(12).toString('hex');
    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/columns', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const { title, color } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const maxOrder = project.columns.reduce((max, c) => Math.max(max, c.order), -1);
    project.columns.push({ title, color: color || '#6366f1', order: maxOrder + 1 });
    await project.save();
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/columns/:columnId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const column = project.columns.id(req.params.columnId);
    if (!column) return res.status(404).json({ message: 'Column not found' });

    if (req.body.title) column.title = req.body.title;
    if (req.body.color) column.color = req.body.color;

    await project.save();
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/columns/:columnId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isAdmin(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    await Task.deleteMany({ project: project._id, columnId: req.params.columnId });
    project.columns.pull(req.params.columnId);
    await project.save();
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
