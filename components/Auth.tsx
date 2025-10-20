import React, { useState } from 'react';
import { CubeIcon, EnvelopeIcon, LockClosedIcon } from './icons';
import type { User } from '../types';

interface AuthProps {
    onLogin: (email: string, password?: string) => Promise<void>;
    onRegister: (name: string, email: string, password?: string) => Promise<void>;
    error: string | null;
    loading: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, error, loading }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoginView) {
            onLogin(email, password);
        } else {
            onRegister(name, email, password);
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <CubeIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-white tracking-tight">Welcome to Chorsey</h1>
                    <p className="text-gray-400 mt-2">
                        {isLoginView ? 'Sign in to manage your household' : 'Create an account to get started'}
                    </p>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLoginView && (
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                                    Display Name
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-gray-900 text-white"
                                        placeholder="Alex"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                Email address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                 <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-gray-900 text-white"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <LockClosedIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={isLoginView ? "current-password" : "new-password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-gray-900 text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-900 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button onClick={toggleView} className="font-medium text-cyan-400 hover:text-cyan-300 focus:outline-none focus:underline">
                            {isLoginView ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
