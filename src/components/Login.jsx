import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, name.trim());
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Wrong email or password.');
      } else if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Sign in instead.');
      } else if (msg.includes('weak-password')) {
        setError('Password must be at least 6 characters.');
      } else {
        setError('Something went wrong. Try again.');
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">💪❤️</div>
          <h1 className="text-2xl font-extrabold text-gray-800">Daily Together</h1>
          <p className="text-gray-400 text-sm mt-1">Track your day, grow together</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignup && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-800 focus:outline-none focus:border-violet-400 text-base"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-800 focus:outline-none focus:border-violet-400 text-base"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-800 focus:outline-none focus:border-violet-400 text-base"
          />
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl font-bold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? '...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setIsSignup(!isSignup); setError(''); }}
            className="text-violet-600 font-semibold"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
