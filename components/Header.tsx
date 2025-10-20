import React from 'react';
import type { User } from '../types';
import { CubeIcon, CoinIcon, ArrowRightOnRectangleIcon } from './icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CubeIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Chorsey</h1>
        </div>
        {user && (
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1.5 rounded-full">
                <CoinIcon className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold text-white">{user.points.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-right text-sm font-medium text-gray-300 hidden sm:block">{user.name}</span>
              <img
                src={user.avatarUrl}
                alt={`${user.name}'s avatar`}
                className="w-10 h-10 rounded-full border-2 border-cyan-400"
              />
            </div>
             <button
                onClick={onLogout}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Sign out"
              >
                <ArrowRightOnRectangleIcon className="w-6 h-6" />
              </button>
          </div>
        )}
      </div>
    </header>
  );
};