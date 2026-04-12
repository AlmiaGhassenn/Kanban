import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useProjectStore from '../store/projectStore';

let socketInstance = null;

export const getSocket = () => socketInstance;

const useSocket = (projectId) => {
  const socketRef = useRef(null);
  const { addTaskFromSocket, updateTaskFromSocket, deleteTaskFromSocket, setCurrentProject } =
    useProjectStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !projectId) return;

    const socket = io('/', {
      auth: { token },
      transports: ['polling', 'websocket'],
    });
    socketRef.current = socket;
    socketInstance = socket;

    socket.emit('join:project', projectId);

    socket.on('task:created', addTaskFromSocket);
    socket.on('task:updated', updateTaskFromSocket);
    socket.on('task:deleted', deleteTaskFromSocket);
    socket.on('task:moved', ({ taskId, toColumnId, order }) => {
      updateTaskFromSocket({ _id: taskId, columnId: toColumnId, order });
    });
    socket.on('column:added', setCurrentProject);
    socket.on('column:deleted', (columnId) => {
      useProjectStore.setState((s) => ({
        tasks: s.tasks.filter(
          (t) => String(t.columnId) !== String(columnId)
        ),
      }));
    });

    return () => {
      socket.emit('leave:project', projectId);
      socket.disconnect();
      socketInstance = null;
    };
  }, [projectId]);

  const emit = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  return { emit };
};

export default useSocket;
