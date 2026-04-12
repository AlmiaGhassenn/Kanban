const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  color: { type: String, default: '#6366f1' },
});

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6366f1' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
    columns: [columnSchema],
  },
  { timestamps: true }
);

/** Normalize owner / member.user whether stored as ObjectId, populated doc, or plain {_id}. */
function userRefToString(ref) {
  if (ref == null) return '';
  if (typeof ref === 'string' || typeof ref === 'number') return String(ref);
  if (typeof ref === 'object' && ref._id != null) return String(ref._id);
  if (typeof ref.toHexString === 'function') return ref.toHexString();
  return String(ref);
}

projectSchema.methods.isMember = function (userId) {
  const uid = userRefToString(userId);
  if (!uid) return false;
  if (userRefToString(this.owner) === uid) return true;
  return this.members.some((m) => userRefToString(m.user) === uid);
};

projectSchema.methods.isAdmin = function (userId) {
  const uid = userRefToString(userId);
  if (!uid) return false;
  if (userRefToString(this.owner) === uid) return true;
  const member = this.members.find((m) => userRefToString(m.user) === uid);
  return Boolean(member && (member.role === 'admin' || member.role === 'owner'));
};

const Project = mongoose.model('Project', projectSchema);
Project.userRefToString = userRefToString;
module.exports = Project;
