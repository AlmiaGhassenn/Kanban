const jwt = require('jsonwebtoken');
const User = require('../models/User');

const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('task:created', ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit('task:created', task);
    });

    socket.on('task:updated', ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit('task:updated', task);
    });

    socket.on('task:deleted', ({ projectId, taskId }) => {
      socket.to(`project:${projectId}`).emit('task:deleted', taskId);
    });

    socket.on('task:moved', ({ projectId, taskId, toColumnId, order }) => {
      socket.to(`project:${projectId}`).emit('task:moved', { taskId, toColumnId, order });
    });

    socket.on('column:added', ({ projectId, project }) => {
      socket.to(`project:${projectId}`).emit('column:added', project);
    });

    socket.on('column:deleted', ({ projectId, columnId }) => {
      socket.to(`project:${projectId}`).emit('column:deleted', columnId);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { registerSocketHandlers };
