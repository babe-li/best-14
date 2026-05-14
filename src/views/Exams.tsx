/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Plus, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Download,
  BookOpen,
  X,
  Trophy,
  Calendar,
  Upload,
  AlertTriangle,
  FileDown,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
  Bell,
  Mail,
  MessageSquare,
  Sparkles,
  Loader2,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { aiService } from '../services/aiService';
import { type Exam, type Result, type Student, type Subject, type User, type AcademicLevel } from '../types';
import { generateId, cn } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';
import { calculateGrade, calculateDivision, type NECTAResult } from '../lib/nectaUtils';

const COLORS = ['#d4af37', '#4f46e5', '#7c3aed', '#10b981', '#64748b'];

export const Exams = () => {
  const [currentUser] = useState(storageService.getCurrentUser());
  const [db, setDb] = useState(storageService.getDB());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderExam, setReminderExam] = useState<Exam | null>(null);
  const [reminderEditData, setReminderEditData] = useState({
    reminderDays: 3,
    reminderType: 'none' as 'email' | 'in-app' | 'both' | 'none'
  });
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    title: '',
    date: '',
    classId: '',
    subjectId: '',
    maxMarks: '',
    admissionNo: '',
    marks: ''
  });
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isMarkEntryOpen, setIsMarkEntryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'results' | 'grading' | 'analysis' | 'divisions'>('calendar');

  const findSubjectByName = (name: string): string => {
    // In this app, subjectId seems to be the name itself in many places, 
    // but we should match against defaultSubjects for validation.
    const subject = SCHOOL_CONFIG.defaultSubjects.find(s => s.toLowerCase() === name.toLowerCase());
    return subject || name;
  };

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [calFilterClass, setCalFilterClass] = useState('all');
  const [calFilterSubject, setCalFilterSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<Result | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const isParent = currentUser?.role === 'parent';
  const isStudent = currentUser?.role === 'student';
  const isAdmin = currentUser?.role === 'admin';
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  // Helper for calendar
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Prefix days from previous month
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Suffix days for next month to fill 42 cells (6 rows)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
        days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const filteredCalendarExams = db.exams.filter(exam => {
    const matchesClass = calFilterClass === 'all' || exam.classId === calFilterClass;
    const matchesSubject = calFilterSubject === 'all' || exam.subjectId === calFilterSubject;
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         exam.subjectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.classId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSubject && matchesSearch;
  });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  // New Exam Form
  const [newExam, setNewExam] = useState({
    title: 'Terminal',
    term: 1 as 1|2,
    year: 2026,
    classId: '',
    subjectId: '',
    maxMarks: 100,
    date: new Date().toISOString().split('T')[0],
    reminderDays: 3,
    reminderType: 'none' as 'email' | 'in-app' | 'both' | 'none'
  });

  // Marks Entry Form
  const [marksData, setMarksData] = useState<Record<string, number>>({});
  const [aiFeedback, setAiFeedback] = useState<Record<string, string>>({});
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDb(storageService.getDB());
  }, []);

  const getTopPerformers = () => {
    const studentAverages = db.students.map(student => {
      const studentResults = db.results.filter(r => r.studentId === student.id);
      if (studentResults.length === 0) return { student, avg: 0 };
      const avg = studentResults.reduce((acc, r) => acc + r.marks, 0) / studentResults.length;
      return { student, avg: Math.round(avg * 10) / 10 };
    });

    return studentAverages
      .filter(p => p.avg > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);
  };

  const getAnalysisData = () => {
    const distribution: Record<string, number> = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, '0': 0 };
    const candidates = db.students.filter(s => s.classId.startsWith('Form'));
    
    candidates.forEach(student => {
      const results = db.results.filter(r => r.studentId === student.id);
      const divData = calculateDivision(results, student.classId as AcademicLevel, db.settings?.gradingScales);
      if (divData !== 'N/A') {
        distribution[divData.division] = (distribution[divData.division] || 0) + 1;
      }
    });

    const totalStats = Object.values(distribution).reduce((a, b) => a + b, 0);
    const pieData = Object.entries(distribution)
      .map(([name, value]) => ({ 
        name: `Division ${name}`, 
        value: totalStats > 0 ? Math.round((value / totalStats) * 100) : 0,
        count: value
      }))
      .filter(d => d.value > 0 || (totalStats === 0 && d.name === 'Division 0'));

    const subjectDataMap = db.exams.reduce((acc, exam) => {
      const results = db.results.filter(r => r.examId === exam.id);
      if (results.length === 0) return acc;
      
      if (!acc[exam.subjectId]) {
        acc[exam.subjectId] = { totalMarks: 0, totalStudents: 0, uniqueStudents: new Set<string>() };
      }
      
      acc[exam.subjectId].totalMarks += results.reduce((sum, r) => sum + r.marks, 0);
      acc[exam.subjectId].totalStudents += results.length;
      results.forEach(r => acc[exam.subjectId].uniqueStudents.add(r.studentId));
      
      return acc;
    }, {} as Record<string, { totalMarks: number, totalStudents: number, uniqueStudents: Set<string> }>);

    const subjectPerformance = Object.entries(subjectDataMap).map(([subject, data]) => ({
      subject,
      score: Math.round(data.totalMarks / data.totalStudents),
      studentCount: data.uniqueStudents.size
    })).sort((a, b) => b.score - a.score);

    const allMarks = db.results.map(r => r.marks);
    const meanScore = allMarks.length > 0 
      ? Math.round(allMarks.reduce((a, b) => a + b, 0) / allMarks.length * 10) / 10 
      : 0;

    const passRate = allMarks.length > 0 
      ? Math.round((allMarks.filter(m => m >= 30).length / allMarks.length) * 1000) / 10 
      : 0;

    return { pieData, subjectPerformance, meanScore, passRate };
  };

  const generateReportCard = (student: Student, studentResults: Result[], divData: NECTAResult | 'N/A') => {
    const doc = new jsPDF();
    
    // Banner Color
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 0, 210, 40, 'F');

    // Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(SCHOOL_CONFIG.name.toUpperCase(), 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(SCHOOL_CONFIG.schoolTagline, 105, 28, { align: 'center' });
    
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL ACADEMIC PROGRESS REPORT', 105, 55, { align: 'center' });
    
    // Student Info Card
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 65, 180, 25, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('STUDENT NAME', 25, 75);
    doc.text('ADMISSION NO', 95, 75);
    doc.text('ACADEMIC LEVEL', 155, 75);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(student.name.toUpperCase(), 25, 83);
    doc.text(student.admissionNo, 95, 83);
    doc.text(student.classId, 155, 83);

    // Results Table
    const tableRows = studentResults.map(r => {
      const exam = db.exams.find(e => e.id === r.examId);
      return [
        exam?.subjectId || 'Unknown',
        exam?.title || 'Assessment',
        r.marks.toString() + '%',
        r.grade,
        r.remarks || 'Satisfactory progress'
      ];
    });

    autoTable(doc, {
      startY: 100,
      head: [['Subject', 'Category', 'Score', 'Grade', 'Academic Remarks']],
      body: tableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [30, 41, 59], 
        textColor: [255, 255, 255], 
        fontSize: 9, 
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' }
      }
    });

    // Summary Section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(241, 245, 249);
    doc.rect(15, finalY, 180, 40, 'F');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NECTA STANDARDIZED SUMMARY', 25, finalY + 10);
    
    if (divData !== 'N/A') {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('BEST 7 POINTS', 25, finalY + 22);
      doc.text('GPA', 75, finalY + 22);
      doc.text('CREDITS', 115, finalY + 22);
      doc.text('OFFICIAL DIVISION', 155, finalY + 22);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(divData.points.toString(), 25, finalY + 32);
      doc.text(divData.gpa.toFixed(2), 75, finalY + 32);
      doc.text(divData.credits.toString(), 115, finalY + 32);
      
      // Division Badge
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(155, finalY + 25, 25, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(divData.division, 167.5, finalY + 32, { align: 'center' });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('SUMMARY DATA PENDING COMPLETION OF ALL SUBJECT ASSESSMENTS', 105, finalY + 25, { align: 'center' });
    }

    // Signatures
    const bottomY = 250;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    doc.line(25, bottomY, 85, bottomY);
    doc.text('CLASS TEACHER SIGNATURE', 55, bottomY + 5, { align: 'center' });
    
    doc.line(125, bottomY, 185, bottomY);
    doc.text('HEADMASTER / ACADEMIC DEAN', 155, bottomY + 5, { align: 'center' });

    // Footer
    doc.setFontSize(7);
    doc.text(`Report generated by Miyomboni School Management System on ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

    doc.save(`${student.admissionNo}_${student.name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const analysisData = getAnalysisData();
  const topPerformers = getTopPerformers();

  const openReminderSettings = (exam: Exam) => {
    setReminderExam(exam);
    setReminderEditData({
      reminderDays: exam.reminderDays || 3,
      reminderType: exam.reminderType || 'none'
    });
    setIsReminderModalOpen(true);
  };

  const handleSaveReminders = () => {
    if (!reminderExam) return;
    const updatedExams = db.exams.map(e => 
      e.id === reminderExam.id 
        ? { ...e, ...reminderEditData } 
        : e
    );
    storageService.saveDB({ ...db, exams: updatedExams });
    setDb({ ...db, exams: updatedExams });
    setIsReminderModalOpen(false);
  };

  const handleOpenFeedback = (result: Result) => {
    setFeedbackResult(result);
    setFeedbackText(result.feedback || '');
    setIsFeedbackModalOpen(true);
  };

  const handleSaveFeedback = () => {
    if (!feedbackResult) return;
    const db = storageService.getDB();
    const updatedResults = db.results.map(r => 
      r.id === feedbackResult.id ? { ...r, feedback: feedbackText } : r
    );
    storageService.saveDB({ ...db, results: updatedResults });
    setDb({ ...db, results: updatedResults });
    setIsFeedbackModalOpen(false);
    setFeedbackResult(null);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    const exam: Exam = {
      id: generateId(),
      ...newExam,
    };

    // Trigger immediate schedule notification for teachers
    const studentsInClass = db.students.filter(s => s.classId === exam.classId);
    if (exam.reminderType !== 'none') {
      // In a real app, this would be a scheduled task.
      // Here we just simulate that the schedule was set.
      console.log(`[SCHEDULED] Reminders set for ${exam.title} in ${exam.reminderDays} days.`);
    }

    const updatedExams = [...db.exams, exam];
    storageService.saveDB({ ...db, exams: updatedExams });
    setDb({ ...db, exams: updatedExams });
    setIsAddModalOpen(false);
  };

  const openMarkEntry = (exam: Exam) => {
    setSelectedExam(exam);
    const existingResults = db.results.filter(r => r.examId === exam.id);
    const initialMarks: Record<string, number> = {};
    const initialFeedback: Record<string, string> = {};
    existingResults.forEach(r => { 
      initialMarks[r.studentId] = r.marks; 
      initialFeedback[r.studentId] = r.remarks;
    });
    setMarksData(initialMarks);
    setAiFeedback(initialFeedback);
    setIsMarkEntryOpen(true);
  };

  const generateSmartFeedback = async (student: Student) => {
    const score = marksData[student.id];
    if (score === undefined || !selectedExam) return;

    setIsGeneratingFeedback(prev => ({ ...prev, [student.id]: true }));
    try {
      const result = await aiService.generateStudentFeedback(
        student.name,
        selectedExam.subjectId,
        score,
        selectedExam.maxMarks
      );
      setAiFeedback(prev => ({ ...prev, [student.id]: result.feedback }));
    } catch (error) {
      console.error("Feedback generation failed", error);
    } finally {
      setIsGeneratingFeedback(prev => ({ ...prev, [student.id]: false }));
    }
  };

  const handleSaveMarks = () => {
    if (!selectedExam) return;
    
    // Convert grading scale from NECTA utilities
    const getGrade = (marks: number, studentId: string) => {
      const student = db.students.find(s => s.id === studentId);
      return calculateGrade(marks, (student?.classId as any) || 'Form 4', db.settings?.gradingScales);
    };

    const newResults: Result[] = Object.entries(marksData).map(([studentId, marks]) => {
      const grade = getGrade(marks, studentId);
      const student = db.students.find(s => s.id === studentId);
      if (student) {
        notificationService.notifyResults(student, selectedExam, marks, grade);
      }
      return {
        id: generateId(),
        examId: selectedExam.id,
        studentId,
        marks,
        grade,
        remarks: aiFeedback[studentId] || ''
      };
    });

    // Filter out old results for this exam and add new ones
    const otherResults = db.results.filter(r => r.examId !== selectedExam.id);
    const updatedResults = [...otherResults, ...newResults];
    
    storageService.saveDB({ ...db, results: updatedResults });
    setDb({ ...db, results: updatedResults });
    setIsMarkEntryOpen(false);
  };

  const handleBulkCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const headers = Object.keys(results.data[0] as object);
          setCsvHeaders(headers);
          setImportedRows(results.data);
          
          // Try auto-mapping
          const newMapping = { ...columnMapping };
          headers.forEach(h => {
            const lowH = h.toLowerCase();
            if (lowH.includes('title') || lowH.includes('name')) {
              if (lowH.includes('student') || lowH.includes('candidate')) {
                // Ignore student name for title
              } else {
                newMapping.title = h;
              }
            }
            if (lowH.includes('date')) newMapping.date = h;
            if (lowH.includes('class') || lowH.includes('level')) newMapping.classId = h;
            if (lowH.includes('subject')) newMapping.subjectId = h;
            if (lowH.includes('max') && (lowH.includes('marks') || lowH.includes('score'))) newMapping.maxMarks = h;
            if (lowH.includes('admission') || lowH.includes('reg') || lowH.includes('id')) {
              if (!lowH.includes('subject') && !lowH.includes('class')) {
                newMapping.admissionNo = h;
              }
            }
            if (!lowH.includes('max') && (lowH.includes('marks') || lowH.includes('score'))) newMapping.marks = h;
          });
          setColumnMapping(newMapping);
          setImportStep('mapping');
        }
      },
      error: (error) => {
        alert("Error parsing CSV: " + error.message);
      }
    });
    e.target.value = ''; 
  };

  const processImport = () => {
    const examsToImport: Exam[] = [];
    const resultsToImport: Result[] = [];
    const skippedRows: number[] = [];

    // Temporary map to keep track of exams created in this session to link results
    const sessionExamMap = new Map<string, string>(); // key: "title|date|classId|subjectId", value: examId

    importedRows.forEach((row, index) => {
      const title = row[columnMapping.title];
      const date = row[columnMapping.date];
      const classId = row[columnMapping.classId];
      const subjectId = findSubjectByName(row[columnMapping.subjectId]);
      const maxMarks = Number(row[columnMapping.maxMarks]) || 100;

      if (!title || !date || !classId || !subjectId) {
        skippedRows.push(index + 1);
        return;
      }

      const examKey = `${title}|${date}|${classId}|${subjectId}`;
      let examId = sessionExamMap.get(examKey);

      // Check if exam exists in DB or this session
      const existingExam = db.exams.find(e => 
        e.title === title && e.date === date && e.classId === classId && e.subjectId === subjectId
      );

      if (existingExam) {
        examId = existingExam.id;
      } else if (!examId) {
        const newId = generateId();
        examsToImport.push({
          id: newId,
          title,
          date,
          classId: classId as AcademicLevel,
          subjectId,
          maxMarks,
          term: 1,
          year: new Date().getFullYear(),
          reminderDays: 3,
          reminderType: 'none'
        });
        examId = newId;
        sessionExamMap.set(examKey, newId);
      }

      // Handle Results if present
      const admissionNo = row[columnMapping.admissionNo];
      const marks = row[columnMapping.marks];

      if (admissionNo && marks !== undefined && marks !== '') {
        const student = db.students.find(s => s.admissionNo === admissionNo);
        if (student) {
          const numericMarks = Number(marks);
          if (!isNaN(numericMarks)) {
            // Check if result already exists for this student/exam
            const existingInDb = db.results.some(r => r.examId === examId && r.studentId === student.id);
            const alreadyInQueue = resultsToImport.some(r => r.examId === examId && r.studentId === student.id);

            if (!existingInDb && !alreadyInQueue) {
              const grade = calculateGrade(numericMarks, student.classId as AcademicLevel, db.settings?.gradingScales);
              resultsToImport.push({
                id: generateId(),
                examId: examId!,
                studentId: student.id,
                marks: numericMarks,
                grade,
                remarks: 'Imported via Bulk'
              });
            }
          }
        }
      }
    });

    if (examsToImport.length > 0 || resultsToImport.length > 0) {
      const updatedExams = [...db.exams, ...examsToImport];
      const updatedResults = [...db.results, ...resultsToImport];
      
      storageService.saveDB({ ...db, exams: updatedExams, results: updatedResults });
      setDb({ ...db, exams: updatedExams, results: updatedResults });
      
      let msg = `Bulk Processing Complete.\n`;
      if (examsToImport.length > 0) msg += `- Created ${examsToImport.length} new exam definitions.\n`;
      if (resultsToImport.length > 0) msg += `- Imported ${resultsToImport.length} student results.\n`;
      if (skippedRows.length > 0) msg += `- Skipped ${skippedRows.length} rows due to incomplete data.\n`;
      
      alert(msg);
      setIsBulkImportOpen(false);
      setImportStep('upload');
    } else {
      alert("No valid new data found to import.");
    }
  };

  const downloadBulkTemplate = () => {
    const csvContent = "exam_title,term,year,class_level,subject_name,admission_no,marks,max_marks\n" + 
      "Mid-Term,1,2026,Form 1,Mathematics,S001,85,100\n" +
      "Mid-Term,1,2026,Form 1,English,S001,78,100\n" +
      "Terminal,1,2026,Form 2,Physics,S005,62,100";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_exams_template.csv`;
    a.click();
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExam) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split('\n');
      const newMarks = { ...marksData };
      
      lines.forEach(line => {
        const [admissionNo, score] = line.split(',').map(s => s.trim());
        if (!admissionNo || isNaN(Number(score))) return;

        const student = db.students.find(s => s.admissionNo === admissionNo);
        if (student && student.classId === selectedExam.classId) {
          const numericScore = Number(score);
          if (numericScore >= 0 && numericScore <= selectedExam.maxMarks) {
            newMarks[student.id] = numericScore;
          }
        }
      });

      setMarksData(newMarks);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const downloadTemplate = () => {
    if (!selectedExam) return;
    const studentsInClass = db.students.filter(s => s.classId === selectedExam.classId);
    const csvContent = "admission_no,name,marks\n" + 
      studentsInClass.map(s => `${s.admissionNo},${s.name},`).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_template_${selectedExam.title}_${selectedExam.subjectId}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examinations & NECTA</h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Track academic progress and generate standardized results.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="bg-slate-100 p-1 rounded-xl flex overflow-x-auto scrollbar-none">
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                viewMode === 'calendar' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Calendar
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('results')}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                viewMode === 'results' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Results
            </button>
            <button 
              onClick={() => setViewMode('divisions')}
              className={cn(
                "flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                viewMode === 'divisions' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Divisions
            </button>
            {canManage && (
              <button 
                onClick={() => setViewMode('analysis')}
                className={cn(
                  "flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all relative overflow-hidden whitespace-nowrap",
                  viewMode === 'analysis' ? "bg-premium-dark text-premium-gold shadow-lg shadow-premium-dark/10 border border-premium-gold/20" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Analysis
              </button>
            )}
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsBulkImportOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-900 transition-all"
              >
                <Upload size={16} />
                Bulk Results
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
              >
                <Plus size={16} />
                Schedule
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'calendar' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={prevMonth} 
                      className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                    </button>
                    <button 
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1.5 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors"
                    >
                      Today
                    </button>
                    <button 
                      onClick={nextMonth} 
                      className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest min-w-[140px] text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full md:w-auto">
                  <div className="relative group min-w-[160px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      placeholder="Search exams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                  </div>
                  <select 
                    value={calFilterClass}
                    onChange={(e) => setCalFilterClass(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  >
                    <option value="all">Levels: All</option>
                    {SCHOOL_CONFIG.academicLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                  <select 
                    value={calFilterSubject}
                    onChange={(e) => setCalFilterSubject(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  >
                    <option value="all">Subjects: All</option>
                    {SCHOOL_CONFIG.defaultSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <button 
                    onClick={() => {
                      const csvContent = "Date,Assessment,Subject,Class,Marks\n" + 
                        filteredCalendarExams.map(e => `${e.date},${e.title},${e.subjectId},${e.classId},${e.maxMarks}`).join("\n");
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `exam_schedule_${currentDate.getMonth()+1}_${currentDate.getFullYear()}.csv`;
                      a.click();
                    }}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                    title="Download Current View"
                  >
                    <FileDown size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-w-[600px] lg:min-w-0 overflow-x-auto">
                  <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {getCalendarDays().map((day, i) => {
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isToday = new Date().toDateString() === day.toDateString();
                      const isSelected = selectedDate?.toDateString() === day.toDateString();
                      
                      const dayExams = filteredCalendarExams.filter(e => {
                        const examData = new Date(e.date);
                        return examData.getDate() === day.getDate() && 
                               examData.getMonth() === day.getMonth() && 
                               examData.getFullYear() === day.getFullYear();
                      });

                      return (
                        <div 
                          key={i} 
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "min-h-[110px] p-2 border-r border-b border-slate-50 last:border-r-0 relative transition-all cursor-pointer group",
                            !isCurrentMonth && "bg-slate-50/30 opacity-40",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={cn(
                              "w-6 h-6 flex items-center justify-center text-[10px] font-black rounded-full transition-all",
                              isToday ? "bg-primary text-white shadow-lg shadow-primary/20" : 
                              isSelected ? "bg-slate-900 text-white" :
                              isCurrentMonth ? "text-slate-400 group-hover:text-slate-900" : "text-slate-200"
                            )}>
                              {day.getDate()}
                            </span>
                            {dayExams.length > 0 && (
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {dayExams.slice(0, 3).map(exam => (
                              <motion.div 
                                key={exam.id}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                  "px-2 py-1 border-l-2 rounded text-[8px] font-bold uppercase tracking-tighter truncate transition-all",
                                  exam.title.includes('Terminal') ? "bg-indigo-50 text-indigo-600 border-indigo-500" :
                                  exam.title.includes('Mid-Term') ? "bg-amber-50 text-amber-600 border-amber-500" :
                                  "bg-emerald-50 text-emerald-600 border-emerald-500"
                                )}
                                title={`${exam.title}: ${exam.subjectId} (${exam.classId})`}
                              >
                                {exam.subjectId}
                              </motion.div>
                            ))}
                            {dayExams.length > 3 && (
                              <p className="text-[7px] text-slate-400 font-bold ml-1">+{dayExams.length - 3} more</p>
                            )}
                          </div>

                          {/* Quick Add Button Overlay */}
                          {canManage && isCurrentMonth && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-white/40 backdrop-blur-[1px] pointer-events-none">
                              <Plus size={16} className="text-primary pointer-events-auto" onClick={(e) => {
                                e.stopPropagation();
                                setNewExam({ ...newExam, date: day.toISOString().split('T')[0] });
                                setIsAddModalOpen(true);
                              }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Day Sidebar Replacement (Analysis style) */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-xs ring-4 ring-slate-50">
                        {selectedDate?.getDate()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">{selectedDate?.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Schedule Details</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Legend */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                        <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assessment Categories</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Terminal Exams</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Mid-Term Tests</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Regular CA</span>
                          </div>
                        </div>
                      </div>

                      {selectedDate && filteredCalendarExams.filter(e => {
                        const d = new Date(e.date);
                        return d.toDateString() === selectedDate.toDateString();
                      }).map(exam => (
                        <div key={exam.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-primary/30 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 bg-white text-primary border border-slate-200 rounded text-[8px] font-bold uppercase tracking-widest">{exam.classId}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{exam.title}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mb-4">{exam.subjectId} Assessment</h4>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => canManage && openMarkEntry(exam)}
                              className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-primary transition-all"
                            >
                              Results Entry
                            </button>
                            <button 
                              onClick={() => canManage && openReminderSettings(exam)}
                              className={cn(
                                "p-2 transition-colors rounded-lg",
                                exam.reminderType && exam.reminderType !== 'none' ? "text-primary bg-primary/10" : "text-slate-400 hover:text-primary hover:bg-slate-50"
                              )}
                              title="Reminder Settings"
                            >
                              <Bell size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {selectedDate && filteredCalendarExams.filter(e => {
                        const d = new Date(e.date);
                        return d.toDateString() === selectedDate.toDateString();
                      }).length === 0 && (
                        <div className="py-12 text-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200 border border-slate-100">
                             <Calendar size={24} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">No events scheduled</p>
                          {canManage && (
                            <button 
                              onClick={() => setIsAddModalOpen(true)}
                              className="mt-4 text-[9px] font-bold text-primary uppercase tracking-[0.2em] hover:underline"
                            >
                              + Add Exam
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Upcoming section in sidebar */}
                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <h4 className="text-[9px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-4">Upcoming (Next 7 Days)</h4>
                      <div className="space-y-3">
                        {db.exams.filter(e => {
                           const d = new Date(e.date);
                           const diff = (d.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                           return diff > 0 && diff <= 7;
                        }).slice(0, 3).map(exam => (
                          <div key={exam.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                              <p className="text-[10px] font-black">{new Date(exam.date).getDate()}</p>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold text-slate-900 truncate uppercase">{exam.subjectId} - {exam.classId}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Starts in {Math.ceil((new Date(exam.date).getTime() - new Date().getTime())/(1000*3600*24))} days</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className="text-primary" />
                  Academic Calendar Operations
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {db.exams.map(exam => (
                  <motion.div 
                    key={exam.id}
                    whileHover={{ y: -2 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <BookOpen size={20} />
                      </div>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded">
                            {exam.maxMarks} Marks
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-primary px-2.5 py-1 rounded">
                            Term {exam.term}, {exam.year}
                          </span>
                          {exam.reminderType && exam.reminderType !== 'none' && (
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-premium-gold/10 text-premium-gold border border-premium-gold/20 px-2.5 py-1 rounded">
                              <Bell size={10} />
                              {exam.reminderDays && exam.reminderDays >= 30 ? '1m' : 
                               exam.reminderDays && exam.reminderDays >= 7 ? `${Math.floor(exam.reminderDays / 7)}w` : 
                               `${exam.reminderDays}d`}
                            </div>
                          )}
                        </div>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 text-lg group-hover:text-primary transition-colors">{exam.title} - {exam.subjectId}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 italic">{exam.classId}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => canManage && openMarkEntry(exam)}
                        disabled={!canManage}
                        className="flex-1 py-3 text-[10px] uppercase font-bold tracking-widest text-white bg-slate-900 rounded-xl hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Entry Form
                      </button>
                      <button 
                        onClick={() => canManage && openReminderSettings(exam)}
                        disabled={!canManage}
                        className={cn(
                          "p-3 border rounded-xl transition-all",
                          exam.reminderType && exam.reminderType !== 'none' 
                            ? "text-primary bg-primary/5 border-primary/20" 
                            : "text-slate-400 bg-slate-50 border-slate-100 hover:text-primary hover:border-primary"
                        )}
                        title="Reminder Settings"
                      >
                        <Bell size={18} />
                      </button>
                      <button className="p-3 text-slate-400 bg-slate-50 border border-slate-100 rounded-xl hover:text-primary hover:border-primary transition-all">
                        <FileText size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {db.exams.length === 0 && (
                  <div className="md:col-span-2 py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic font-medium">No assessments found</p>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'analysis' ? (
            <div className="space-y-6">
              {/* Premium Analytics Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-1 flex flex-col justify-between">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mean Score</h4>
                    <p className="text-2xl font-black text-slate-900 leading-none">{analysisData.meanScore}%</p>
                    <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Calculated Average</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-1 flex flex-col justify-between">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Candidate Pass Rate</h4>
                    <p className="text-2xl font-black text-slate-900 leading-none">{analysisData.passRate}%</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">NECTA Benchmark</p>
                  </div>
                </div>
                <div className="bg-premium-dark p-6 rounded-3xl border border-white/10 shadow-2xl md:col-span-2 text-white relative overflow-hidden group">
                   <TrendingUp size={120} className="absolute -right-4 -bottom-8 text-premium-gold/10 group-hover:scale-110 transition-transform" />
                   <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <h4 className="text-[8px] font-bold uppercase tracking-[0.2em] text-premium-gold mb-2">NECTA Compliance Engine</h4>
                        <p className="text-lg font-black uppercase leading-tight tracking-tight">Standardized Grading & Credit Analysis System</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                         <span className="px-2 py-1 bg-premium-gold/20 text-premium-gold border border-premium-gold/30 rounded text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                           <CheckCircle2 size={10} /> Fully Compliant
                         </span>
                         <span className="px-2 py-1 bg-white/10 rounded text-[8px] font-bold uppercase tracking-widest">Version 2.5.0-NECTA</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Division Distribution Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distinctions Alignment (Form 4)</h3>
                    <div className="flex gap-2">
                       <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[8px] font-bold uppercase text-slate-400">Div I</span>
                       </div>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analysisData.pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analysisData.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                    {['I', 'II', 'III', 'IV', '0'].map((div, i) => {
                      const d = analysisData.pieData.find(item => item.name === `Division ${div}`);
                      return (
                        <div key={div} className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Div {div}</p>
                          <p className="text-[11px] font-black text-slate-900">{d?.value || 0}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subject Performance Heatmap Scale */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject Mastery Comparison</h3>
                    <TrendingUp size={16} className="text-primary" />
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={analysisData.subjectPerformance.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis 
                          dataKey="subject" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                          width={70}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }} 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xl">
                                  <p className="text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">{data.subject}</p>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">Avg Score:</span>
                                      <span className="text-[10px] font-black text-primary">{data.score}%</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">Students:</span>
                                      <span className="text-[10px] font-black text-slate-600">{data.studentCount}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="score" 
                          fill="#4f46e5" 
                          radius={[0, 8, 8, 0]} 
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-4 bg-primary/5 rounded-2xl flex items-center justify-between border border-primary/10">
                     <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                       Optimal Performance: {analysisData.subjectPerformance[0]?.subject || 'N/A'} ({analysisData.subjectPerformance[0]?.score || 0}%)
                     </span>
                     <ArrowUpRight size={14} className="text-primary" />
                  </div>
                </div>
              </div>

              {/* NECTA Point Verifier & Technical Standards Compliance */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Candidate Performance Audit</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Division calculations based on NECTA best-7 algorithms</p>
                    </div>
                    <AlertTriangle size={18} className="text-amber-500" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-50">
                          <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Candidate Name</th>
                          <th className="text-center px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score Dist.</th>
                          <th className="text-center px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">GPA</th>
                          <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Points</th>
                          <th className="text-center px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Division</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {db.students
                          .filter(s => s.status === 'active' && s.classId.startsWith('Form'))
                          .map(student => {
                            const studentResults = db.results.filter(r => r.studentId === student.id);
                            const divData = calculateDivision(studentResults, student.classId as AcademicLevel, db.settings?.gradingScales);
                            
                            if (divData === 'N/A') return null;

                            return { student, studentResults, divData };
                          })
                          .filter((data): data is NonNullable<typeof data> => data !== null)
                          .sort((a, b) => a.divData.points - b.divData.points)
                          .slice(0, 8)
                          .map(({ student, studentResults, divData }) => {
                            return (
                              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 py-4">
                                  <p className="text-xs font-black text-slate-900 uppercase">{student.name}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Adm: {student.admissionNo}</p>
                                </td>
                                <td className="px-4 py-4">
                                   <div className="flex gap-0.5 justify-center">
                                      {[...studentResults]
                                        .sort((a, b) => b.marks - a.marks)
                                        .slice(0, 7)
                                        .map((r, i) => (
                                         <div key={i} className={cn(
                                           "w-2 h-4 rounded-sm",
                                           r.marks >= 75 ? "bg-emerald-500" :
                                           r.marks >= 65 ? "bg-indigo-500" :
                                           r.marks >= 45 ? "bg-amber-500" : "bg-red-500"
                                         )} title={`${db.exams.find(e => e.id === r.examId)?.subjectId || 'Subject'}: ${r.marks}%`} />
                                      ))}
                                      {studentResults.length === 0 && <span className="text-[8px] text-slate-300 uppercase font-bold">No Data</span>}
                                   </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                   <p className="text-xs font-black text-slate-500">{divData.gpa.toFixed(2)}</p>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <p className="text-xs font-black text-slate-900">{divData.points}</p>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <div className="flex items-center justify-center gap-3">
                                    <div className={cn(
                                      "inline-flex w-10 h-10 rounded-xl items-center justify-center font-black text-white text-xs shadow-sm",
                                      divData.division === 'I' ? "bg-emerald-600 shadow-emerald-200" :
                                      divData.division === 'II' ? "bg-indigo-600 shadow-indigo-200" :
                                      divData.division === 'III' ? "bg-amber-600 shadow-amber-200" :
                                      divData.division === 'IV' ? "bg-slate-600 shadow-slate-200" :
                                      "bg-red-600 shadow-red-200"
                                    )}>
                                      {divData.division}
                                    </div>
                                    <button 
                                      onClick={() => generateReportCard(student, studentResults, divData)}
                                      className="p-2 bg-slate-100 text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                                      title="Generate Report Card"
                                    >
                                      <FileDown size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <ShieldCheck size={20} className="text-premium-gold" />
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-premium-gold">Technical Compliance</h3>
                    </div>
                    <div className="space-y-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">Subject Mapping</p>
                          <div className="flex items-center justify-between text-xs font-black uppercase">
                             <span>Core Modules</span>
                             <span className="text-emerald-400">Verified</span>
                          </div>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">Algorithm Integrity</p>
                          <div className="flex items-center justify-between text-xs font-black uppercase">
                             <span>Credit Pass Logic</span>
                             <span className="text-emerald-400">Synced</span>
                          </div>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">Data Protection</p>
                          <div className="flex items-center justify-between text-xs font-black uppercase">
                             <span>O-Level Standards</span>
                             <span className="text-emerald-400">2026-N1</span>
                          </div>
                       </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black leading-relaxed">
                      THIS SYSTEM IS OFFICIALLY CONFIGURED TO COMPLY WITH NECTA (NATIONAL EXAMINATIONS COUNCIL OF TANZANIA) ACADEMIC REPORTING STANDARDS.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'divisions' ? (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">NECTA Division Audit Registry</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Calculated based on best-7 subject performance matrix</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest">
                           {db.students.filter(s => s.classId.startsWith('Form')).length} Candidates
                        </div>
                        <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                           <Download size={18} />
                        </button>
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                       <thead>
                          <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             <th className="px-6 py-2">Candidate Info</th>
                             <th className="px-6 py-2">O-Level Class</th>
                             <th className="px-6 py-2">Best 7 Subjects</th>
                             <th className="px-6 py-2 text-center text-primary">Points (B7)</th>
                             <th className="px-6 py-2 text-center">Division</th>
                             <th className="px-6 py-2 text-right">Audit</th>
                          </tr>
                       </thead>
                       <tbody>
                          {db.students
                            .filter(s => s.classId.startsWith('Form'))
                            .sort((a, b) => {
                               const resultsA = db.results.filter(r => r.studentId === a.id);
                               const resultsB = db.results.filter(r => r.studentId === b.id);
                               const divA = calculateDivision(resultsA, a.classId as AcademicLevel, db.settings?.gradingScales);
                               const divB = calculateDivision(resultsB, b.classId as AcademicLevel, db.settings?.gradingScales);
                               const ptsA = divA === 'N/A' ? 100 : divA.points;
                               const ptsB = divB === 'N/A' ? 100 : divB.points;
                               return ptsA - ptsB;
                            })
                            .map(student => {
                               const results = db.results.filter(r => r.studentId === student.id);
                               const divData = calculateDivision(results, student.classId as AcademicLevel, db.settings?.gradingScales);
                               
                               return (
                                 <tr key={student.id} className="group hover:scale-[1.01] transition-all">
                                    <td className="px-6 py-4 bg-slate-50/50 rounded-l-2xl border border-r-0 border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-colors">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:text-primary group-hover:border-primary/20">
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                          </div>
                                          <div>
                                             <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{student.name}</p>
                                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{student.admissionNo}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-colors">
                                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{student.classId}</span>
                                    </td>
                                    <td className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-colors">
                                       <div className="flex gap-0.5">
                                          {[...results]
                                            .sort((a, b) => b.marks - a.marks)
                                            .slice(0, 7)
                                            .map((r, idx) => (
                                             <div key={idx} className={cn(
                                                "w-1.5 h-4 rounded-sm",
                                                r.marks >= 75 ? "bg-emerald-500" :
                                                r.marks >= 65 ? "bg-indigo-500" :
                                                r.marks >= 45 ? "bg-amber-500" : "bg-red-500"
                                             )} />
                                          ))}
                                          {results.length === 0 && <span className="text-[8px] text-slate-300 font-black uppercase">No Data</span>}
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-colors text-center">
                                       <span className="text-sm font-black text-primary italic">
                                         {divData !== 'N/A' ? divData.points : '--'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-colors text-center">
                                       <div className={cn(
                                          "inline-flex w-8 h-8 rounded-lg items-center justify-center text-[10px] font-black shadow-lg",
                                          divData === 'N/A' ? "bg-slate-100 text-slate-400 shadow-none" :
                                          divData.division === 'I' ? "bg-emerald-600 text-white shadow-emerald-600/20" :
                                          divData.division === 'II' ? "bg-indigo-600 text-white shadow-indigo-600/20" :
                                          divData.division === 'III' ? "bg-amber-600 text-white shadow-amber-600/20" :
                                          divData.division === 'IV' ? "bg-slate-600 text-white shadow-slate-600/20" :
                                          "bg-red-600 text-white shadow-red-600/20"
                                       )}>
                                          {divData === 'N/A' ? '?' : divData.division}
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 bg-slate-50/50 rounded-r-2xl border border-l-0 border-slate-100 group-hover:bg-white group-hover:border-primary/20 transition-colors text-right relative">
                                        <div className="flex items-center justify-end gap-3">
                                          <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{divData !== 'N/A' ? `${divData.credits} Credits` : 'Pending'}</p>
                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{divData !== 'N/A' ? `GPA: ${divData.gpa.toFixed(2)}` : 'Incomplete'}</p>
                                          </div>
                                          <button 
                                            onClick={() => generateReportCard(student, results, divData)}
                                            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary hover:shadow-lg rounded-xl transition-all group/btn"
                                            title="Download Report Card"
                                          >
                                            <FileSpreadsheet size={16} className="group-hover/btn:scale-110 transition-transform" />
                                          </button>
                                        </div>
                                     </td>
                                 </tr>
                               );
                            })}
                       </tbody>
                    </table>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Subject Results Registry</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left order-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Subject</th>
                          <th className="px-6 py-4 text-center">Marks</th>
                          <th className="px-6 py-4 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {db.results
                          .filter(r => {
                            if (isParent && currentUser) {
                              const student = db.students.find(s => s.id === r.studentId);
                              return student?.parentId === currentUser.id;
                            }
                            if (isStudent && currentUser) {
                              return r.studentId === currentUser.id;
                            }
                            return true; // admin/teacher see all or maybe teacher sees their students
                          })
                          .map(result => {
                            const student = db.students.find(s => s.id === result.studentId);
                            const exam = db.exams.find(e => e.id === result.examId);
                            return (
                              <tr key={result.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="text-xs font-bold text-slate-900">{student?.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{student?.classId}</p>
                                </td>
                                <td className="px-6 py-4 font-bold text-xs text-slate-600">
                                  {exam?.subjectId} 
                                  <span className="ml-2 text-[9px] text-slate-300">({exam?.title})</span>
                                </td>
                                <td className="px-6 py-4 text-center font-extrabold text-slate-900 text-sm">{result.marks}</td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className={cn(
                                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase",
                                      result.grade === 'A' ? "bg-emerald-50 text-emerald-600" :
                                      result.grade === 'B' ? "bg-indigo-50 text-indigo-600" :
                                      result.grade === 'C' ? "bg-amber-50 text-amber-600" :
                                      "bg-red-50 text-red-600"
                                    )}>
                                      {result.grade}
                                    </span>
                                    {(canManage || result.feedback) && (
                                      <button 
                                        onClick={() => handleOpenFeedback(result)}
                                        className={cn(
                                          "p-1.5 rounded-lg transition-all",
                                          result.feedback ? "text-primary bg-primary/10" : "text-slate-400 hover:text-primary hover:bg-slate-50"
                                        )}
                                        title={result.feedback ? (canManage ? "Edit Feedback" : "View Feedback") : "Add Feedback"}
                                      >
                                        <MessageSquare size={14} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {(isParent || isStudent) && db.results.filter(r => {
                             if (isParent) return db.students.find(s => s.id === r.studentId)?.parentId === currentUser?.id;
                             return r.studentId === currentUser?.id;
                          }).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic font-medium">
                              No results published yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Top Performers Sidebar */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Trophy size={14} className="text-premium-gold" />
            Distinction List (Div I)
          </h3>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {topPerformers.map((perf, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0 last:pb-0 pt-0 group cursor-pointer">
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0",
                  i === 0 ? "bg-premium-gold text-white shadow-lg shadow-premium-gold/20" : "bg-slate-100 text-slate-400"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{perf.student.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{perf.student.classId} • <span className="text-emerald-500">{perf.avg}% AVG</span></p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
            {topPerformers.length === 0 && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center italic">Processing academic cycle...</p>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded">
                  <AlertCircle size={18} className="text-primary" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Secondary (Form 1-6)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SCHOOL_CONFIG.nectaScales.secondary.map(g => (
                  <div key={g.grade} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">{g.grade} ({g.min}+)</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded">
                  <GraduationCap size={18} className="text-emerald-400" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Primary (Std 1-7)</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SCHOOL_CONFIG.nectaScales.primary.map(g => (
                  <div key={g.grade} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">{g.grade} ({g.min}+)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Exam Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Academic Scheduling</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configure Assessment details</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddExam} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Examination Title</label>
                      <select 
                        value={newExam.title} 
                        onChange={e => setNewExam({...newExam, title: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                      >
                        <option value="CA">Continuous Assessment (CA)</option>
                        <option value="Mid-Term">Mid-Term</option>
                        <option value="Terminal">Terminal Exam</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Score</label>
                      <input 
                        type="number" 
                        value={newExam.maxMarks}
                        onChange={e => setNewExam({...newExam, maxMarks: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Academic Term</label>
                      <select value={newExam.term} onChange={e => setNewExam({...newExam, term: Number(e.target.value) as 1|2})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium">
                        <option value={1}>Term I</option>
                        <option value={2}>Term II</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                      <input 
                        type="number" 
                        value={newExam.year}
                        onChange={e => setNewExam({...newExam, year: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subject Registry</label>
                    <select required value={newExam.subjectId} onChange={e => setNewExam({...newExam, subjectId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium">
                      <option value="">Select...</option>
                      {SCHOOL_CONFIG.defaultSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assessment Date</label>
                  <input 
                    required
                    type="date" 
                    value={newExam.date}
                    onChange={e => setNewExam({...newExam, date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Class Level</label>
                  <select required value={newExam.classId} onChange={e => setNewExam({...newExam, classId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium">
                    <option value="">Select Class...</option>
                    {SCHOOL_CONFIG.academicLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-primary" />
                      <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Assessment Reminders</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        newExam.reminderType !== 'none' ? "text-primary" : "text-slate-400"
                      )}>
                        {newExam.reminderType !== 'none' ? 'Active' : 'Muted'}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setNewExam(prev => ({
                          ...prev,
                          reminderType: prev.reminderType === 'none' ? 'both' : 'none'
                        }))}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-all duration-300",
                          newExam.reminderType !== 'none' ? "bg-primary" : "bg-slate-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm",
                          newExam.reminderType !== 'none' ? "left-5.5" : "left-0.5"
                        )} />
                      </button>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {newExam.reminderType !== 'none' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reminder Interval</label>
                            <select 
                              value={newExam.reminderDays}
                              onChange={e => setNewExam({...newExam, reminderDays: Number(e.target.value)})}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-xs font-bold"
                            >
                              <option value={1}>1 Day Before</option>
                              <option value={3}>3 Days Before</option>
                              <option value={7}>1 Week Before</option>
                              <option value={14}>2 Weeks Before</option>
                              <option value={30}>1 Month Before</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notification Protocol</label>
                            <select 
                              value={newExam.reminderType} 
                              onChange={e => setNewExam({...newExam, reminderType: e.target.value as any})}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-xs font-bold"
                            >
                              <option value="email">Email Only</option>
                              <option value="in-app">In-App Only</option>
                              <option value="both">✨ Both (Premium Upgrade)</option>
                            </select>
                          </div>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest italic">
                          * Automated reminders will be dispatched to teachers, students, and parents.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase text-[10px] tracking-widest">Discard</button>
                  <button type="submit" className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest">Schedule</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mark Entry Modal */}
      <AnimatePresence>
        {isMarkEntryOpen && selectedExam && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMarkEntryOpen(false)} className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-x-4 top-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-2xl bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
              <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold uppercase tracking-tight">Score Entry Protocol</h3>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">{selectedExam.subjectId} • {selectedExam.classId} (MAX {selectedExam.maxMarks})</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={downloadTemplate}
                    title="Download Template"
                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                  >
                    <FileDown size={20} />
                  </button>
                  <label className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer">
                    <Upload size={20} />
                    <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                  </label>
                  <button onClick={() => setIsMarkEntryOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"><X size={20} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <table className="w-full text-left order-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate Identity</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Raw Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {db.students.filter(s => s.classId === selectedExam.classId).map(student => {
                      const currentMark = marksData[student.id];
                      const isInvalid = currentMark !== undefined && (currentMark < 0 || currentMark > selectedExam.maxMarks);
                      const normMark = currentMark !== undefined ? (currentMark / selectedExam.maxMarks) * 100 : undefined;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                               <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{student.name}</p>
                               <div className="flex flex-col gap-1.5">
                                  <textarea 
                                    placeholder="Add feedback or generate with AI..."
                                    value={aiFeedback[student.id] || ''}
                                    onChange={e => setAiFeedback({...aiFeedback, [student.id]: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-medium focus:ring-4 focus:ring-primary/5 outline-none resize-none transition-all h-20"
                                  />
                                  <button 
                                    onClick={() => generateSmartFeedback(student)}
                                    disabled={marksData[student.id] === undefined || isGeneratingFeedback[student.id]}
                                    className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors disabled:opacity-30 self-start"
                                  >
                                    {isGeneratingFeedback[student.id] ? (
                                      <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                      <Sparkles size={10} />
                                    )}
                                    Generate Smart Feedback
                                  </button>
                               </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right align-top">
                             <div className="flex flex-col items-end gap-2 mt-1">
                               <div className="flex items-center gap-3">
                                  {normMark !== undefined && !isInvalid && (
                                     <span className={cn(
                                       "text-[9px] font-black px-2 py-1 rounded uppercase tracking-[0.1em] text-white",
                                       normMark >= 75 ? "bg-emerald-600" :
                                       normMark >= 65 ? "bg-indigo-600" :
                                       normMark >= 45 ? "bg-amber-600" :
                                       "bg-red-600"
                                     )}>
                                       Grade {calculateGrade(normMark, selectedExam.classId as AcademicLevel, db.settings?.gradingScales)}
                                     </span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {isInvalid && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max={selectedExam.maxMarks}
                                      value={marksData[student.id] || ''}
                                      onChange={e => setMarksData({...marksData, [student.id]: Number(e.target.value)})}
                                      className={cn(
                                        "w-24 px-4 py-2 bg-slate-50 border rounded-lg text-right font-bold outline-none transition-all",
                                        isInvalid 
                                          ? "border-red-500 bg-red-50 text-red-600 focus:ring-4 focus:ring-red-500/10" 
                                          : "border-slate-200 text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary"
                                      )}
                                    />
                                  </div>
                               </div>
                               {isInvalid && <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Score out of range</span>}
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-6 border-t border-slate-100 bg-white">
                <button 
                  onClick={handleSaveMarks}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest"
                >
                  Finalize & Encrypt Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isReminderModalOpen && reminderExam && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReminderModalOpen(false)} className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Reminder Protocol</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{reminderExam.title} - {reminderExam.subjectId}</p>
                </div>
                <button onClick={() => setIsReminderModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      reminderEditData.reminderType !== 'none' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-200 text-slate-400"
                    )}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">Enable Reminders</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Status: <span className={reminderEditData.reminderType !== 'none' ? "text-primary" : "text-slate-400"}>
                          {reminderEditData.reminderType !== 'none' ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setReminderEditData(prev => ({
                      ...prev,
                      reminderType: prev.reminderType === 'none' ? 'both' : 'none'
                    }))}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-all duration-300",
                      reminderEditData.reminderType !== 'none' ? "bg-primary" : "bg-slate-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm",
                      reminderEditData.reminderType !== 'none' ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                <AnimatePresence>
                  {reminderEditData.reminderType !== 'none' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Send Reminder</label>
                          <select 
                            value={reminderEditData.reminderDays}
                            onChange={e => setReminderEditData({...reminderEditData, reminderDays: Number(e.target.value)})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-xs font-bold"
                          >
                            <option value={1}>1 Day Before</option>
                            <option value={3}>3 Days Before</option>
                            <option value={7}>1 Week Before</option>
                            <option value={14}>2 Weeks Before</option>
                            <option value={30}>1 Month Before</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reminder Type</label>
                          <select 
                            value={reminderEditData.reminderType} 
                            onChange={e => setReminderEditData({...reminderEditData, reminderType: e.target.value as any})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-xs font-bold"
                          >
                            <option value="email">Email Only</option>
                            <option value="in-app">In-App Only</option>
                            <option value="both">✨ Both</option>
                          </select>
                        </div>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-[9px] text-primary font-bold uppercase tracking-widest leading-relaxed">
                          Reminders will be automatically dispatched to all candidates and teaching staff {reminderEditData.reminderDays} days prior to {new Date(reminderExam.date).toLocaleDateString()}.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 flex gap-4">
                  <button onClick={() => setIsReminderModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
                  <button onClick={handleSaveReminders} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest">Update Policy</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFeedbackModalOpen && feedbackResult && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFeedbackModalOpen(false)} className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Personalized Feedback</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {db.students.find(s => s.id === feedbackResult.studentId)?.name} 
                    • {db.exams.find(e => e.id === feedbackResult.examId)?.subjectId}
                  </p>
                </div>
                <button onClick={() => setIsFeedbackModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Candidate Performance Note</label>
                  <textarea 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    readOnly={!canManage}
                    placeholder={canManage ? "Enter personalized feedback regarding student performance..." : "No feedback provided yet."}
                    className={cn(
                      "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 outline-none text-sm font-medium h-32 resize-none transition-all",
                      canManage ? "bg-slate-50" : "bg-slate-50/30 text-slate-500 cursor-default"
                    )}
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button onClick={() => setIsFeedbackModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase text-[10px] tracking-widest">
                    {canManage ? "Cancel" : "Close"}
                  </button>
                  {canManage && (
                    <button onClick={handleSaveFeedback} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest">Update Feedback</button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBulkImportOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsBulkImportOpen(false); setImportStep('upload'); }} className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Bulk Exam Import</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {importStep === 'upload' ? 'Import multiple exams via CSV' : 'Map CSV columns to exam fields'}
                  </p>
                </div>
                <button onClick={() => { setIsBulkImportOpen(false); setImportStep('upload'); }} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-8 space-y-6">
                {importStep === 'upload' ? (
                  <>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">CSV Guide</p>
                          <p className="text-[10px] text-slate-400 font-medium">CSV should contain columns for title, date, class, and subject.</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const csvContent = "exam_title,date,class_level,subject_name,max_marks\n" + 
                            "Mid-Term,2026-06-15,Form 4,Mathematics,100\n" +
                            "CA,2026-06-20,Form 1,English,50";
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `exams_import_template.csv`;
                          a.click();
                        }}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                      >
                        <FileDown size={14} />
                        Download Template
                      </button>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 group-hover:bg-primary/10 transition-all" />
                      <div className="relative p-12 flex flex-col items-center justify-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-primary">
                          <Upload size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Upload CSV File</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Select file to begin mapping</p>
                        </div>
                        <input type="file" accept=".csv" onChange={handleBulkCSVImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {Object.keys(columnMapping).map((field) => (
                        <div key={field} className="flex items-center justify-between gap-4">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest w-24">
                            {field.replace(/([A-Z])/g, ' $1').trim()}:
                          </label>
                          <select 
                            value={columnMapping[field]}
                            onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                          >
                            <option value="">Select Column...</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                      <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest opacity-80 mt-1 italic leading-relaxed">
                        Verify mapping before proceeding. Subject names should match official registry otherwise they will be imported as-is.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => setImportStep('upload')} className="flex-1 py-4 border border-slate-200 text-slate-400 font-bold rounded-xl hover:bg-slate-50 transition-colors uppercase text-[10px] tracking-widest">Back</button>
                      <button 
                        onClick={processImport} 
                        disabled={!columnMapping.title || !columnMapping.date || !columnMapping.classId || !columnMapping.subjectId}
                        className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
                      >
                        Import Records
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};