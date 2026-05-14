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
      password: SCHOOL_CONFIG.adminCredentials.password,
      role: 'admin',
      twoFactorEnabled: true,
      hasChangedInitialPassword: false
    },
    {
      id: 'teacher_1',
      name: 'Mwl. Julius Kambarage',
      email: 'julius@school.tz',
      password: 'Kambarage',
      role: 'teacher',
      teacherMetadata: { subjects: ['Mathematics', 'Physics'] }
    },
    {
      id: 'teacher_2',
      name: 'Mwl. Farida Juma',
      email: 'farida@school.tz',
      password: 'Juma',
      role: 'teacher',
      teacherMetadata: { subjects: ['Biology', 'English'] }
    },
    {
      id: 'parent_1',
      name: 'Mzee Ramadhani',
      email: 'rama@gmail.com',
      password: 'Ramadhani',
      role: 'parent',
      parentMetadata: { childrenIds: ['stud_1'] }
    },
    {
      id: 'parent_2',
      name: 'Bi. Neema',
      email: 'neema@gmail.com',
      password: 'Neema',
      role: 'parent',
      parentMetadata: { childrenIds: ['stud_2'] }
    },
    {
      id: 'student_1',
      name: 'Said Mwinyi',
      email: 'said@student.tz',
      password: 'Mwinyi',
      role: 'student',
      studentMetadata: { admissionNo: '2026/001', studentId: 'stud_1' }
    }
  ],
  students: [
    {
      id: 'stud_1',
      admissionNo: '2026/001',
      name: 'Said Mwinyi',
      dob: '2008-05-12',
      gender: 'Male',
      classId: 'Form 4',
      section: 'A',
      parentId: 'parent_1',
      feeBalance: 150000,
      controlNumber: '992601234567',
      status: 'active',
      createdAt: '2026-01-10T08:00:00Z',
      metadata: {
        strongSubject: 'Physics',
        assignedTeacherId: 'teacher_1'
      }
    },
    {
      id: 'stud_2',
      admissionNo: '2026/002',
      name: 'Neema Joseph',
      dob: '2009-08-22',
      gender: 'Female',
      classId: 'Form 2',
      section: 'B',
      parentId: 'parent_2',
      feeBalance: 0,
      controlNumber: '992608765432',
      status: 'active',
      createdAt: '2026-01-12T09:30:00Z',
      metadata: {
        strongSubject: 'English'
      }
    }
  ],
  classes: [
    { id: 'class_1', name: 'Form 4', section: 'A', teacherId: 'teacher_1', capacity: 45 },
    { id: 'class_2', name: 'Form 2', section: 'B', teacherId: 'teacher_2', capacity: 40 }
  ],
  fees: [],
  payments: [],
  exams: [
    {
      id: 'exam_1',
      title: 'Mid-Term',
      term: 1,
      year: 2026,
      classId: 'Form 4',
      subjectId: 'Mathematics',
      maxMarks: 100,
      date: '2026-05-15',
      reminderDays: 3,
      reminderType: 'both'
    },
    {
      id: 'exam_2',
      title: 'CA',
      term: 1,
      year: 2026,
      classId: 'Form 2',
      subjectId: 'English',
      maxMarks: 50,
      date: '2026-05-18',
      reminderDays: 1,
      reminderType: 'in-app'
    },
    {
      id: 'exam_3',
      title: 'Terminal',
      term: 1,
      year: 2026,
      classId: 'Form 4',
      subjectId: 'Physics',
      maxMarks: 100,
      date: '2026-05-20',
      reminderDays: 7,
      reminderType: 'email'
    }
  ],
  results: [
    {
      id: 'res_1',
      examId: 'exam_3',
      studentId: 'stud_1',
      marks: 88,
      grade: 'A',
      remarks: 'Excellent work!',
      feedback: 'Highly impressed with your understanding of thermodynamics and mechanics. Your laboratory reports are detailed and scientifically sound. Mwinyi, continue this level of dedication.'
    },
    {
      id: 'res_2',
      examId: 'exam_1',
      studentId: 'stud_1',
      marks: 75,
      grade: 'B',
      remarks: 'Steady progress',
      feedback: 'Good grasp of algebra, but needs more practice in geometry to reach an A grade.'
    }
  ],
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
    { 
      id: 'sub_1', 
      name: 'Mathematics', 
      code: 'MATH', 
      levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
      description: 'The mathematics curriculum focus on developing logical reasoning, problem-solving skills, and abstract thinking. It covers algebraic concepts, geometry, trigonometry, and statistics essential for NECTA standards.',
      learningObjectives: [
        'Master core algebraic manipulations and equation solving',
        'Apply geometric theorems to physical and theoretical structures',
        'Understand and interpret complex statistical datasets',
        'Develop advanced trigonometric modeling capabilities'
      ]
    },
    { 
      id: 'sub_2', 
      name: 'Physics', 
      code: 'PHYS', 
      levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
      description: 'This module explores the fundamental laws governing the universe, from mechanics to quantum theory. Laboratory work is emphasized to bridge the gap between theoretical calculations and physical reality.',
      learningObjectives: [
        'Understand the laws of motion and their applications in engineering',
        'Explore the properties of light, sound, and electromagnetism',
        'Conduct rigorous experimental investigations and data analysis',
        'Master the principles of energy transformation and conservation'
      ]
    },
    { 
      id: 'sub_3', 
      name: 'Biology', 
      code: 'BIOL', 
      levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
      description: 'Biology investigates the complexity of living organisms and their interactions with the environment. The focus is on cellular biology, genetics, ecology, and human physiology within the Tanzanian context.',
      learningObjectives: [
        'Analyze the structures and functions of plant and animal cells',
        'Understand the mechanisms of inheritance and genetic variation',
        'Examine ecological systems and conservation strategies',
        'Apply biological knowledge to health and sanitation challenges'
      ]
    },
    { 
      id: 'sub_4', 
      name: 'English', 
      code: 'ENGL', 
      levels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
      description: 'The English language curriculum enhances communicative competence, literary appreciation, and critical analysis. It prepares students for academic excellence and effective global communication.',
      learningObjectives: [
        'Develop advanced writing skills for various academic and professional contexts',
        'Critically analyze diverse literary works and perspectives',
        'Master complex grammatical structures and vocabulary',
        'Enhance verbal communication and public speaking confidence'
      ]
    }
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
