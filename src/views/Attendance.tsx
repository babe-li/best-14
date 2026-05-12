/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Filter, 
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Save,
  MessageSquare,
  Sparkles,
  Loader2
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { type Student, type Attendance, type AcademicLevel } from '../types';
import { cn, generateId } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';

export const DailyAttendance = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<AcademicLevel>(SCHOOL_CONFIG.academicLevels[0] as AcademicLevel);
  const [searchTerm, setSearchTerm] = useState('');
  const [marking, setMarking] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [saving, setSaving] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<Record<string, string>>({});
  const [draftingFor, setDraftingFor] = useState<Record<string, boolean>>({});

  const generateDraft = async (student: Student) => {
    setDraftingFor(prev => ({ ...prev, [student.id]: true }));
    try {
      // Find historical attendance for this student
      const studentAttendance = attendance.filter(a => a.studentId === student.id);
      const absentCount = studentAttendance.filter(a => a.status === 'absent').length + (marking[student.id] === 'absent' ? 1 : 0);
      const totalRecorded = studentAttendance.length + 1;
      const rate = Math.round(((totalRecorded - absentCount) / totalRecorded) * 100);

      const draft = await aiService.draftAttendanceAlert(student.name, rate, absentCount);
      setAiDrafts(prev => ({ ...prev, [student.id]: draft }));
    } catch (error) {
      console.error("Draft generation failed", error);
    } finally {
      setDraftingFor(prev => ({ ...prev, [student.id]: false }));
    }
  };

  // Helper to handle class selection safely
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClass(e.target.value as AcademicLevel);
  };

  useEffect(() => {
    const db = storageService.getDB();
    setStudents(db.students);
    const existing = (db.attendance || []).filter(a => a.date === selectedDate);
    const markMap: Record<string, 'present' | 'absent' | 'late'> = {};
    existing.forEach(a => { markMap[a.studentId] = a.status; });
    setMarking(markMap);
    setAttendance(db.attendance || []);
  }, [selectedDate]);

  const filteredStudents = students.filter(s => 
    s.classId === (selectedClass as string) && 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setMarking(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const db = storageService.getDB();
      const currentAttendance = db.attendance || [];
      const otherAttendance = currentAttendance.filter(a => a.date !== selectedDate || students.find(s => s.id === a.studentId)?.classId !== (selectedClass as string));
      
      const newAttendance: Attendance[] = Object.entries(marking)
        .filter(([sid]) => students.find(s => s.id === sid)?.classId === (selectedClass as string))
        .map(([studentId, status]) => ({
          id: generateId(),
          date: selectedDate,
          studentId,
          status
        }));

      const updated = [...otherAttendance, ...newAttendance];
      storageService.saveDB({ ...db, attendance: updated });
      setAttendance(updated);
      setSaving(false);
    }, 800);
  };

  const stats = {
    present: Object.values(marking).filter(v => v === 'present').length,
    absent: Object.values(marking).filter(v => v === 'absent').length,
    late: Object.values(marking).filter(v => v === 'late').length,
    total: filteredStudents.length
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-slate-900">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Daily Occupancy Audit</h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Verification of student presence for NECTA compliance.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
             <Calendar size={16} className="text-primary" />
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-transparent text-xs font-bold uppercase tracking-widest outline-none"
             />
          </div>
          <select 
            value={selectedClass}
            onChange={handleClassChange}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all outline-none"
          >
            {SCHOOL_CONFIG.academicLevels.map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Present</p>
           <h3 className="text-3xl font-extrabold text-emerald-700">{stats.present} <span className="text-sm opacity-50">/ {stats.total}</span></h3>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
           <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Late Arrivals</p>
           <h3 className="text-3xl font-extrabold text-amber-700">{stats.late}</h3>
        </div>
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
           <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Absent</p>
           <h3 className="text-3xl font-extrabold text-red-700">{stats.absent}</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col justify-between">
           <div className="flex items-center gap-2">
             <ShieldCheck size={16} className="text-primary" />
             <p className="text-[10px] font-bold uppercase tracking-widest">Integrity Lock</p>
           </div>
           <button 
             onClick={handleSave}
             disabled={saving}
             className="w-full mt-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all"
           >
             {saving ? "Encrypting..." : <><Save size={14}/> Publish Register</>}
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name or admission #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-xs font-medium"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left order-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate Identity</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold">{student.admissionNo}</p>
                      </div>
                      <AnimatePresence>
                        {marking[student.id] === 'absent' && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => generateDraft(student)}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors group relative"
                            title="Generate Parent Alert"
                          >
                            <MessageSquare size={14} />
                            <Sparkles size={8} className="absolute -top-1 -right-1 text-amber-500 animate-pulse" />
                            {draftingFor[student.id] && <Loader2 size={10} className="animate-spin absolute inset-0 m-auto" />}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                    {aiDrafts[student.id] && marking[student.id] === 'absent' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-slate-900 text-[10px] text-white rounded-xl border border-white/10 relative"
                      >
                         <p className="font-medium italic leading-relaxed opacity-80">"{aiDrafts[student.id]}"</p>
                         <div className="mt-2 flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase text-primary tracking-widest">AI Drafted SMS</span>
                            <button className="px-2 py-0.5 bg-white/10 rounded-md hover:bg-white/20 transition-colors uppercase text-[7px] font-black">Copy</button>
                         </div>
                      </motion.div>
                    )}
                  </td>
                  <td className="px-4 sm:px-8 py-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                       <button 
                         onClick={() => handleStatusChange(student.id, 'present')}
                         className={cn(
                           "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border",
                           marking[student.id] === 'present' 
                             ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20" 
                             : "text-slate-400 border-slate-200 hover:border-emerald-200"
                         )}
                       >
                         Present
                       </button>
                       <button 
                         onClick={() => handleStatusChange(student.id, 'late')}
                         className={cn(
                           "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border",
                           marking[student.id] === 'late' 
                             ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" 
                             : "text-slate-400 border-slate-200 hover:border-amber-200"
                         )}
                       >
                         Late
                       </button>
                       <button 
                         onClick={() => handleStatusChange(student.id, 'absent')}
                         className={cn(
                           "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border",
                           marking[student.id] === 'absent' 
                             ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
                             : "text-slate-400 border-slate-200 hover:border-red-200"
                         )}
                       >
                         Absent
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-8 py-20 text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">No students allocated to this level</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
