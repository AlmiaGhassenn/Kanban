const router = require('express').Router();
const Project = require('../models/Project');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/join/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const project = await Project.findOne({ shareToken: token });
    if (!project) return res.status(404).json({ message: 'Invalid invite link' });

    if (project.isMember(req.user._id)) {
      await project.populate('owner', 'name email avatar');
      await project.populate('members.user', 'name email avatar');
      return res.json(project);
    }

    project.members.push({ user: req.user._id, role: 'member' });
    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:projectId/invite', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isAdmin(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ message: 'User not found' });

    if (Project.userRefToString(project.owner) === Project.userRefToString(invitee._id)) {
      return res.status(400).json({ message: 'User is already the owner' });
    }

    const alreadyMember = project.members.some(
      (m) => Project.userRefToString(m.user) === Project.userRefToString(invitee._id)
    );
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    const memberRole = role || 'member';
    if (!['admin', 'member'].includes(memberRole)) {
      return res.status(400).json({ message: 'Role must be admin or member' });
    }

    project.members.push({ user: invitee._id, role: memberRole });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    await project.populate('owner', 'name email avatar');
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:projectId/members/:userId', async (req, res) => {
  try {
    const { role } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.isAdmin(req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const member = project.members.find(
      (m) => Project.userRefToString(m.user) === String(req.params.userId)
    );
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const allowedRoles = ['admin', 'member', 'owner'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (admin or member)' });
    }
    member.role = role;
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:projectId/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isSelf = Project.userRefToString(req.user._id) === String(req.params.userId);
    const isAdmin = project.isAdmin(req.user._id);
    if (!isSelf && !isAdmin) return res.status(403).json({ message: 'Access denied' });

    project.members = project.members.filter(
      (m) => Project.userRefToString(m.user) !== String(req.params.userId)
    );
    await project.save();
    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
