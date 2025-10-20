import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScenePlaceholder } from './components/ScenePlaceholder';
import { TaskList } from './components/TaskList';
import { Auth } from './components/Auth';
import { login, register } from './services/authService';
import type { User } from './types';

// In a real app, the session would be persisted in localStorage or a cookie.
const SESSION_KEY = 'chorsey_user_session';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for a persisted session on initial load
  useEffect(() => {
    try {
      const savedSession = sessionStorage.getItem(SESSION_KEY);
      if (savedSession) {
        setUser(JSON.parse(savedSession));
      }
    } catch (error) {
      console.error("Failed to parse user session:", error);
      sessionStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, password?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const loggedInUser = await login(email, password);
      setUser(loggedInUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
        const newUser = await register(name, email, password);
        setUser(newUser);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  if (isLoading && !user) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <p className="text-white">Loading...</p>
        </div>
     );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} error={authError} loading={isLoading} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          <div className="lg:col-span-2">
            <ScenePlaceholder />
          </div>
          <div className="lg:col-span-1">
            <div className="h-full overflow-y-auto max-h-[calc(100vh-150px)] pr-2">
              <TaskList userId={user.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;