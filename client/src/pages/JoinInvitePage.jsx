import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function JoinInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [status, setStatus] = useState('joining');
  const [message, setMessage] = useState('Joining project...');

  useEffect(() => {
    if (!user) return;

    const join = async () => {
      try {
        const { data } = await api.post(`/members/join/${token}`);
        navigate(`/project/${data._id}`, { replace: true });
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Failed to join project');
      }
    };

    join();
  }, [token, user, navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-[#0f0f13] light:bg-slate-50 px-4">
        <div className="max-w-md w-full rounded-3xl border dark:border-white/10 light:border-slate-200 bg-white dark:bg-[#111118] p-8 text-center">
          <p className="text-sm dark:text-slate-300 light:text-slate-600">Please log in first to accept the project invite.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen dark:bg-[#0f0f13] light:bg-slate-50 px-4">
      <div className="max-w-md w-full rounded-3xl border dark:border-white/10 light:border-slate-200 bg-white dark:bg-[#111118] p-8 text-center">
        {status === 'joining' ? (
          <>
            <div className="mb-5 text-brand-500 text-3xl">⏳</div>
            <h1 className="text-xl font-semibold dark:text-white light:text-slate-900 mb-3">Joining project</h1>
            <p className="text-sm dark:text-slate-400 light:text-slate-500">{message}</p>
          </>
        ) : (
          <>
            <div className="mb-5 text-red-500 text-3xl">⚠️</div>
            <h1 className="text-xl font-semibold dark:text-white light:text-slate-900 mb-3">Could not join</h1>
            <p className="text-sm dark:text-slate-400 light:text-slate-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2 rounded-lg"
            >
              Back to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
