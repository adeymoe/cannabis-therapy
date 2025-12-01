import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AuthPage = ({ onAuth }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setForm({ email: '', password: '', username: '' });
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { email, password, username } = form;

    if (!email || !password || password.length < 8) {
      toast.error('Please enter a valid email and password (min 8 chars)');
      return;
    }

    if (isSignUp && !username) {
      toast.error('Please enter a username');
      return;
    }
    

    setLoading(true);
    const endpoint = isSignUp ? 'register' : 'login';

    try {
      const payload = isSignUp ? { email, password, username } : { email, password };

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/${endpoint}`,
        payload
      );

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        onAuth(res.data.token);
        navigate('/');
      } else {
        toast.error(res.data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      toast.error(isSignUp ? 'Registration failed.' : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf4] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-[#e2dcd2]">
        <h2 className="text-2xl font-semibold text-[#4b3f2f] mb-6 text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
              required
              className="w-full px-4 py-2 border rounded-xl border-[#d9cfc0] focus:ring-2 focus:ring-[#a3d3a1]"
            />
          )}

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full px-4 py-2 border rounded-xl border-[#d9cfc0] focus:ring-2 focus:ring-[#a3d3a1]"
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="w-full px-4 py-2 border rounded-xl border-[#d9cfc0] focus:ring-2 focus:ring-[#a3d3a1]"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-xl text-white transition ${
              loading ? 'bg-[#aacfb5] cursor-not-allowed' : 'bg-[#6cb28e] hover:bg-[#5fa47f]'
            }`}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-[#7a6c58]">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-[#4b3f2f] underline ml-1"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
