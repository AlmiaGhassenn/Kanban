import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#0f0f13] light:bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <span className="dark:text-white light:text-slate-800 font-semibold text-lg tracking-tight">Kanban</span>
          </div>
          <h1 className="text-2xl font-semibold dark:text-white light:text-slate-800 mb-1">Create an account</h1>
          <p className="dark:text-slate-400 light:text-slate-500 text-sm">Start managing your projects</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="dark:bg-red-500/10 dark:border-red-500/20 light:bg-red-50 light:border-red-200 rounded-lg px-4 py-3 dark:text-red-400 light:text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm dark:text-slate-400 light:text-slate-600 mb-1.5">Full name</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm dark:text-slate-400 light:text-slate-600 mb-1.5">Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm dark:text-slate-400 light:text-slate-600 mb-1.5">Password</label>
            <input
              type="password" required minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800 light:placeholder-slate-400 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              placeholder="Min. 6 characters"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm mt-2"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center dark:text-slate-500 light:text-slate-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 hover:text-brand-400 transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}