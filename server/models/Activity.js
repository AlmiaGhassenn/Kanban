const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { 
      type: String, 
      enum: ['task_created', 'task_updated', 'task_deleted', 'task_moved', 'comment_added', 'subtask_added', 'column_added', 'member_added'],
      required: true 
    },
    description: { type: String, required: true },
    changes: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);