/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  UserPlus, 
  Download, 
  Trash2, 
  Edit2, 
  User as UserIcon,
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  X, 
  MessageSquare, 
  UserCheck, 
  Zap, 
  Globe, 
  RefreshCw, 
  CreditCard, 
  Printer, 
  History, 
  TrendingUp, 
  Wallet, 
  FileText, 
  Upload, 
  FileDown, 
  AlertTriangle, 
  Trophy,
  Clock, 
  FlaskConical,
  Calculator,
  BookOpen,
  LogOut,
  MessageCircle,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { storageService } from '../services/storageService';
import { type Student, type Class, type User, type AcademicLevel } from '../types';
import { cn, generateId, formatCurrency } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';
import { calculateDivision } from '../lib/nectaUtils';

export const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [payments, setPayments] = useState<any[]>([]); // To calculate ledger
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [importData, setImportData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({
    name: -1,
    gender: -1,
    dob: -1,
    class_level: -1,
    parent_phone: -1
  });
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'academic' | 'finance' | 'attendance' | 'remarks'>('info');
  const [attendanceFilters, setAttendanceFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [currentUser] = useState(storageService.getCurrentUser());
  const [db, setDb] = useState(storageService.getDB());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assignedTeacherId, setAssignedTeacherId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [updatedStudentId, setUpdatedStudentId] = useState<string | null>(null);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    gender: 'Male' as const,
    classId: '',
    section: '',
    dob: '',
    parentId: '',
    strongSubject: '',
    status: 'active' as Student['status']
  });

  const parentUsers = db.users.filter(u => u.role === 'parent');

  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isParent = currentUser?.role === 'parent';
  const isStudent = currentUser?.role === 'student';

  const canModify = isAdmin;
  const canViewPerformance = isAdmin || isTeacher || isParent || isStudent;

  useEffect(() => {
    const database = storageService.getDB();
    setDb(database);
    
    let studentList = database.students;
    if (isParent && currentUser) {
      studentList = database.students.filter(s => s.parentId === currentUser.id);
    } else if (isStudent && currentUser) {
      // Assuming a simple email match or similar if direct ID isn't set
      studentList = database.students.filter(s => s.admissionNo === currentUser.phone || s.id === currentUser.id);
    }
    
    setStudents(studentList);
    setClasses(database.classes);
    setPayments(database.payments);
    setAvailableSections(database.settings?.sections || ['A', 'B', 'C']);
  }, [currentUser]);

  useEffect(() => {
    if (updatedStudentId) {
      const timer = setTimeout(() => setUpdatedStudentId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [updatedStudentId]);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const db = storageService.getDB();
    
    // Create new student
    const student: Student = {
      id: generateId(),
      admissionNo: `ADM/${new Date().getFullYear()}/${(db.students.length + 1).toString().padStart(3, '0')}`,
      name: newStudent.name,
      dob: newStudent.dob,
      gender: newStudent.gender,
      classId: newStudent.classId,
      section: newStudent.section,
      parentId: newStudent.parentId || 'parent-placeholder',
      feeBalance: 0,
      controlNumber: storageService.generateControlNumber(newStudent.name),
      status: newStudent.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        strongSubject: newStudent.strongSubject
      }
    };

    // Create a corresponding User account for the student
    const studentUser: User = {
      id: generateId(),
      name: student.name,
      email: student.admissionNo,
      password: student.admissionNo,
      role: 'student',
      avatar: student.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      studentMetadata: {
        admissionNo: student.admissionNo,
        studentId: student.id
      }
    };

    const updatedStudents = [...db.students, student];
    const updatedUsers = [...db.users, studentUser];
    
    storageService.saveDB({ ...db, students: updatedStudents, users: updatedUsers });
    
    setStudents(updatedStudents);
    setUpdatedStudentId(student.id);
    setIsAddModalOpen(false);
    setNewStudent({ name: '', gender: 'Male', classId: '', section: '', dob: '', parentId: '', strongSubject: '', status: 'active' });
    
    // Notify about the new account
    alert(`Student added! Student can login with:\nAdmission No: ${student.admissionNo}\nPassword: ${student.admissionNo}`);
  };

  const generateControlNumber = (studentId: string) => {
    const db = storageService.getDB();
    const updatedStudents = db.students.map(s => {
      if (s.id === studentId) {
        return { 
          ...s, 
          controlNumber: storageService.generateControlNumber(s.name),
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    });
    storageService.saveDB({ ...db, students: updatedStudents });
    setStudents(updatedStudents);
    setUpdatedStudentId(studentId);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const db = storageService.getDB();
    const updatedStudents = db.students.map(s => 
      s.id === editingStudent.id ? { ...editingStudent, updatedAt: new Date().toISOString() } : s
    );

    storageService.saveDB({ ...db, students: updatedStudents });
    setStudents(updatedStudents);
    setUpdatedStudentId(editingStudent.id);
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleOpenAssign = (student: Student) => {
    setSelectedStudent(student);
    setIsAssignModalOpen(true);
  };

  const handleOpenPerformance = (student: Student) => {
    setSelectedStudent(student);
    setIsPerformanceModalOpen(true);
  };

  const handleOpenLedger = (student: Student) => {
    setSelectedStudent(student);
    setIsLedgerModalOpen(true);
  };

  const handleOpenAttendance = (student: Student) => {
    setSelectedStudent(student);
    setIsAttendanceModalOpen(true);
  };

  const handleOpenDetail = (student: Student, tab: 'info' | 'academic' | 'finance' | 'attendance' = 'info') => {
    setSelectedStudent(student);
    setActiveTab(tab);
    setIsDetailModalOpen(true);
  };

  const handleAssignTeacher = () => {
    if (!selectedStudent || !assignedTeacherId) return;
    
    const db = storageService.getDB();
    const updatedStudents = db.students.map(s => {
      if (s.id === selectedStudent.id) {
        return { 
          ...s, 
          metadata: { ...s.metadata, assignedTeacherId },
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    });
    
    storageService.saveDB({ ...db, students: updatedStudents });
    setStudents(updatedStudents);
    setUpdatedStudentId(selectedStudent.id);
    setIsAssignModalOpen(false);
    setSelectedStudent(null);
    setAssignedTeacherId('');
  };
  
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvContent = event.target?.result as string;
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        alert("CSV file must contain at least a header and one data row.");
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));
      
      setCsvHeaders(headers);
      setImportData(dataRows);
      
      // Try to auto-map based on common keywords
      const initialMapping: Record<string, number> = {
        name: headers.findIndex(h => h.toLowerCase().includes('name')),
        gender: headers.findIndex(h => h.toLowerCase().includes('gender') || h.toLowerCase() === 'sex'),
        dob: headers.findIndex(h => h.toLowerCase().includes('birth') || h.toLowerCase().includes('dob') || h.toLowerCase().includes('date')),
        class_level: headers.findIndex(h => h.toLowerCase().includes('class') || h.toLowerCase().includes('level') || h.toLowerCase().includes('grade')),
        parent_phone: headers.findIndex(h => h.toLowerCase().includes('parent') || h.toLowerCase().includes('phone') || h.toLowerCase().includes('contact'))
      };
      
      setColumnMapping(initialMapping);
      setIsMappingModalOpen(true);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleMappedImport = () => {
    // Validate mapping
    const requiredFields = ['name', 'gender', 'dob', 'class_level'];
    const unmappedRequested = requiredFields.filter(f => columnMapping[f] === -1);
    
    if (unmappedRequested.length > 0) {
      alert(`Please map the following required fields: ${unmappedRequested.join(', ')}`);
      return;
    }

    const db = storageService.getDB();
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const newStudentsList: Student[] = [];
    const newUsersList: User[] = [];

    importData.forEach((row, rowIndex) => {
      const getVal = (field: string) => row[columnMapping[field]] || '';
      
      const name = getVal('name');
      const gender = getVal('gender');
      const dob = getVal('dob');
      const classLevel = getVal('class_level');
      const parentPhone = getVal('parent_phone');

      // Validation
      if (!name || !gender || !dob || !classLevel) {
        failedCount++;
        errors.push(`Row ${rowIndex + 2}: Missing required fields.`);
        return;
      }

      const normalizedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      if (normalizedGender !== 'Male' && normalizedGender !== 'Female') {
        failedCount++;
        errors.push(`Row ${rowIndex + 2}: Invalid gender "${gender}". Must be Male or Female.`);
        return;
      }

      if (!SCHOOL_CONFIG.academicLevels.includes(classLevel as any)) {
        failedCount++;
        errors.push(`Row ${rowIndex + 2}: Invalid class level "${classLevel}".`);
        return;
      }

      // Find or create parent if phone is provided
      let parentId = 'parent-placeholder';
      if (parentPhone) {
        const existingParent = db.users.find(u => u.role === 'parent' && u.phone === parentPhone);
        if (existingParent) {
          parentId = existingParent.id;
        } else {
          // Potentially create an on-the-fly parent or just use placeholder
          // For now, we'll stick to placeholder or a simple search
        }
      }

      // Create student
      const student: Student = {
        id: generateId(),
        admissionNo: `ADM/${new Date().getFullYear()}/${(db.students.length + newStudentsList.length + 1).toString().padStart(3, '0')}`,
        name: name,
        dob: dob,
        gender: normalizedGender as 'Male' | 'Female',
        classId: classLevel as any,
        section: 'A', // Default
        parentId: parentId,
        feeBalance: 0,
        controlNumber: storageService.generateControlNumber(name),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          imported: true,
          parentPhone: parentPhone
        }
      };

      // Create user
      const studentUser: User = {
        id: generateId(),
        name: student.name,
        email: student.admissionNo,
        password: student.admissionNo,
        role: 'student',
        avatar: student.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        studentMetadata: {
          admissionNo: student.admissionNo,
          studentId: student.id
        }
      };

      newStudentsList.push(student);
      newUsersList.push(studentUser);
      successCount++;
    });

    if (newStudentsList.length > 0) {
      const updatedStudents = [...db.students, ...newStudentsList];
      const updatedUsers = [...db.users, ...newUsersList];
      storageService.saveDB({ ...db, students: updatedStudents, users: updatedUsers });
      setStudents(updatedStudents);
    }

    setImportStatus({
      total: importData.length,
      success: successCount,
      failed: failedCount,
      errors
    });
    
    setIsMappingModalOpen(false);
    setIsImportModalOpen(true);
  };

  const downloadImportTemplate = () => {
    const csvContent = "name,gender,dob,class_level,parent_phone\nJuma Ali,Male,2015-05-12,Form 1,+255700000000";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
  };

  const batchGenerateControlNumbers = () => {
    if (!isAdmin) return;
    if (!window.confirm('This will regenerate control numbers for all students for the current year. Continue?')) return;
    
    const database = storageService.getDB();
    const updatedStudents = database.students.map(s => ({
      ...s,
      controlNumber: storageService.generateControlNumber(s.name),
      updatedAt: new Date().toISOString()
    }));
    
    storageService.saveDB({ ...database, students: updatedStudents });
    setStudents(updatedStudents);
    setDb({ ...database, students: updatedStudents });
    setUpdatedStudentId('batch');
  };

  const generatePDF = async (studentToPrint?: Student) => {
    setIsExporting(true);
    const doc = new jsPDF('p', 'mm', 'a4');
    const studentsToProcess = studentToPrint ? [studentToPrint] : filteredStudents;

    // Create a temporary container for ID card rendering
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '85.6mm'; // Standard CR80 ID Card
    container.style.height = '53.98mm';
    document.body.appendChild(container);

    try {
      for (let i = 0; i < studentsToProcess.length; i++) {
        const student = studentsToProcess[i];
        
        // Dynamic HTML for ID Card
        container.innerHTML = `
          <div style="width: 85.6mm; height: 53.98mm; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Inter', sans-serif; position: relative; overflow: hidden; padding: 0;">
            <div style="background: #0f172a; color: white; padding: 6px 12px; display: flex; align-items: center; justify-content: space-between;">
              <div style="font-weight: 800; font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em;">${SCHOOL_CONFIG.name}</div>
              <div style="font-weight: 800; font-size: 6px; text-transform: uppercase;">Student Identity</div>
            </div>
            
            <div style="display: flex; padding: 12px; gap: 12px;">
              <div style="width: 20mm; height: 24mm; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              
              <div style="flex: 1;">
                <div style="margin-bottom: 4px;">
                  <span style="font-size: 6px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 1px;">Full Name</span>
                  <span style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${student.name}</span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div>
                    <span style="font-size: 6px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 1px;">Admission No</span>
                    <span style="font-size: 8px; font-weight: 800; color: #334155;">${student.admissionNo}</span>
                  </div>
                  <div>
                    <span style="font-size: 6px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 1px;">Class & Section</span>
                    <span style="font-size: 8px; font-weight: 800; color: #334155;">${student.classId}${student.section ? ` - ${student.section}` : ''}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 12px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 6px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 1px;">Control Number</span>
                <span style="font-size: 8px; font-weight: 800; color: #3b82f6;">#${student.controlNumber || 'PENDING'}</span>
              </div>
              <div style="font-size: 10px; font-weight: 800; color: #cbd5e1; letter-spacing: 0.2em;">${SCHOOL_CONFIG.schoolName.slice(0, 15)}</div>
            </div>
          </div>
        `;

        const canvas = await html2canvas(container, {
          scale: 3, // High DPI
          useCORS: true,
          backgroundColor: null
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Center ID card on A4 (210x297mm) or stack them
        // For individual, center horizontally/vertically
        // For bulk, stack 8 per page
        if (!studentToPrint) {
          const xPos = (i % 2) * 95 + 10; // 2 per row
          const yPos = Math.floor((i % 8) / 2) * 65 + 20; // 4 rows per page
          
          if (i > 0 && i % 8 === 0) doc.addPage();
          doc.addImage(imgData, 'PNG', xPos, yPos, 85.6, 53.98);
        } else {
          doc.addImage(imgData, 'PNG', (210 - 85.6) / 2, 40, 85.6, 53.98);
        }
      }

      doc.save(studentToPrint ? `ID_${studentToPrint.admissionNo.replace(/\//g, '_')}.pdf` : `Students_ID_Cards_${new Date().getFullYear()}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
    } finally {
      document.body.removeChild(container);
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedClass('all');
    setSelectedSection('all');
    setSelectedStatus('all');
  };

  const isFiltered = searchTerm !== '' || selectedClass !== 'all' || selectedSection !== 'all' || selectedStatus !== 'all';

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.classId === selectedClass;
    const matchesSection = selectedSection === 'all' || s.section === selectedSection;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return matchesSearch && matchesClass && matchesSection && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedSection, selectedStatus]);

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Registry</h1>
          <p className="text-slate-400 text-sm font-medium">Manage admissions, profiles, and class allocations.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button 
              onClick={batchGenerateControlNumbers}
              className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
              title="Sync Control Numbers for the current year"
            >
              <RefreshCw size={14} className={cn(updatedStudentId === 'batch' && "animate-spin")} />
              Sync Codes
            </button>
          )}
          {isAdmin && (
            <label className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all cursor-pointer">
              <Upload size={16} />
              Bulk Import
              <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            </label>
          )}
          {isAdmin && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
            >
              <UserPlus size={16} />
              Add Student
            </button>
          )}
          <button 
            onClick={() => generatePDF()}
            disabled={isExporting || filteredStudents.length === 0}
            className="p-2.5 text-slate-400 bg-white border border-slate-200 rounded-xl hover:text-primary transition-colors disabled:opacity-50"
            title="Bulk ID Card Export"
          >
            {isExporting ? <RefreshCw size={20} className="animate-spin" /> : <Printer size={20} />}
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-medium transition-all"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Academic Level</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all min-w-[140px]"
              >
                <option value="all">All Classes</option>
                {SCHOOL_CONFIG.academicLevels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Section</label>
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all min-w-[120px]"
              >
                <option value="all">All Sections</option>
                {availableSections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all min-w-[120px]"
              >
                <option value="all">Any Status</option>
                <option value="active">Active</option>
                <option value="alumni">Alumni</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>
            {isFiltered && (
              <div className="flex flex-col gap-1">
                <div className="h-[13px]" /> {/* Spacer for label */}
                <button 
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-3 text-red-500 bg-red-50 border border-red-100 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors"
                >
                  <X size={16} />
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isFiltered && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Filters:</span>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="px-2 py-1 bg-primary/5 text-primary text-[9px] font-bold rounded-lg border border-primary/10 flex items-center gap-1">
                  Search: {searchTerm}
                  <X size={10} className="cursor-pointer" onClick={() => setSearchTerm('')} />
                </span>
              )}
              {selectedClass !== 'all' && (
                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded-lg border border-indigo-100 flex items-center gap-1">
                  Level: {selectedClass}
                  <X size={10} className="cursor-pointer" onClick={() => setSelectedClass('all')} />
                </span>
              )}
              {selectedSection !== 'all' && (
                <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold rounded-lg border border-amber-100 flex items-center gap-1">
                  Section: {selectedSection}
                  <X size={10} className="cursor-pointer" onClick={() => setSelectedSection('all')} />
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-lg border border-emerald-100 flex items-center gap-1">
                  Status: {selectedStatus}
                  <X size={10} className="cursor-pointer" onClick={() => setSelectedStatus('all')} />
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admission No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Balance</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length > 0 ? paginatedStudents.map((student) => {
                const isRecentlyUpdated = updatedStudentId === student.id || (
                  student.updatedAt && (new Date().getTime() - new Date(student.updatedAt).getTime() < 5000)
                );

                return (
                  <motion.tr 
                    key={student.id} 
                    initial={false}
                    animate={isRecentlyUpdated ? { 
                      backgroundColor: ['rgba(248, 250, 252, 0.8)', 'rgba(79, 70, 229, 0.05)', 'rgba(248, 250, 252, 0.8)'],
                      scale: [1, 1.002, 1],
                    } : {}}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className={cn(
                      "hover:bg-slate-50/80 transition-colors group relative cursor-pointer",
                      isRecentlyUpdated && "z-10 shadow-sm"
                    )}
                    onClick={() => handleOpenDetail(student)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                          {student.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{student.name}</p>
                            {student.metadata?.strongSubject && (
                              <span 
                                title={`Strong in ${student.metadata.strongSubject}`}
                                className="p-1 bg-slate-50 border border-slate-100 rounded-md text-slate-400"
                              >
                                {student.metadata.strongSubject.toLowerCase().includes('math') ? <Calculator size={10} className="text-blue-500" /> :
                                 (student.metadata.strongSubject.toLowerCase().includes('sci') || student.metadata.strongSubject.toLowerCase().includes('phys') || student.metadata.strongSubject.toLowerCase().includes('chem') || student.metadata.strongSubject.toLowerCase().includes('bio')) ? <FlaskConical size={10} className="text-emerald-500" /> :
                                 <BookOpen size={10} className="text-amber-500" />}
                              </span>
                            )}
                            {student.metadata?.assignedTeacherId && !student.metadata?.strongSubject && (
                              <span title="Assigned Liaison" className="p-1 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-500">
                                <UserCheck size={10} />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student.gender}</p>
                            {student.controlNumber && (
                              <span className="text-[8px] font-bold text-primary bg-primary/5 px-1 rounded border border-primary/10 tracking-widest">#{student.controlNumber}</span>
                            )}
                          </div>
                          {student.metadata?.assignedTeacherId && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-bold text-indigo-500 uppercase tracking-tight bg-indigo-50/50 w-fit px-1.5 py-0.5 rounded border border-indigo-100/50">
                              <UserCheck size={10} />
                              Liaison: {student.metadata.assignedTeacherId === 't1' ? 'Mwl. Julius' : student.metadata.assignedTeacherId === 't2' ? 'Mwl. Farida' : 'Faculty Assigned'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      {student.admissionNo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-tight">
                      <GraduationCap size={14} className="text-slate-300" />
                      {student.classId} {student.section && <span className="text-primary ml-1">({student.section})</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "text-[11px] font-extrabold uppercase tracking-tight",
                      student.feeBalance > 0 ? "text-red-500" : "text-emerald-500"
                    )}>
                      {formatCurrency(student.feeBalance)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <motion.span 
                      key={student.status}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors",
                        student.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        student.status === 'alumni' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                        "bg-slate-50 text-slate-600 border-slate-100"
                      )}
                    >
                      {student.status === 'active' && <CheckCircle2 size={10} />}
                      {student.status === 'alumni' && <GraduationCap size={10} />}
                      {student.status === 'transferred' && <LogOut size={10} />}
                      {student.status}
                    </motion.span>
                  </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canViewPerformance && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(student, 'academic');
                            }}
                            title="Academic Performance Report"
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-all"
                          >
                            <TrendingUp size={14} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(student, 'finance');
                          }}
                          title="View Financial History"
                          className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-all"
                        >
                          <History size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(student, 'attendance');
                          }}
                          title="Detailed Attendance History"
                          className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all"
                        >
                          <Clock size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            generateControlNumber(student.id);
                          }}
                          title="Generate GePG Control Number"
                          className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded transition-all"
                        >
                          <Zap size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            generatePDF(student);
                          }}
                          title="Generate Student ID Card"
                          className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all"
                        >
                          <CreditCard size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssign(student);
                          }}
                          title="Assign Teacher Inquiry"
                          className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all"
                        >
                          <UserCheck size={14} />
                        </button>
                      <button 
                        title="Message Parent"
                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-all"
                      >
                        <MessageSquare size={14} />
                      </button>
                      {isAdmin && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(student);
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded transition-all"
                            title="Edit Student Profile"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition-all">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="text-slate-900">{filteredStudents.length}</span> students
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Only show current page, first, last, and neighbors if many pages
                  const isVisible = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  
                  if (!isVisible) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-slate-300 px-1">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-8 h-8 rounded-xl text-[10px] font-black transition-all",
                        currentPage === page 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm"
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Student Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDetailModalOpen(false)} 
              className="fixed inset-0 bg-slate-900/60 z-[120] backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 inset-y-4 sm:inset-x-auto sm:inset-y-auto sm:m-auto w-full sm:max-w-4xl sm:h-fit max-h-[95vh] bg-white z-[130] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-8 bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center font-black text-3xl border border-white/20 shadow-2xl">
                    {selectedStudent.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none mb-2">{selectedStudent.name}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">{selectedStudent.admissionNo}</span>
                      <span className="px-3 py-1 bg-primary/20 text-primary-light rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20">{selectedStudent.classId} {selectedStudent.section}</span>
                      {(() => {
                        const results = db.results.filter(r => r.studentId === selectedStudent.id);
                        const necta = calculateDivision(results, selectedStudent.classId as AcademicLevel);
                        if (necta === 'N/A') return null;
                        return (
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                            DIV {necta.division} ({necta.points} Pts)
                          </span>
                        );
                      })()}
                      <span className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                        selectedStudent.status === 'active' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-red-500/20 text-red-400 border-red-500/20"
                      )}>{selectedStudent.status}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"><X size={24} /></button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 px-8 py-2 bg-slate-50/50 border-b border-slate-100 overflow-x-auto no-scrollbar">
                {(['info', 'academic', 'finance', 'attendance', 'remarks'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                      activeTab === tab ? "text-primary" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab === 'remarks' ? 'Teacher Remarks' : tab}
                    {activeTab === tab && (
                      <motion.div layoutId="detail-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-8 grow overflow-y-auto bg-slate-50/30 custom-scrollbar">
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-8">
                       <div>
                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <FileText size={14} className="text-primary" />
                           Identity Matrix
                         </h4>
                         <div className="space-y-4">
                           {[
                             { label: 'Control Number', value: `#${selectedStudent.controlNumber || 'PENDING'}`, highlight: true },
                             { label: 'Date of Birth', value: new Date(selectedStudent.dob).toLocaleDateString('en-TZ', { day: '2-digit', month: 'long', year: 'numeric' }) },
                             { label: 'Gender', value: selectedStudent.gender },
                             { label: 'Enrollment Date', value: new Date(selectedStudent.createdAt).toLocaleDateString() },
                           ].map((item, idx) => (
                             <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                               <span className={cn("text-xs font-black uppercase tracking-tight", item.highlight ? "text-primary italic" : "text-slate-900")}>{item.value}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>

                    <div className="space-y-8">
                       <div>
                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <UserIcon size={14} className="text-primary" />
                           Relation & Staffing
                         </h4>
                         <div className="space-y-4">
                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-all duration-700" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">Assigned Liaison</p>
                              {selectedStudent.metadata?.assignedTeacherId ? (
                                <div className="flex items-center gap-4 relative z-10">
                                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100">
                                    <UserCheck size={24} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                      {selectedStudent.metadata.assignedTeacherId === 't1' ? 'Mwl. Julius Kambarage' : 
                                       selectedStudent.metadata.assignedTeacherId === 't2' ? 'Mwl. Farida Juma' : 'Staff Assigned'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Faculty Representative</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs font-bold text-slate-300 italic py-2">No official liaison mandated.</p>
                              )}
                            </div>

                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-all duration-700" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">Parent/Guardian Link</p>
                              <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100">
                                  <UserIcon size={24} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                    {db.users.find(u => u.id === selectedStudent.parentId)?.name || 'Standard Guardian'}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {db.users.find(u => u.id === selectedStudent.parentId)?.email || 'Contact Info Not Logged'}
                                  </p>
                                </div>
                              </div>
                            </div>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'academic' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                              <TrendingUp size={14} className="text-primary" />
                              Performance Trajectory
                            </h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cross-Assessment Aggregate Trends</p>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[8px] font-bold text-slate-400 uppercase">Score %</span>
                             </div>
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={db.results
                              .filter(r => r.studentId === selectedStudent.id)
                              .sort((a, b) => {
                                const examA = db.exams.find(e => e.id === a.examId);
                                const examB = db.exams.find(e => e.id === b.examId);
                                return (examA?.date || '').localeCompare(examB?.date || '');
                              })
                              .map(r => ({
                                name: db.exams.find(e => e.id === r.examId)?.title.split(' ')[0] || 'Exam',
                                score: r.marks
                              }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                domain={[0, 100]}
                              />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: '#0f172a', 
                                  border: 'none', 
                                  borderRadius: '12px', 
                                  color: '#fff',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  textTransform: 'uppercase'
                                }}
                                itemStyle={{ color: '#4f46e5' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="score" 
                                stroke="#4f46e5" 
                                strokeWidth={4} 
                                dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 8, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Academic Points</p>
                          <p className="text-3xl font-black text-slate-900 italic tracking-tighter">
                            {(() => {
                              const results = db.results.filter(r => r.studentId === selectedStudent.id);
                              const necta = calculateDivision(results, selectedStudent.classId as AcademicLevel);
                              return necta === 'N/A' ? 'N/A' : `${necta.points} pts`;
                            })()}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Best 7 Subjects</p>
                        </div>
                        <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 blur-xl" />
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 relative z-10">NECTA DIVISION</p>
                          <p className="text-4xl font-black text-slate-900 italic relative z-10">
                            {(() => {
                              const results = db.results.filter(r => r.studentId === selectedStudent.id);
                              const necta = calculateDivision(results, selectedStudent.classId as AcademicLevel);
                              return necta === 'N/A' ? '-' : `DIV ${necta.division}`;
                            })()}
                          </p>
                          <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest mt-1 relative z-10">Calculated Standing</p>
                        </div>
                        <div className="p-6 bg-black rounded-[32px] shadow-xl text-white relative overflow-hidden">
                          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mb-12 blur-xl" />
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 relative z-10">Academic Excellence</p>
                          <p className="text-xl font-black uppercase italic tracking-tight relative z-10">
                            {(() => {
                              const results = db.results.filter(r => r.studentId === selectedStudent.id);
                              if (!results.length) return 'N/A';
                              const avg = results.reduce((acc, r) => acc + r.marks, 0) / results.length;
                              if (avg >= 75) return 'DISTINCTION';
                              if (avg >= 65) return 'VERY GOOD';
                              if (avg >= 45) return 'CREDIT';
                              return 'PASS';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm pt-2">
                      <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pedagogical Assessment Log</h4>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{db.results.filter(r => r.studentId === selectedStudent.id).length} Entries Captured</span>
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <th className="px-8 py-5">Assessment Cycle</th>
                            <th className="px-8 py-5">Intellectual Domain</th>
                            <th className="px-8 py-5 text-center">Metric</th>
                            <th className="px-8 py-5 text-right">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {db.results.filter(r => r.studentId === selectedStudent.id).map(result => {
                            const exam = db.exams.find(e => e.id === result.examId);
                            return (
                              <tr key={result.id} className="text-xs font-bold text-slate-700 group hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-5 uppercase tracking-tight">{exam?.title || 'Unknown'}</td>
                                <td className="px-8 py-5 text-slate-400 uppercase tracking-widest text-[10px]">{exam?.subjectId || 'N/A'}</td>
                                <td className="px-8 py-5 text-center font-black text-slate-900 italic tracking-tighter">{result.marks}%</td>
                                <td className="px-8 py-5 text-right">
                                  <span className={cn(
                                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                    ['A', 'B'].includes(result.grade) ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    ['C', 'D'].includes(result.grade) ? "bg-amber-50 text-amber-600 border-amber-100" :
                                    "bg-red-50 text-red-600 border-red-100"
                                  )}>
                                    {result.grade}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {db.results.filter(r => r.studentId === selectedStudent.id).length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-8 py-16 text-center text-slate-300 italic font-black uppercase tracking-[0.2em] text-[10px]">
                                Zero pedagogical entries found in system
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'finance' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">
                           <Wallet size={14} className="text-red-400" />
                           Structural Liability
                        </p>
                        <p className={cn(
                          "text-4xl font-black tracking-tight italic relative z-10",
                          selectedStudent.feeBalance > 0 ? "text-red-500" : "text-emerald-500"
                        )}>
                          {formatCurrency(selectedStudent.feeBalance)}
                        </p>
                      </div>
                      <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">
                           <CheckCircle2 size={14} />
                           Aggregate Capital Inflow
                        </p>
                        <p className="text-4xl font-black text-emerald-600 tracking-tight italic relative z-10">
                          {formatCurrency(
                            payments
                              .filter(p => p.studentId === selectedStudent.id)
                              .reduce((sum, p) => sum + p.amount, 0)
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
                        <History size={14} className="text-primary" />
                        Fiscal Ledger Logs
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-8 py-5">Timestamp</th>
                              <th className="px-8 py-5">Receipt ID</th>
                              <th className="px-8 py-5 text-center">Mechanism</th>
                              <th className="px-8 py-5 text-right">Inflow</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {payments.filter(p => p.studentId === selectedStudent.id).length > 0 ? (
                              payments
                                .filter(p => p.studentId === selectedStudent.id)
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((p) => (
                                  <tr key={p.id} className="text-xs font-bold hover:bg-slate-50/50">
                                    <td className="px-8 py-5 text-slate-500 tracking-tight italic">
                                      {new Date(p.date).toLocaleDateString('en-TZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-5 font-mono text-slate-900">{p.receiptNo}</td>
                                    <td className="px-8 py-5 text-center">
                                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-xl uppercase tracking-widest border border-slate-200">
                                        {p.method}
                                      </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-emerald-600">
                                      {formatCurrency(p.amount)}
                                    </td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-8 py-16 text-center text-slate-300 italic font-black uppercase tracking-[0.2em] text-[10px]">
                                  Zero financial transactions recorded in mainframe
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attendance' && (() => {
                  const filteredAttendance = (db.attendance || []).filter(a => {
                    const matchesStudent = a.studentId === selectedStudent.id;
                    const matchesStatus = attendanceFilters.status === 'all' || a.status === attendanceFilters.status;
                    const matchesStartDate = !attendanceFilters.startDate || a.date >= attendanceFilters.startDate;
                    const matchesEndDate = !attendanceFilters.endDate || a.date <= attendanceFilters.endDate;
                    return matchesStudent && matchesStatus && matchesStartDate && matchesEndDate;
                  });

                  return (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col lg:flex-row gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporal Search Scope (Date Range)</label>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="date" 
                              value={attendanceFilters.startDate}
                              onChange={(e) => setAttendanceFilters({...attendanceFilters, startDate: e.target.value})}
                              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                          </div>
                          <span className="text-slate-300 font-black text-[10px] uppercase tracking-widest">TO</span>
                          <div className="relative flex-1">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="date" 
                              value={attendanceFilters.endDate}
                              onChange={(e) => setAttendanceFilters({...attendanceFilters, endDate: e.target.value})}
                              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-[200px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Compliance Status</label>
                        <div className="relative">
                          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <select 
                            value={attendanceFilters.status}
                            onChange={(e) => setAttendanceFilters({...attendanceFilters, status: e.target.value})}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                          >
                            <option value="all">Every Metric</option>
                            <option value="present">Present (Normal)</option>
                            <option value="absent">Absent (Intervention)</option>
                            <option value="late">Late (Tardy)</option>
                          </select>
                        </div>
                      </div>
                      {(attendanceFilters.startDate || attendanceFilters.endDate || attendanceFilters.status !== 'all') && (
                        <div className="flex flex-col gap-1.5 lg:pt-[22px]">
                          <button 
                            onClick={() => setAttendanceFilters({ status: 'all', startDate: '', endDate: '' })}
                            className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all active:scale-95"
                            title="Reset Observational Filters"
                          >
                            <RefreshCw size={18} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-1 space-y-4">
                        <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Registry Logs</p>
                          <p className="text-4xl font-black text-slate-900 italic">
                            {filteredAttendance.length}
                          </p>
                        </div>
                        <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 shadow-sm flex flex-col items-center">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Presence Index</p>
                          <p className="text-4xl font-black text-emerald-600 italic">
                            {filteredAttendance.length > 0 
                              ? Math.round((filteredAttendance.filter(a => a.status === 'present').length / filteredAttendance.length) * 100)
                              : 0}%
                          </p>
                        </div>
                        <div className="p-8 bg-red-50 rounded-[32px] border border-red-100 shadow-sm flex flex-col items-center">
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">Absence Count</p>
                          <p className="text-4xl font-black text-red-600 italic">
                            {filteredAttendance.filter(a => a.status === 'absent').length}
                          </p>
                        </div>
                      </div>

                      <div className="md:col-span-3 p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm">
                         <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                               <Clock size={14} className="text-primary" />
                               Attendance Distribution (Filtered)
                            </h4>
                         </div>
                         <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={[
                                 { name: 'Present', count: filteredAttendance.filter(a => a.status === 'present').length, color: '#10b981' },
                                 { name: 'Absent', count: filteredAttendance.filter(a => a.status === 'absent').length, color: '#ef4444' },
                                 { name: 'Late', count: filteredAttendance.filter(a => a.status === 'late').length, color: '#f59e0b' },
                               ]}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                  <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                  />
                                  <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                  />
                                  <RechartsTooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ 
                                      backgroundColor: '#0f172a', 
                                      border: 'none', 
                                      borderRadius: '12px', 
                                      color: '#fff',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      textTransform: 'uppercase'
                                    }}
                                  />
                                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                     {['#10b981', '#ef4444', '#f59e0b'].map((color, index) => (
                                       <Cell key={`cell-${index}`} fill={color} />
                                     ))}
                                  </Bar>
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm pt-2">
                       <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Observation Window Log</h4>
                          {filteredAttendance.length !== (db.attendance?.filter(a => a.studentId === selectedStudent.id).length || 0) && (
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest px-3 py-1 bg-primary/5 rounded-lg border border-primary/10">
                              Filtered Results: {filteredAttendance.length}
                            </span>
                          )}
                       </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest tracking-[0.2em]">
                            <th className="px-8 py-5">Observation Window</th>
                            <th className="px-8 py-5">Validation Status</th>
                            <th className="px-8 py-5 text-right">Anomalies / Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredAttendance
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .map(record => (
                            <tr key={record.id} className="text-xs font-bold hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 font-mono tracking-tight uppercase italic text-slate-500">
                                {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-8 py-5">
                                <span className={cn(
                                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                  record.status === 'present' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  record.status === 'late' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                  "bg-red-50 text-red-600 border-red-100"
                                )}>
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">
                                {record.reason || 'NOMINAL'}
                              </td>
                            </tr>
                          ))}
                          {filteredAttendance.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-8 py-16 text-center text-slate-300 italic font-black uppercase tracking-[0.2em] text-[10px]">
                                Zero occupancy logs captured for this criteria
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
              {activeTab === 'remarks' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="md:col-span-2 space-y-6">
                          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle size={14} className="text-primary" />
                            Pedagogical Counselor Notes
                          </h4>
                          <div className="space-y-4">
                             {[
                               { author: 'Mwl. Julius Kambarage', content: 'Outstanding progress in advanced calculus. Demonstrated strong abstract reasoning during the terminal assessment.', date: 'Today, 10:30 AM', category: 'Academic' },
                               { author: 'Mwl. Farida Juma', content: 'Consistent participation in class discussions. Language skills are improving significantly.', date: 'Yesterday', category: 'Conduct' },
                               { author: 'Class Master', content: 'Regular attendance observed. Leadership qualities emerging within the student council.', date: 'May 08, 2026', category: 'Holistic' }
                             ].map((remark, idx) => (
                               <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:border-primary/20 transition-all group">
                                  <div className="flex justify-between items-start mb-4">
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-primary font-black text-xs uppercase">
                                           {remark.author[0]}
                                        </div>
                                        <div>
                                           <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{remark.author}</p>
                                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{remark.date}</p>
                                        </div>
                                     </div>
                                     <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-lg">{remark.category}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                     {remark.content}
                                  </p>
                               </div>
                             ))}
                          </div>
                          
                          {isAdmin && (
                            <div className="p-8 bg-slate-900 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group">
                               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                               <div className="relative z-10">
                                  <h5 className="text-sm font-black text-white uppercase tracking-tight mb-4">Append Observation Entry</h5>
                                  <textarea 
                                    placeholder="Log professional pedagogical commentary..."
                                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                  />
                                  <button className="mt-4 w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">
                                     Submit Academic Log
                                  </button>
                               </div>
                            </div>
                          )}
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                             <TrendingUp size={14} className="text-primary" />
                             Strengths & Focus
                          </h4>
                          <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm space-y-6">
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Core Competencies</p>
                                <div className="flex flex-wrap gap-2">
                                   {['Logical Reasoning', 'Public Speaking', 'Peer Mentoring'].map(skill => (
                                     <span key={skill} className="px-3 py-1.5 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-xl border border-primary/10">{skill}</span>
                                   ))}
                                </div>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Intervention Zones</p>
                                <div className="flex flex-wrap gap-2">
                                   {['Time Management', 'Bio-Calculations'].map(skill => (
                                     <span key={skill} className="px-3 py-1.5 bg-red-50 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-100">{skill}</span>
                                   ))}
                                </div>
                             </div>
                          </div>

                          <div className="p-8 bg-gradient-to-br from-indigo-600 to-primary rounded-[40px] text-white shadow-xl shadow-primary/20">
                             <Trophy size={32} className="text-white/20 mb-4" />
                             <h4 className="text-lg font-black uppercase tracking-tight leading-none">Holistic <br /> Profile Standing</h4>
                             <div className="mt-6 flex items-end gap-2">
                                <span className="text-4xl font-black italic tracking-tighter">Gold</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 pb-1">Tier Achievement</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-8 py-6 bg-slate-900 border-t border-slate-800 flex justify-center shrink-0">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all shadow-xl shadow-black/20"
                >
                  Exit Detailed Protocol
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Performance Modal */}
      <AnimatePresence>
        {isPerformanceModalOpen && selectedStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPerformanceModalOpen(false)} className="fixed inset-0 bg-slate-900/60 z-[80] backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-3xl h-fit max-h-[90vh] bg-white z-[90] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <TrendingUp size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold uppercase tracking-tight">Academic Performance Report</h3>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">{selectedStudent.name} • {selectedStudent.admissionNo}</p>
                  </div>
                </div>
                <button onClick={() => setIsPerformanceModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Average Score</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {(() => {
                        const results = db.results.filter(r => r.studentId === selectedStudent.id);
                        if (!results.length) return '0.0%';
                        const avg = results.reduce((acc, r) => acc + r.marks, 0) / results.length;
                        return `${avg.toFixed(1)}%`;
                      })()}
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Assessments</p>
                    <p className="text-2xl font-extrabold text-primary">
                      {db.results.filter(r => r.studentId === selectedStudent.id).length}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Grade Level</p>
                    <p className="text-2xl font-extrabold text-emerald-600">DISTINCTION</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left order-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Assessment Entry</th>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4 text-center">Raw marks</th>
                        <th className="px-6 py-4 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {db.results.filter(r => r.studentId === selectedStudent.id).map(result => {
                        const exam = db.exams.find(e => e.id === result.examId);
                        return (
                          <tr key={result.id} className="text-xs font-bold text-slate-700">
                            <td className="px-6 py-4 uppercase tracking-tighter">{exam?.title || 'Unknown'}</td>
                            <td className="px-6 py-4 text-slate-400">{exam?.subjectId || 'N/A'}</td>
                            <td className="px-6 py-4 text-center">{result.marks}%</td>
                            <td className="px-6 py-4 text-right">
                              <span className={cn(
                                "px-2 py-1 rounded text-[10px] font-black",
                                ['A', 'B'].includes(result.grade) ? "bg-emerald-50 text-emerald-600" :
                                ['C', 'D'].includes(result.grade) ? "bg-amber-50 text-amber-600" :
                                "bg-red-50 text-red-600"
                              )}>
                                {result.grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {db.results.filter(r => r.studentId === selectedStudent.id).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-300 italic font-medium uppercase tracking-widest text-[10px]">
                            No academic records found for current cycle
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  onClick={() => setIsPerformanceModalOpen(false)}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
                >
                  Dismiss Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Attendance History Modal */}
      <AnimatePresence>
        {isAttendanceModalOpen && selectedStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAttendanceModalOpen(false)} className="fixed inset-0 bg-slate-900/60 z-[80] backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] bg-white z-[90] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-6 bg-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold uppercase tracking-tight">Attendance Audit History</h3>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">{selectedStudent.name} • {selectedStudent.admissionNo}</p>
                  </div>
                </div>
                <button onClick={() => setIsAttendanceModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto bg-slate-50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
                    <p className="text-xl font-black text-slate-900">
                      {db.attendance?.filter(a => a.studentId === selectedStudent.id).length || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Presence</p>
                    <p className="text-xl font-black text-emerald-600">
                      {Math.round((db.attendance?.filter(a => a.studentId === selectedStudent.id && a.status === 'present').length || 0) / (db.attendance?.filter(a => a.studentId === selectedStudent.id).length || 1) * 100)}%
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-right">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Absences</p>
                    <p className="text-xl font-black text-red-600">
                      {db.attendance?.filter(a => a.studentId === selectedStudent.id && a.status === 'absent').length || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                   <div className="flex-1 space-y-1.5 min-w-[140px]">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status Filter</label>
                      <select 
                        value={attendanceFilters.status}
                        onChange={(e) => setAttendanceFilters({...attendanceFilters, status: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                   </div>
                   <div className="space-y-1.5 flex-1 min-w-[140px]">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                      <input 
                        type="date"
                        value={attendanceFilters.startDate}
                        onChange={(e) => setAttendanceFilters({...attendanceFilters, startDate: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 outline-none"
                      />
                   </div>
                   <div className="space-y-1.5 flex-1 min-w-[140px]">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                      <input 
                        type="date"
                        value={attendanceFilters.endDate}
                        onChange={(e) => setAttendanceFilters({...attendanceFilters, endDate: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 outline-none"
                      />
                   </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-6 py-4">Date of Audit</th>
                          <th className="px-6 py-4">Verification</th>
                          <th className="px-6 py-4 text-right">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {db.attendance?.filter(a => {
                          const matchesStudent = a.studentId === selectedStudent.id;
                          const matchesStatus = attendanceFilters.status === 'all' || a.status === attendanceFilters.status;
                          const matchesStartDate = !attendanceFilters.startDate || a.date >= attendanceFilters.startDate;
                          const matchesEndDate = !attendanceFilters.endDate || a.date <= attendanceFilters.endDate;
                          return matchesStudent && matchesStatus && matchesStartDate && matchesEndDate;
                        }).sort((a, b) => b.date.localeCompare(a.date)).map(record => (
                          <tr key={record.id} className="text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono tracking-tight uppercase">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border",
                                record.status === 'present' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                record.status === 'late' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                "bg-red-50 text-red-600 border-red-100"
                              )}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-[10px] text-slate-400 font-medium italic">
                              {record.reason || 'No remarks provided'}
                            </td>
                          </tr>
                        ))}
                        {(!db.attendance || db.attendance.filter(a => a.studentId === selectedStudent.id).length === 0) && (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-slate-300 italic font-medium uppercase tracking-widest text-[10px]">
                              Zero occupancy records found for this candidate
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-white">
                <button 
                  onClick={() => setIsAttendanceModalOpen(false)}
                  className="px-8 py-3 bg-indigo-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/10 hover:bg-black transition-all flex items-center gap-2"
                >
                  Close Audit Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Student Admission</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Enrollment Registry Form</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="p-8 space-y-6 overflow-y-auto bg-white grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      placeholder="e.g. Juma Ali"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <input 
                      required
                      type="date" 
                      value={newStudent.dob}
                      onChange={(e) => setNewStudent({...newStudent, dob: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                    <select 
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({...newStudent, gender: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Class Level</label>
                    <select 
                      required
                      value={newStudent.classId}
                      onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option value="">Select Level</option>
                      {SCHOOL_CONFIG.academicLevels.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Section / Stream</label>
                    <select 
                      required
                      value={newStudent.section}
                      onChange={(e) => setNewStudent({...newStudent, section: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option value="">Select Section</option>
                      {availableSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Parent / Guardian</label>
                    <select 
                      value={newStudent.parentId}
                      onChange={(e) => setNewStudent({...newStudent, parentId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option value="">Select Parent...</option>
                      {parentUsers.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Student Status</label>
                    <select 
                      value={newStudent.status}
                      onChange={(e) => setNewStudent({...newStudent, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="alumni">Alumni</option>
                      <option value="transferred">Transferred</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Academic Strength (Optional)</label>
                    <select 
                      value={newStudent.strongSubject}
                      onChange={(e) => setNewStudent({...newStudent, strongSubject: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option value="">No specific focus</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science/Phys/Chem</option>
                      <option value="History">History/Arts</option>
                      <option value="Languages">Languages</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-4 border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase text-[10px] tracking-widest"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest"
                  >
                    Confirm Admission
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[140] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-white z-[150] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Edit Student Profile</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Academic ID: {editingStudent.admissionNo}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-8 space-y-6 overflow-y-auto bg-white grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <input 
                      required
                      type="date" 
                      value={editingStudent.dob}
                      onChange={(e) => setEditingStudent({...editingStudent, dob: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                    <select 
                      value={editingStudent.gender}
                      onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      value={editingStudent.status}
                      onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="alumni">Alumni</option>
                      <option value="transferred">Transferred</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Class Level</label>
                    <select 
                      required
                      value={editingStudent.classId}
                      onChange={(e) => setEditingStudent({...editingStudent, classId: e.target.value as any})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      {SCHOOL_CONFIG.academicLevels.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Section / Stream</label>
                    <select 
                      required
                      value={editingStudent.section}
                      onChange={(e) => setEditingStudent({...editingStudent, section: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      {availableSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-4 border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Assign Teacher Modal */}
      <AnimatePresence>
        {isAssignModalOpen && selectedStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">Assign Academic Liaison</h3>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-0.5">Contact point for {selectedStudent.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Faculty Representative</label>
                  <select 
                    value={assignedTeacherId}
                    onChange={(e) => setAssignedTeacherId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                  >
                    <option value="">Select Teacher...</option>
                    <option value="t1">Mwl. Julius Kambarage (Mathematics)</option>
                    <option value="t2">Mwl. Farida Juma (Kiswahili)</option>
                    <option value="t3">Mwl. Kassim (Physics)</option>
                  </select>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                  * Assigning a teacher ensures that parent inquiries related to this student are routed directly to the specific subject matter expert or class master.
                </p>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsAssignModalOpen(false)}
                    className="flex-1 py-3 px-6 bg-slate-50 text-slate-400 font-bold rounded-xl hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAssignTeacher}
                    disabled={!assignedTeacherId}
                    className="flex-[2] py-3 px-6 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-900/10 hover:bg-black transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
                  >
                    Confirm Assignment
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Column Mapping Modal */}
      <AnimatePresence>
        {isMappingModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMappingModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[120] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[85vh] bg-white z-[130] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">CSV Column Mapping</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Map your CSV columns to system fields</p>
                </div>
                <button onClick={() => setIsMappingModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 grow overflow-y-auto space-y-6">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 font-bold uppercase leading-relaxed tracking-wider">
                    We've detected these headers in your file. Please confirm the mapping below to ensure data integrity.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'name', label: 'Full Name', required: true },
                    { key: 'gender', label: 'Gender', required: true },
                    { key: 'dob', label: 'Date of Birth', required: true },
                    { key: 'class_level', label: 'Academic Level', required: true },
                    { key: 'parent_phone', label: 'Parent Contact (Optional)', required: false },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {columnMapping[field.key] !== -1 && (
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight italic">Matched</span>
                        )}
                      </div>
                      <select 
                        value={columnMapping[field.key]}
                        onChange={(e) => setColumnMapping({...columnMapping, [field.key]: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      >
                        <option value={-1}>-- Unmapped --</option>
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsMappingModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleMappedImport}
                    className="flex-[2] py-3 px-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest"
                  >
                    Confirm & Start Import
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Import Status Modal */}
      <AnimatePresence>
        {isImportModalOpen && importStatus && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[80vh] bg-white z-[110] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Import Processing Report</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Bulk Enrollment Diagnostics</p>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 grow overflow-y-auto space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Rows</p>
                    <p className="text-xl font-extrabold text-slate-900">{importStatus.total}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Success</p>
                    <p className="text-xl font-extrabold text-emerald-600">{importStatus.success}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                    <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-1">Failed</p>
                    <p className="text-xl font-extrabold text-red-600">{importStatus.failed}</p>
                  </div>
                </div>

                {importStatus.errors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      Validation Errors ({importStatus.errors.length})
                    </h4>
                    <div className="bg-red-50/50 rounded-xl border border-red-100 p-4 max-h-40 overflow-y-auto space-y-2">
                       {importStatus.errors.map((err, idx) => (
                         <div key={idx} className="flex gap-2 text-[10px] font-medium text-red-600">
                           <span className="shrink-0">•</span>
                           <span>{err}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={downloadImportTemplate}
                    className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    <FileDown size={14} />
                    Download Template
                  </button>
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-[2] py-3 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all uppercase text-[10px] tracking-widest"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Student Ledger Modal */}
      <AnimatePresence>
        {isLedgerModalOpen && selectedStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLedgerModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[80] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[85vh] bg-white z-[90] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">Student Statement</h3>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-0.5">Financial Ledger for {selectedStudent.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsLedgerModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 grow overflow-y-auto space-y-8">
                {/* Balance Summary Card */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <Wallet size={12} />
                       Current Arrears
                    </p>
                    <p className={cn(
                      "text-2xl font-extrabold tracking-tight",
                      selectedStudent.feeBalance > 0 ? "text-red-500" : "text-emerald-500"
                    )}>
                      {formatCurrency(selectedStudent.feeBalance)}
                    </p>
                  </div>
                  <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <CheckCircle2 size={12} />
                       Lifetime Paid
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-600 tracking-tight text-right">
                      {formatCurrency(
                        payments
                          .filter(p => p.studentId === selectedStudent.id)
                          .reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </p>
                  </div>
                </div>

                {/* Transaction Table */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText size={14} className="text-primary" />
                    Transaction History
                  </h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receipt #</th>
                          <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                          <th className="px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payments.filter(p => p.studentId === selectedStudent.id).length > 0 ? (
                          payments
                            .filter(p => p.studentId === selectedStudent.id)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((p) => (
                              <tr key={p.id} className="text-xs hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-slate-500 font-medium">
                                  {new Date(p.date).toLocaleDateString('en-TZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-700">{p.receiptNo}</td>
                                <td className="px-4 py-3">
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                    {p.method}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                                  {formatCurrency(p.amount)}
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-300 italic text-[10px] font-medium tracking-widest uppercase">
                              No financial transactions recorded
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button 
                    onClick={() => setIsLedgerModalOpen(false)}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-900/10 hover:bg-black transition-all uppercase text-[10px] tracking-widest"
                  >
                    Exit Financial View
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
