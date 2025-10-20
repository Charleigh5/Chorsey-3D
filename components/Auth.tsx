import React, { useState } from 'react';
import { login, register } from '../services/authService';
import type { User } from '../types';
import { CubeIcon, EnvelopeIcon, LockClosedIcon } from './icons';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await login(email, password);
      } else {
        user = await register(name, email, password);
      }
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center gap-3 mb-8">
            <CubeIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white tracking-tight">Chorsey</h1>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">{isLogin ? 'Sign In' : 'Create Account'}</h2>
          <p className="text-center text-gray-400 mb-6">{isLogin ? 'Welcome back!' : 'Get started with your household.'}</p>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                </div>
                 <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 pl-10 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="user@chorsey.com"
                  required
                />
              </div>
            </div>
             <div className="mb-6">
              <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 pl-10 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="••••••••"
                  required
                />
               </div>
            </div>

            {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:bg-cyan-700 disabled:cursor-not-allowed"
            >
              {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
           <p className="text-center text-gray-400 text-sm mt-6">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="font-bold text-cyan-400 hover:text-cyan-300 ml-1">
                 {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
        </div>
      </div>
    </div>
  );
};
