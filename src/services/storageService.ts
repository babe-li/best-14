/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Class, type Student, type User, type FeeStructure, type Payment, type Exam, type Result, type Message, type Attendance, type Task, type Subject, type PermissionRequest, type Announcement, type TimetableEntry } from '../types';
import { SCHOOL_CONFIG } from '../constants';

const DB_KEY = 'sms_tanzania_db';

export interface SystemSettings {
  sections: string[];
  gradingScale: {
    grade: string;
    min: number;
    max: number;
    remark: string;
  }[];
}

interface DB {
  users: User[];
  students: Student[];
  classes: Class[];
  fees: FeeStructure[];
  payments: Payment[];
  exams: Exam[];
  results: Result[];
  messages: Message[];
  announcements: Announcement[];
  attendance: Attendance[];
  tasks: Task[];
  subjects: Subject[];
  settings: SystemSettings;
  notifications: any[];
  permissions: PermissionRequest[];
  timetable: TimetableEntry[];
}

const INITIAL_DB: DB = {
  users: [
    {
      id: 'admin_1',
      name: SCHOOL_CONFIG.adminCredentials.name,
      email: SCHOOL_CONFIG.adminCredentials.email,
      role: 'admin',
      twoFactorEnabled: true,
      hasChangedInitialPassword: false
    },
    {
      id: 'teacher_1',
      name: 'Mwl. Julius Kambarage',
      email: 'julius@school.tz',
      role: 'teacher',
      teacherMetadata: { subjects: ['Mathematics', 'Physics'] }
    },
    {
      id: 'teacher_2',
      name: 'Mwl. Farida Juma',
      email: 'farida@school.tz',
      role: 'teacher',
      teacherMetadata: { subjects: ['Biology', 'English'] }
    },
    {
      id: 'parent_1',
      name: 'Mzee Ramadhani',
      email: 'rama@gmail.com',
      role: 'parent',
      parentMetadata: { childrenIds: ['stud_1'] }
    },
    {
      id: 'parent_2',
      name: 'Bi. Neema',
      email: 'neema@gmail.com',
      role: 'parent',
      parentMetadata: { childrenIds: ['stud_2'] }
    },
    {
      id: 'student_1',
      name: 'Said Mwinyi',
      email: 'said@student.tz',
      role: 'student',
      studentMetadata: { admissionNo: '2026/001', studentId: 'stud_1' }
    }
  ],
  students: [],
  classes: [],
  fees: [],
  payments: [],
  exams: [],
  results: [],
  messages: [],
  announcements: [
    {
      id: 'ann_1',
      title: 'Welcome to Term 2, 2026',
      content: 'We are excited to welcome all students back for the second term. Please ensure all fee payments are updated via the portal.',
      authorId: 'admin_1',
      authorName: 'School Management',
      authorRole: 'admin',
      timestamp: '2026-05-10T08:00:00Z',
      priority: 'high',
      targetRoles: ['student', 'teacher', 'parent']
    }
  ],
  attendance: [],
  tasks: [],
  subjects: [
    { id: 'sub_1', name: 'Mathematics', code: 'MATH', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'] },
    { id: 'sub_2', name: 'Physics', code: 'PHYS', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'] },
    { id: 'sub_3', name: 'Biology', code: 'BIOL', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'] },
    { id: 'sub_4', name: 'English', code: 'ENGL', levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'] }
  ],
  settings: {
    sections: ['A', 'B', 'C', 'Gold', 'Silver'],
    gradingScale: SCHOOL_CONFIG.gradingScale
  },
  notifications: [],
  permissions: [
    {
      id: 'perm_1',
      studentId: 'stud_1',
      parentId: 'parent_1',
      reason: 'Urgent family engagement in Dodoma',
      type: 'Personal',
      startDate: '2026-05-10',
      endDate: '2026-05-15',
      status: 'Pending',
      createdAt: '2026-05-07T10:00:00Z'
    }
  ],
  timetable: []
};

export const storageService = {
  getDB: (): DB => {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      localStorage.setItem(DB_KEY, JSON.stringify(INITIAL_DB));
      return INITIAL_DB;
    }
    return JSON.parse(data);
  },

  saveDB: (db: DB) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  },

  generateControlNumber: (name: string): string => {
    // Generate a 12-digit control number starting with 99
    // Incorporates a signature from the student's name
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
    const firstChar = cleanName.charCodeAt(0) || 65;
    const secondChar = cleanName.charCodeAt(1) || 66;
    
    // Signature from name (4 digits)
    const sig1 = (firstChar % 100).toString().padStart(2, '0');
    const sig2 = (secondChar % 100).toString().padStart(2, '0');
    
    // Remaining 6 digits are random to ensure uniqueness in this demo
    // Including the current year to satisfy "each year" logic
    const yearPart = new Date().getFullYear().toString().slice(-2);
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    
    return `99${yearPart}${sig1}${sig2}${randomPart}`;
  },

  // Auth helper
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('sms_current_user');
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('sms_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sms_current_user');
    }
  }
};
