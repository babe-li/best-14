/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { DashboardLayout } from './components/DashboardLayout';
import { storageService } from './services/storageService';
import { type User } from './types';

// View Components
import { Overview } from './views/Overview';
import { Students } from './views/Students';
import { Finance } from './views/Finance';
import { Exams } from './views/Exams';
import { Settings } from './views/Settings';
import { Messages } from './views/Messages';
import { DailyAttendance } from './views/Attendance';
import { Library } from './views/Library';
import { Users } from './views/Users';
import { Academics } from './views/Academics';
import { Profile } from './views/Profile';
import { Tasks } from './views/Tasks';
import { Permissions } from './views/Permissions';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    const session = storageService.getCurrentUser();
    if (session) {
      setUser(session);
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center premium-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-primary rounded-full animate-spin shadow-inner" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <Overview />;
      case 'students':
        return <Students />;
      case 'finance':
      case 'pay-fees':
        return <Finance />;
      case 'exams':
        return <Exams />;
      case 'messages':
        return <Messages />;
      case 'attendance':
        return <DailyAttendance />;
      case 'library':
        return <Library />;
      case 'users':
        return <Users />;
      case 'academics':
        return <Academics />;
      case 'tasks':
        return <Tasks />;
      case 'permissions':
        return <Permissions />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <DashboardLayout 
      user={user} 
      onLogout={handleLogout} 
      activeView={activeView} 
      setActiveView={setActiveView}
    >
      {renderView()}
    </DashboardLayout>
  );
}
