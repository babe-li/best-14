/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  Clock, 
  MapPin, 
  User as UserIcon,
  BookOpen,
  ArrowRight,
  MoreVertical,
  Download,
  Upload,
  FileDown,
  AlertTriangle,
  Check
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { type TimetableEntry, type Class, type Subject, type User as UserType } from '../types';
import { cn } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const Timetable = () => {
  const [db, setDb] = useState(storageService.getDB());
  const [currentUser] = useState(storageService.getCurrentUser());
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>(
    currentUser?.role === 'teacher' ? 'teacher' : 'class'
  );
  const [selectedClass, setSelectedClass] = useState<string>(
    currentUser?.role === 'teacher' ? 'all' : (db.classes[0]?.id || 'all')
  );
  const [selectedTeacher, setSelectedTeacher] = useState<string>(
    currentUser?.role === 'teacher' ? currentUser.id : ''
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    day: '',
    startTime: '',
    endTime: '',
    subjectCode: '',
    teacherInfo: '',
    room: ''
  });
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState<number>(0);
  const [isImporting, setIsImporting] = useState(false);

  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formData, setFormData] = useState<Partial<TimetableEntry>>({
    day: 'Monday',
    startTime: '08:00',
    endTime: '08:40',
    subjectId: '',
    teacherId: '',
    classId: '',
    room: ''
  });

  const canManage = currentUser?.role === 'admin';

  useEffect(() => {
    if (db.classes.length > 0 && selectedClass === '') {
      setSelectedClass(db.classes[0].id);
    }
  }, [db.classes, selectedClass]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data);
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          
          // Attempt auto-mapping
          const newMapping = { ...columnMapping };
          headers.forEach(h => {
            const lowH = h.toLowerCase();
            if (lowH.includes('day')) newMapping.day = h;
            if (lowH.includes('start')) newMapping.startTime = h;
            if (lowH.includes('end')) newMapping.endTime = h;
            if (lowH.includes('subject') || lowH.includes('code')) newMapping.subjectCode = h;
            if (lowH.includes('teacher')) newMapping.teacherInfo = h;
            if (lowH.includes('room')) newMapping.room = h;
          });
          setColumnMapping(newMapping);
          setImportStep('mapping');
        }
      },
      error: (err) => {
        setImportErrors([`Failed to parse CSV: ${err.message}`]);
      }
    });
  };

  const validateAndImport = () => {
    setImportErrors([]);
    setIsImporting(true);
    
    const errors: string[] = [];
    const newEntries: TimetableEntry[] = [];
    let successCount = 0;

    if (!columnMapping.day || !columnMapping.startTime || !columnMapping.endTime || !columnMapping.subjectCode) {
      errors.push('Please map the required columns: Day, Start Time, End Time, and Subject');
      setImportErrors(errors);
      setIsImporting(false);
      return;
    }

    csvData.forEach((row, index) => {
      const rowNum = index + 2;
      const dayRaw = row[columnMapping.day];
      const start = row[columnMapping.startTime];
      const end = row[columnMapping.endTime];
      const subCode = row[columnMapping.subjectCode];
      const teacherInfo = row[columnMapping.teacherInfo];
      const room = row[columnMapping.room] || '';

      // 1. Day Validation
      const validDay = DAYS.find(d => d.toLowerCase() === String(dayRaw).trim().toLowerCase());
      if (!validDay) {
        errors.push(`Row ${rowNum}: Invalid day "${dayRaw}"`);
        return;
      }

      // 2. Time Validation (Basic HH:mm check)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(start)) {
        errors.push(`Row ${rowNum}: Invalid start time "${start}". Use HH:mm format.`);
        return;
      }
      if (!timeRegex.test(end)) {
        errors.push(`Row ${rowNum}: Invalid end time "${end}". Use HH:mm format.`);
        return;
      }

      // 3. Subject Validation
      const subject = db.subjects.find(s => 
        s.code.toLowerCase() === String(subCode).trim().toLowerCase() ||
        s.name.toLowerCase() === String(subCode).trim().toLowerCase()
      );
      if (!subject) {
        errors.push(`Row ${rowNum}: Subject "${subCode}" not found in system.`);
        return;
      }

      // 4. Teacher Look-up (Optional)
      let teacherId = '';
      if (teacherInfo) {
        const info = String(teacherInfo).trim().toLowerCase();
        const teacher = db.users.find(u => 
          (u.role === 'teacher' || u.role === 'admin') &&
          (u.name.toLowerCase() === info || u.email.toLowerCase() === info)
        );
        if (teacher) teacherId = teacher.id;
      }

      newEntries.push({
        id: generateId(),
        day: validDay,
        startTime: start,
        endTime: end,
        subjectId: subject.id,
        teacherId: teacherId,
        classId: selectedClass !== 'all' ? selectedClass : '',
        room: String(room)
      });
      successCount++;
    });

    if (errors.length > 0) {
      setImportErrors(errors);
      setIsImporting(false);
    } else {
      if (selectedClass === 'all') {
        setImportErrors(['Please select a specific class to import this timetable into.']);
        setIsImporting(false);
        return;
      }

      const newDb = { ...db };
      // Assign classId to all new entries
      const finalEntries = newEntries.map(e => ({ ...e, classId: selectedClass }));
      
      newDb.timetable = [...(newDb.timetable || []), ...finalEntries];
      storageService.saveDB(newDb);
      setDb(newDb);
      setImportSuccess(successCount);
      setIsImporting(false);
      
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportStep('upload');
        setCsvData([]);
        setImportSuccess(0);
      }, 2500);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "day,start_time,end_time,subject_code,teacher_name,room\n" + 
      "Monday,08:00,08:40,MATH,John Teacher,Room 101\n" +
      "Tuesday,09:00,09:40,PHYS,Sarah Instructor,Lab 1";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable_template_${selectedClass}.csv`;
    a.click();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newDb = { ...db };
    if (!newDb.timetable) newDb.timetable = [];

    if (editingEntry) {
      newDb.timetable = newDb.timetable.map(entry => 
        entry.id === editingEntry.id ? { ...entry, ...formData } as TimetableEntry : entry
      );
    } else {
      const classId = formData.classId || (selectedClass !== 'all' ? selectedClass : '');
      if (!classId) {
        alert('Please select a class for this session');
        return;
      }

      const newEntry: TimetableEntry = {
        id: generateId(),
        day: formData.day || 'Monday',
        startTime: formData.startTime || '08:00',
        endTime: formData.endTime || '08:40',
        subjectId: formData.subjectId || '',
        teacherId: formData.teacherId || '',
        classId: classId,
        room: formData.room || ''
      };
      newDb.timetable.push(newEntry);
    }

    storageService.saveDB(newDb);
    setDb(newDb);
    setIsAddModalOpen(false);
    setEditingEntry(null);
    setFormData({
      day: 'Monday',
      startTime: '08:00',
      endTime: '08:40',
      subjectId: '',
      teacherId: '',
      classId: '',
      room: ''
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this class session?')) {
      const newDb = { ...db };
      newDb.timetable = newDb.timetable.filter(entry => entry.id !== id);
      storageService.saveDB(newDb);
      setDb(newDb);
    }
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsAddModalOpen(true);
  };

  const classTimetable = db.timetable.filter(entry => {
    const matchesClass = selectedClass === 'all' || entry.classId === selectedClass;
    const matchesTeacher = !selectedTeacher || entry.teacherId === selectedTeacher;
    return matchesClass && matchesTeacher;
  });
  
  // Sort entries by time within each day
  const sortedTimetable = [...classTimetable].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getSubjectName = (id: string) => db.subjects.find(s => s.id === id)?.name || id;
  const getTeacherName = (id: string) => db.users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
            Timetable <span className="text-primary">Management</span>
          </h2>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            Scheduling System • Term II 2026
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => {
                setViewMode('class');
                if (selectedClass === 'all' && db.classes.length > 0) setSelectedClass(db.classes[0].id);
                setSelectedTeacher('');
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                viewMode === 'class' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <BookOpen size={12} className={cn(viewMode === 'class' ? "text-primary" : "text-slate-300")} />
              Class View
            </button>
            <button 
              onClick={() => {
                setViewMode('teacher');
                setSelectedClass('all');
                if (currentUser?.role === 'teacher') {
                  setSelectedTeacher(currentUser.id);
                }
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                viewMode === 'teacher' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <UserIcon size={12} className={cn(viewMode === 'teacher' ? "text-primary" : "text-slate-300")} />
              Teacher View
            </button>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'class' ? (
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              >
                <option value="all">All Classes</option>
                {db.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
            ) : (
              <select 
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all"
              >
                <option value="">Select Teacher...</option>
                {db.users.filter(u => u.role === 'teacher' || u.role === 'admin').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}

            {viewMode === 'teacher' && selectedTeacher && (
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all"
              >
                <option value="all">All My Classes</option>
                {db.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
            )}

            {currentUser?.role === 'teacher' && selectedTeacher !== currentUser.id && (
              <button 
                onClick={() => {
                  setViewMode('teacher');
                  setSelectedTeacher(currentUser.id);
                  setSelectedClass('all');
                }}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                My Schedule
              </button>
            )}

            {canManage && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  <Upload size={16} />
                  Import CSV
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
                >
                  <Plus size={16} />
                  Add Entry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {DAYS.slice(0, 5).map((day) => (
          <div key={day} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day}</h3>
              <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                {sortedTimetable.filter(e => e.day === day).length} Sessions
              </span>
            </div>

            <div className="space-y-3 min-h-[500px] p-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 uppercase tracking-tighter">
              {sortedTimetable.filter(e => e.day === day).map((entry) => (
                <motion.div 
                  layoutId={entry.id}
                  key={entry.id}
                  className="group relative bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ring-1 ring-slate-100"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black">
                      <Clock size={12} />
                      {entry.startTime} - {entry.endTime}
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(entry)}
                          className="p-1 px-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-primary transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 px-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h4 className="text-xs font-black text-slate-900 mb-1 truncate flex items-center justify-between">
                    <span>{getSubjectName(entry.subjectId)}</span>
                    {selectedClass === 'all' && (
                      <span className="text-[8px] text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                        {db.classes.find(c => c.id === entry.classId)?.name}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                      <UserIcon size={10} className="text-slate-300" />
                      {getTeacherName(entry.teacherId)}
                    </div>
                    {entry.room && (
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                        <MapPin size={10} className="text-slate-300" />
                        Room: {entry.room}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {sortedTimetable.filter(e => e.day === day).length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ArrowRight size={14} className="opacity-20" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">No Sessions</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit max-h-[90vh] bg-white z-[110] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                    {importStep === 'upload' ? 'Bulk Import Sessions' : 'Map CSV Columns'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {importStep === 'upload' ? 'Populate timetable from CSV' : `Class: ${db.classes.find(c => c.id === selectedClass)?.name || 'N/A'}`}
                  </p>
                </div>
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                {importSuccess > 0 ? (
                  <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                      <Check size={32} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-emerald-600 uppercase tracking-tight">Import Successful!</p>
                      <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mt-1">
                        {importSuccess} sessions synchronized for {db.classes.find(c => c.id === selectedClass)?.name}
                      </p>
                    </div>
                  </div>
                ) : importStep === 'upload' ? (
                  <>
                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-all group relative flex flex-col items-center justify-center gap-4 text-center">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all">
                        <Upload size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Drop your CSV here</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">or click to browse files</p>
                      </div>
                      <input 
                        type="file" 
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 flex-shrink-0" size={16} />
                        <div>
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-tight">Data Integrity Guard</p>
                          <p className="text-[9px] font-bold text-amber-600/80 leading-relaxed mt-1">
                            The system will allow you to map your own headers in the next step. Ensure subject codes match exactly.
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={downloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <FileDown size={14} />
                        Download Reference Template
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {Object.keys(columnMapping).map((field) => (
                        <div key={field} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                            {['day', 'startTime', 'endTime', 'subjectCode'].includes(field) && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={columnMapping[field]}
                            onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                          >
                            <option value="">Select Column...</option>
                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ArrowRight size={12} className="text-primary" />
                        First 3 rows preview
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr>
                              {csvHeaders.slice(0, 4).map(h => <th key={h} className="text-[8px] font-black text-slate-400 uppercase px-2 py-1">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 3).map((row, i) => (
                              <tr key={i} className="border-t border-slate-200">
                                {csvHeaders.slice(0, 4).map(h => <td key={h} className="text-[10px] font-medium text-slate-600 px-2 py-1.5 truncate max-w-[100px]">{row[h]}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {importErrors.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-2 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Validation Errors:</p>
                        {importErrors.map((err, i) => (
                          <p key={i} className="text-[9px] font-bold text-red-500 flex items-center gap-2">
                            <AlertTriangle size={10} />
                            {err}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => {
                          setImportStep('upload');
                          setImportErrors([]);
                        }} 
                        className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Back
                      </button>
                      <button 
                        onClick={validateAndImport}
                        disabled={isImporting}
                        className="flex-[2] py-3.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isImporting ? (
                          <>
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            Finalize Import
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white z-[110] rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <form onSubmit={handleSave}>
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                      {editingEntry ? 'Edit Session' : 'Schedule New Session'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Class Slot Configuration</p>
                  </div>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-all">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Day</label>
                      <select 
                        required
                        value={formData.day}
                        onChange={(e) => setFormData({...formData, day: e.target.value as any})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      >
                        {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room (Optional)</label>
                      <input 
                        type="text"
                        placeholder="E.g. Lab 1"
                        value={formData.room}
                        onChange={(e) => setFormData({...formData, room: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                      <input 
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                      <input 
                        type="time"
                        required
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Assignment</label>
                    <select 
                      required
                      value={formData.classId || (selectedClass !== 'all' ? selectedClass : '')}
                      onChange={(e) => setFormData({...formData, classId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                    >
                      <option value="">Select Class...</option>
                      {db.classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                    <div className="relative">
                      <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        required
                        value={formData.subjectId}
                        onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all appearance-none"
                      >
                        <option value="">Select Subject</option>
                        {db.subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teacher</label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        required
                        value={formData.teacherId}
                        onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all appearance-none"
                      >
                        <option value="">Select Teacher</option>
                        {db.users.filter(u => u.role === 'teacher' || u.role === 'admin').map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-3.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={14} />
                      {editingEntry ? 'Update Session' : 'Add to Calendar'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
