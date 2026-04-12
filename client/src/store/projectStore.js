import { create } from 'zustand';
import api from '../api/axios';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/projects');
      set({ projects: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch projects', loading: false });
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`),
      ]);
      set({ currentProject: projectRes.data, tasks: tasksRes.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch project', loading: false });
    }
  },

  createProject: async (payload) => {
    const { data } = await api.post('/projects', payload);
    set((s) => ({ projects: [data, ...s.projects] }));
    return data;
  },

  updateProject: async (id, payload) => {
    const { data } = await api.put(`/projects/${id}`, payload);
    set((s) => ({
      projects: s.projects.map((p) => (p._id === id ? data : p)),
      currentProject: s.currentProject?._id === id ? data : s.currentProject,
    }));
    return data;
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((s) => ({
      projects: s.projects.filter((p) => p._id !== id),
      currentProject: s.currentProject?._id === id ? null : s.currentProject,
    }));
  },

  addColumn: async (projectId, payload) => {
    const { data } = await api.post(`/projects/${projectId}/columns`, payload);
    set({ currentProject: data });
    return data;
  },

  updateColumn: async (projectId, columnId, payload) => {
    const { data } = await api.put(`/projects/${projectId}/columns/${columnId}`, payload);
    set({ currentProject: data });
    return data;
  },

  deleteColumn: async (projectId, columnId) => {
    const { data } = await api.delete(`/projects/${projectId}/columns/${columnId}`);
    set((s) => ({
      currentProject: data,
      tasks: s.tasks.filter((t) => t.columnId !== columnId),
    }));
  },

  createTask: async (payload) => {
    const { data } = await api.post('/tasks', payload);
    set((s) => ({ tasks: [...s.tasks, data] }));
    return data;
  },

  updateTask: async (id, payload) => {
    const { data } = await api.put(`/tasks/${id}`, payload);
    set((s) => ({ tasks: s.tasks.map((t) => (t._id === id ? data : t)) }));
    return data;
  },

  moveTask: async (taskId, toColumnId, newOrder, affectedTasks) => {
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t._id === taskId) return { ...t, columnId: toColumnId, order: newOrder };
        const affected = affectedTasks?.find((a) => a.id === t._id);
        return affected ? { ...t, order: affected.order } : t;
      }),
    }));
    await api.post(`/tasks/${taskId}/move`, { toColumnId, newOrder, affectedTasks });
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) }));
  },

  addComment: async (taskId, content) => {
    const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
    set((s) => ({ tasks: s.tasks.map((t) => (t._id === taskId ? data : t)) }));
    return data;
  },

  inviteMember: async (projectId, email, role) => {
    const { data } = await api.post(`/members/${projectId}/invite`, { email, role });
    set({ currentProject: data });
  },

  removeMember: async (projectId, userId) => {
    await api.delete(`/members/${projectId}/members/${userId}`);
    set((s) => ({
      currentProject: s.currentProject
        ? {
            ...s.currentProject,
            members: s.currentProject.members.filter(
              (m) => String(m.user?._id ?? m.user) !== String(userId)
            ),
          }
        : null,
    }));
  },

  setTasksFromSocket: (tasks) => set({ tasks }),

  addTaskFromSocket: (task) =>
    set((s) => ({ tasks: [...s.tasks.filter((t) => t._id !== task._id), task] })),

  updateTaskFromSocket: (patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => {
        const patchId = patch._id ?? patch.id;
        if (patchId == null || String(t._id) !== String(patchId)) return t;
        return { ...t, ...patch, _id: t._id };
      }),
    })),

  deleteTaskFromSocket: (taskId) =>
    set((s) => ({ tasks: s.tasks.filter((t) => String(t._id) !== String(taskId)) })),

  setCurrentProject: (project) => set({ currentProject: project }),
}));

export default useProjectStore;
