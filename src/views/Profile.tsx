/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  MapPin, 
  Calendar, 
  Award, 
  BookOpen, 
  GraduationCap, 
  Users, 
  CreditCard,
  Briefcase,
  Smartphone,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  MessageCircle,
  Clock
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
  Cell
} from 'recharts';
import { storageService } from '../services/storageService';
import { type User as UserType, type Student } from '../types';
import { cn } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';

export const Profile = () => {
  const [user, setUser] = useState<UserType | null>(storageService.getCurrentUser());
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [children, setChildren] = useState<Student[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const db = storageService.getDB();
    if (user?.role === 'student' && user.studentMetadata) {
      const student = db.students.find(s => s.id === user.studentMetadata?.studentId);
      if (student) {
        setStudentData(student);
        const sResults = db.results.filter(r => r.studentId === student.id);
        const sAttendance = db.attendance.filter(a => a.studentId === student.id);
        setResults(sResults);
        setAttendance(sAttendance);
      }
    }

    if (user?.role === 'parent' && user.parentMetadata) {
      const linkedChildren = db.students.filter(s => user.parentMetadata?.childrenIds.includes(s.id));
      setChildren(linkedChildren);
    }
  }, [user]);

  const handleSave = () => {
    setIsEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Profile Header */}
      <div className="relative bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary to-primary-dark relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-2xl" />
        </div>
        
        <div className="px-10 pb-10">
          <div className="flex flex-col md:flex-row items-end gap-6 -mt-16 relative z-10 lg:px-6">
            <div className="w-32 h-32 rounded-[32px] bg-white p-2 shadow-2xl border border-slate-100">
               <div className="w-full h-full bg-slate-50 rounded-[24px] flex items-center justify-center text-primary font-black text-4xl border border-slate-100 shadow-inner">
                  {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
               </div>
            </div>
            <div className="flex-1 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">{user.name}</h1>
                <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {user.role} Status
                </span>
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <Mail size={14} className="text-primary" />
                {user.email}
              </p>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
            >
              {isEditing ? 'Cancel Edit' : 'Modify Narrative'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
             <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                DPA Security Info
             </h3>
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <Smartphone size={18} />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Register</p>
                      <p className="text-sm font-bold text-slate-900">{user.phone || '+255 (XXX) XXX XXX'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <Lock size={18} />
                   </div>
                   <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                         System Password
                         <button onClick={() => setShowPassword(!showPassword)} className="text-primary hover:underline">
                            {showPassword ? <EyeOff size={12}/> : <Eye size={12}/>}
                         </button>
                      </p>
                      <p className="text-sm font-bold text-slate-900 font-mono tracking-tighter">
                         {showPassword ? 'P@ssword2026!' : '••••••••••••'}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <Calendar size={18} />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registered At</p>
                      <p className="text-sm font-bold text-slate-900">May 14, 2026</p>
                   </div>
                </div>
             </div>
             
             {user.twoFactorEnabled && (
               <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                     <Shield size={16} />
                  </div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Biometric Link Active</p>
               </div>
             )}
          </div>

          {/* Quick Stats or Badge */}
          <div className="bg-slate-900 p-8 rounded-[32px] text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
             <div className="relative z-10">
                <Award size={32} className="text-premium-gold mb-4" />
                <h4 className="text-lg font-black tracking-tight uppercase leading-none">Institutional <br /> Reputation</h4>
                <div className="mt-6 flex items-center justify-between">
                   <div className="text-center">
                      <p className="text-2xl font-black">98%</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Score</p>
                   </div>
                   <div className="text-center">
                      <p className="text-2xl font-black">4.9</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Trust</p>
                   </div>
                   <div className="text-center">
                      <p className="text-2xl font-black">#A1</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Tier</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Role Specific Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Edit Form if editing */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[32px] border-2 border-primary shadow-2xl space-y-6"
            >
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Briefcase size={20} className="text-primary" />
                Modify Profile Parameters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Display Descriptor</label>
                   <input 
                     type="text" 
                     defaultValue={user.name}
                     className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold transition-all"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Terminal Voice</label>
                   <input 
                     type="tel" 
                     defaultValue={user.phone}
                     placeholder="+255..."
                     className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold transition-all"
                   />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                 <button 
                   onClick={handleSave}
                   className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                 >
                   <Save size={16} />
                   Synchronize Changes
                 </button>
                 <button 
                   onClick={() => setIsEditing(false)}
                   className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                 >
                   Abort Audit
                 </button>
              </div>
            </motion.div>
          )}

          {success && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-black uppercase tracking-widest"
             >
                <CheckCircle2 size={18} />
                Profile synchronization successful.
             </motion.div>
          )}

          {/* Student Narrative */}
          {user.role === 'student' && studentData && (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 relative z-10">
                     <GraduationCap size={18} className="text-primary" />
                     Academic Enrollment Logic
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission</p>
                        <p className="text-sm font-black text-slate-900 italic tracking-tight">{studentData.admissionNo}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</p>
                        <p className="text-sm font-black text-slate-900">{studentData.classId}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</p>
                        <p className="text-sm font-black text-slate-900">{studentData.section || 'A'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                        <p className="text-sm font-black text-slate-900">{studentData.gender}</p>
                     </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Status</p>
                           <CreditCard size={14} className="text-indigo-500" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 italic tracking-tighter">
                           TZS {studentData.feeBalance.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Outstanding Registry Balance</p>
                     </div>
                     <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strong Sector</p>
                           <Award size={14} className="text-emerald-500" />
                        </div>
                        <p className="text-lg font-black text-slate-900 uppercase tracking-tight">
                           {studentData.metadata?.strongSubject || 'Generalist'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Core Academic Pillar</p>
                     </div>
                  </div>
               </div>

               {/* Performance Trends in Profile */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm">
                     <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-8">
                        <TrendingUp size={14} className="text-primary" />
                        Performance Trajectory
                     </h4>
                     <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={results
                             .sort((a, b) => {
                               const db = storageService.getDB();
                               const examA = db.exams.find(e => e.id === a.examId);
                               const examB = db.exams.find(e => e.id === b.examId);
                               return (examA?.date || '').localeCompare(examB?.date || '');
                             })
                             .map(r => {
                               const db = storageService.getDB();
                               return {
                                 name: db.exams.find(e => e.id === r.examId)?.title.split(' ')[0] || 'Exam',
                                 score: r.marks
                               };
                             })}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="name" hide />
                              <YAxis hide domain={[0, 100]} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                              />
                              <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                           </LineChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="p-8 bg-white border border-slate-200 rounded-[32px] shadow-sm">
                     <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-8">
                        <Clock size={14} className="text-emerald-500" />
                        Attendance Verification
                     </h4>
                     <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={[
                             { name: 'P', count: attendance.filter(a => a.status === 'present').length },
                             { name: 'A', count: attendance.filter(a => a.status === 'absent').length },
                             { name: 'L', count: attendance.filter(a => a.status === 'late').length },
                           ]}>
                              <XAxis dataKey="name" hide />
                              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                 <Cell fill="#10b981" />
                                 <Cell fill="#ef4444" />
                                 <Cell fill="#f59e0b" />
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>

               {/* Teacher Remarks in Profile */}
               <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                     <MessageCircle size={18} className="text-primary" />
                     Pedagogical Commentary
                  </h3>
                  <div className="space-y-4">
                     {[
                        { author: 'Mwl. Julius Kambarage', content: 'Remarkable aptitude in problem solving. Keep up the momentum.', date: 'Today' },
                        { author: 'Mwl. Farida Juma', content: 'Class participation is exceptional this term.', date: '3 days ago' }
                     ].map((remark, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="flex justify-between items-start mb-2">
                              <p className="text-[10px] font-black text-slate-900 uppercase">{remark.author}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{remark.date}</p>
                           </div>
                           <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">"{remark.content}"</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {/* Teacher Narrative */}
          {user.role === 'teacher' && (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 relative z-10">
                     <BookOpen size={18} className="text-primary" />
                     Pedagogical Assignments
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mb-8">
                     <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Subject Specialization</p>
                        <div className="flex flex-wrap gap-2">
                           {user.teacherMetadata?.subjects.map(s => (
                              <span key={s} className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-black uppercase text-indigo-600 tracking-widest shadow-sm">
                                 {s}
                              </span>
                           ))}
                        </div>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Employee Protocol ID</p>
                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter">
                           {user.teacherMetadata?.employeeId || 'ST-2026-X'}
                        </p>
                     </div>
                  </div>

                  <div className="relative z-10">
                     <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Associated Academic Levels</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['Form 1 Physics', 'Form 4 Calculus'].map(cls => (
                           <div key={cls} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary transition-all cursor-default">
                              <span className="text-xs font-bold text-slate-700">{cls}</span>
                              <ChevronRight size={14} className="text-slate-300" />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Parent Narrative */}
          {user.role === 'parent' && (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 relative z-10">
                     <Users size={18} className="text-primary" />
                     Associated Dependent Registry
                  </h3>
                  
                  <div className="space-y-4 relative z-10">
                     {children.map(student => (
                        <div key={student.id} className="group p-6 bg-slate-50 rounded-[28px] border border-slate-100 hover:border-primary/20 hover:bg-white transition-all shadow-sm flex items-center gap-6">
                           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary font-black text-xl border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                              {student.name[0]}
                           </div>
                           <div className="flex-1">
                              <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none group-hover:text-primary transition-colors">{student.name}</h4>
                              <div className="flex items-center gap-3 mt-2">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.admissionNo}</span>
                                 <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">{student.classId}</span>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-black text-slate-900">Arrears: {student.feeBalance > 0 ? `TZS ${student.feeBalance.toLocaleString()}` : 'Cleared'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fiscal Registry</p>
                           </div>
                        </div>
                     ))}
                     {children.length === 0 && (
                        <div className="p-10 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                           <p className="text-sm font-bold text-slate-400 italic">No dependents linked to this credentials hub.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* Librarian / Accountant / Staff Narrative */}
          {['accountant', 'librarian', 'admin'].includes(user.role) && (
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 relative z-10">
                     <Shield size={18} className="text-primary" />
                     Administrative Permissions Matrix
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Financial Audit Power</span>
                       <CheckCircle2 size={16} className={cn(user.role === 'accountant' || user.role === 'admin' ? "text-emerald-500" : "text-slate-200")} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Library Resource Custody</span>
                       <CheckCircle2 size={16} className={cn(user.role === 'librarian' || user.role === 'admin' ? "text-emerald-500" : "text-slate-200")} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">User Identity Lifecycle</span>
                       <CheckCircle2 size={16} className={cn(user.role === 'admin' ? "text-emerald-500" : "text-slate-200")} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">System Configuration</span>
                       <CheckCircle2 size={16} className={cn(user.role === 'admin' ? "text-emerald-500" : "text-slate-200")} />
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* Admin / Universal Section */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Shield size={18} className="text-primary" />
                Global Audit Log
             </h3>
             <div className="space-y-4">
                {[
                  { event: 'Authentication Established', date: 'Today, 09:12 AM', ip: '129.201.32.4' },
                  { event: 'Password Verification Integrity', date: 'May 06, 2026', ip: '129.201.32.4' }
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <div>
                           <p className="text-xs font-bold text-slate-900">{log.event}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.date}</p>
                        </div>
                     </div>
                     <span className="text-[9px] font-mono text-slate-400 font-bold px-2 py-1 bg-white rounded border border-slate-100">{log.ip}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
