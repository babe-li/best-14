/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { storageService } from '../services/storageService';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { TeacherDashboard } from '../components/dashboards/TeacherDashboard';
import { ParentDashboard } from '../components/dashboards/ParentDashboard';
import { StudentDashboard } from '../components/dashboards/StudentDashboard';

import { AnnouncementBoard } from '../components/AnnouncementBoard';

export const Overview = () => {
  const user = storageService.getCurrentUser();

  if (!user) return null;

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'teacher':
        return <TeacherDashboard user={user} />;
      case 'parent':
        return <ParentDashboard user={user} />;
      case 'student':
        return <StudentDashboard user={user} />;
      default:
        return <AdminDashboard user={user} />;
    }
  };

  return (
    <div className="pb-12 space-y-12">
      <AnnouncementBoard />
      <div className="pt-8 border-t border-slate-100">
        {renderDashboard()}
      </div>
    </div>
  );
};
