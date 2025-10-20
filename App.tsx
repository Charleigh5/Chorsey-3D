import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Auth } from './components/Auth';
import { Header } from './components/Header';
import { TaskList } from './components/TaskList';
import { ScenePlaceholder } from './components/ScenePlaceholder';
import { getCurrentUser } from './services/mockApiService';
import { CreateTaskForm } from './components/CreateTaskForm';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [taskVersion, setTaskVersion] = useState(0);

  // Check for a logged-in user on initial load
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        try {
          const fetchedUser = await getCurrentUser(storedUserId);
          setUser(fetchedUser);
        } catch (error) {
          console.error("Failed to fetch stored user, logging out.", error);
          localStorage.removeItem('userId');
        }
      }
      setLoading(false);
    };

    checkLoggedInUser();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('userId', loggedInUser.id);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  const handleTaskCreated = () => {
    setTaskVersion(v => v + 1);
  };

  if (loading) {
     return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
             <TaskList key={taskVersion} userId={user.id} userRole={user.role} />
             {user.role === UserRole.ADMIN && (
                <CreateTaskForm onTaskCreated={handleTaskCreated} />
             )}
          </div>
          <div className="lg:col-span-2">
             <ScenePlaceholder />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;