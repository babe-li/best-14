/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'accountant' | 'librarian';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  twoFactorEnabled?: boolean;
  hasChangedInitialPassword?: boolean;
  lastLogin?: string;
  teacherMetadata?: {
    subjects: string[];
    employeeId?: string;
  };
  parentMetadata?: {
    childrenIds: string[];
  };
  studentMetadata?: {
    admissionNo: string;
    studentId: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  studentId?: string;
  subject?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  targetRoles: UserRole[]; // Who can see this
}

export type AcademicLevel = 
  | 'Form 1' | 'Form 2' | 'Form 3' | 'Form 4';

export interface Class {
  id: string;
  name: AcademicLevel;
  section: string; // e.g., 'A', 'B', 'Blue'
  teacherId: string; // Class teacher
  capacity: number;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female';
  classId: string;
  section?: string;
  parentId: string;
  photo?: string;
  feeBalance: number;
  controlNumber?: string;
  status: 'active' | 'alumni' | 'transferred';
  createdAt: string;
  updatedAt?: string;
  metadata?: {
    assignedTeacherId?: string;
    strongSubject?: string;
    imported?: boolean;
    parentPhone?: string;
  };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  levels: AcademicLevel[];
}

export interface Exam {
  id: string;
  title: string; // e.g., 'Terminal', 'Mid-Term', 'CA'
  term: 1 | 2;
  year: number;
  classId: string;
  subjectId: string;
  maxMarks: number;
  date: string;
  reminderDays?: number; // Days before exam to send reminder
  reminderType?: 'email' | 'in-app' | 'both' | 'none';
}

export interface Result {
  id: string;
  examId: string;
  studentId: string;
  marks: number;
  grade: string; // A, B, C, D, E, F
  remarks: string;
}

export interface FeeStructure {
  id: string;
  classId: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  items: {
    name: string;
    amount: number;
  }[];
  totalAmount: number;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: 'Cash' | 'M-Pesa' | 'Tigo Pesa' | 'Bank' | 'Mobile Money';
  date: string;
  receiptNo: string;
  isAutomated?: boolean;
  externalTransactionId?: string;
}

export interface Attendance {
  id: string;
  date: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  reason?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export type TaskCategory = 'Academic' | 'Administrative' | 'Grading' | 'Lesson Planning' | 'Student Follow-up' | 'Other';

export type PermissionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired';

export interface PermissionRequest {
  id: string;
  studentId: string;
  parentId: string;
  reason: string;
  type: 'Medical' | 'Personal' | 'Other';
  startDate: string;
  endDate: string;
  status: PermissionStatus;
  reviewedBy?: string; // staff ID
  reviewNote?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  creatorId: string;
  assigneeId: string; // User ID or Student ID
  assigneeType: 'student' | 'teacher' | 'staff';
  category: TaskCategory;
  createdAt: string;
  updatedAt: string;
  completionPercentage: number;
}

export interface TimetableEntry {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subjectId: string;
  teacherId: string;
  classId: string;
  room?: string;
}
