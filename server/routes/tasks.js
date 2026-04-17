const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/project/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .populate('dependencies', 'title')
      .sort({ order: 1 });

    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, projectId, columnId, assignee, priority, dueDate, labels, dependencies, recurrence } = req.body;
    if (!title || !projectId || !columnId) {
      return res.status(400).json({ message: 'title, projectId, and columnId are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const lastTask = await Task.findOne({ project: projectId, columnId }).sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title, description, project: projectId, columnId,
      assignee: assignee || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: labels || [],
      dependencies: dependencies || [],
      recurrence: recurrence || 'none',
      order,
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('dependencies', 'title');
    
    await Activity.create({
      project: projectId,
      task: task._id,
      user: req.user._id,
      action: 'task_created',
      description: `created task "${task.title}"`,
    });
    
    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const allowed = ['title', 'description', 'assignee', 'priority', 'dueDate', 'labels', 'columnId', 'order', 'dependencies', 'recurrence'];
    const changes = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined && JSON.stringify(req.body[field]) !== JSON.stringify(task[field])) {
        changes[field] = { from: task[field], to: req.body[field] };
        task[field] = req.body[field];
      }
    });

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('comments.author', 'name email avatar');
    await task.populate('dependencies', 'title');
    
    if (Object.keys(changes).length > 0) {
      await Activity.create({
        project: task.project,
        task: task._id,
        user: req.user._id,
        action: 'task_updated',
        description: `updated task "${task.title}"`,
        changes,
      });
    }
    
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/subtasks', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project || !project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    task.subTasks.push({ title });
    await task.save();
    
    await Activity.create({
      project: task.project,
      task: task._id,
      user: req.user._id,
      action: 'subtask_added',
      description: `added subtask to "${task.title}"`,
    });
    
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project || !project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const subtask = task.subTasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    const { title, completed } = req.body;
    if (title !== undefined) subtask.title = title;
    if (completed !== undefined) subtask.completed = completed;

    await task.save();
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project || !project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    task.subTasks.pull({ _id: req.params.subtaskId });
    await task.save();
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/move', async (req, res) => {
  try {
    const { toColumnId, newOrder, affectedTasks } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    task.columnId = toColumnId;
    task.order = newOrder;
    await task.save();

    if (affectedTasks && Array.isArray(affectedTasks)) {
      await Promise.all(
        affectedTasks.map(({ id, order }) => Task.findByIdAndUpdate(id, { order }))
      );
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    task.comments.push({ author: req.user._id, content });
    await task.save();
    await task.populate('comments.author', 'name email avatar');
    
    await Activity.create({
      project: task.project,
      task: task._id,
      user: req.user._id,
      action: 'comment_added',
      description: `commented on "${task.title}"`,
    });
    
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isMember(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const taskTitle = task.title;
    await task.deleteOne();
    
    await Activity.create({
      project: task.project,
      user: req.user._id,
      action: 'task_deleted',
      description: `deleted task "${taskTitle}"`,
    });
    
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
