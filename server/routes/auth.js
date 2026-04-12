const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const generateTokens = (userId) => {
  const id = String(userId);
  const accessToken = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create(data);
    const tokens = generateTokens(user._id);
    res.status(201).json({ user: user.toSafeObject(), ...tokens });
  } catch (err) {
    if (err.name === 'ZodError') {
      const msg = err.issues?.[0]?.message || 'Invalid input';
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(data.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const tokens = generateTokens(user._id);
    res.json({ user: user.toSafeObject(), ...tokens });
  } catch (err) {
    if (err.name === 'ZodError') {
      const msg = err.issues?.[0]?.message || 'Invalid input';
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokens = generateTokens(decoded.userId);
    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
