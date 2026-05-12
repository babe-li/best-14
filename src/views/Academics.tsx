/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Download,
  Printer,
  TrendingUp,
  BrainCircuit,
  Award,
  BookOpen,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { storageService } from '../services/storageService';
import { type Student, type Result, type Exam, type Subject, type AcademicLevel } from '../types';
import { calculateDivision, calculateGrade, calculatePoints } from '../lib/nectaUtils';
import { cn } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'];

export const Academics = () => {
  const [currentUser] = useState(storageService.getCurrentUser());
  const [db, setDb] = useState(storageService.getDB());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    setDb(storageService.getDB());
  }, []);

  const getStudentResults = (studentId: string) => {
    // Get all results for this student from the top-level results array
    const studentResults = db.results.filter(r => r.studentId === studentId);
    
    return studentResults.map(result => {
      const exam = db.exams.find(e => e.id === result.examId);
      return {
        ...result,
        subjectName: exam?.subjectId || 'Unknown',
        level: (exam?.classId || 'Form 4') as AcademicLevel
      };
    });
  };

  const getDivisionStats = (student: Student) => {
    const results = getStudentResults(student.id);
    if (results.length === 0) return null;
    
    // We assume the class level from the student's assigned class
    const level = student.classId as AcademicLevel;
    return calculateDivision(results, level);
  };

  const filteredStudents = db.students.filter(s => {
    // Filter by search/class
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.classId === selectedClass;
    
    // Role based access
    if (currentUser?.role === 'student') {
      return s.id === currentUser.studentMetadata?.studentId;
    }
    if (currentUser?.role === 'parent') {
      return currentUser.parentMetadata?.childrenIds.includes(s.id);
    }
    
    return matchesSearch && matchesClass;
  });

  const divisionData = filteredStudents.map(s => {
    const stats = getDivisionStats(s);
    return {
      student: s,
      stats
    };
  }).filter(d => d.stats !== null && d.stats !== 'N/A');

  const divisionCounts = {
    'I': divisionData.filter(d => d.stats !== 'N/A' && d.stats?.division === 'I').length,
    'II': divisionData.filter(d => d.stats !== 'N/A' && d.stats?.division === 'II').length,
    'III': divisionData.filter(d => d.stats !== 'N/A' && d.stats?.division === 'III').length,
    'IV': divisionData.filter(d => d.stats !== 'N/A' && d.stats?.division === 'IV').length,
    '0': divisionData.filter(d => d.stats !== 'N/A' && d.stats?.division === '0').length,
  };

  const pieData = Object.entries(divisionCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Academic Performance Audit</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 italic flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            NECTA Standards Compliance & Division Analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm group hover:border-primary transition-all">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                 <BrainCircuit size={18} />
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Audit Protocol</p>
                 <p className="text-xs font-black text-slate-900 leading-none">V2.46 - NECTA</p>
              </div>
           </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <PieChartIcon size={16} className="text-primary" />
                Division Distribution
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex-1 space-y-4">
               {Object.entries(divisionCounts).map(([div, count], idx) => (
                 <div key={div} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Division {div}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{count}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl" />
           <div className="relative z-10">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 ring-4 ring-primary/5">
                 <Trophy size={24} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase mb-2 leading-tight">Academic <br /> Excellence</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">
                Calculations based on NECTA best 7 subject performance audit criteria.
              </p>
           </div>
           
           <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Top Division I</p>
                    <p className="text-2xl font-black text-white italic">{divisionCounts['I']}</p>
                 </div>
                 <button className="p-3 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-all">
                    <Download size={18} />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Calculator Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search candidate by name or admission no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-medium transition-all shadow-sm group-hover:shadow-md"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
        <div className="flex gap-2">
          {['all', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                selectedClass === cls ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-400 border border-slate-100 hover:border-primary"
              )}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {divisionData.map(({ student, stats }) => (
          <motion.div
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="group cursor-pointer bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all relative overflow-hidden"
          >
            {stats !== 'N/A' && (
              <div className={cn(
                "absolute top-4 right-4 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-lg",
                stats.division === 'I' ? "bg-emerald-600 shadow-emerald-600/20" :
                stats.division === 'II' ? "bg-blue-600 shadow-blue-600/20" :
                stats.division === 'III' ? "bg-amber-600 shadow-amber-600/20" :
                stats.division === 'IV' ? "bg-indigo-600 shadow-indigo-600/20" :
                "bg-slate-600 shadow-slate-600/20"
              )}>
                Div {stats.division}
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black text-lg group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{student.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.admissionNo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
               <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Points</p>
                  <p className="text-lg font-black text-slate-900">{stats !== 'N/A' ? stats.points : '--'}</p>
               </div>
               <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg GPA</p>
                  <p className="text-lg font-black text-slate-900">{stats !== 'N/A' ? stats.gpa.toFixed(2) : '--'}</p>
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stats !== 'N/A' ? stats.credits : 0} Credits</span>
               </div>
               <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                  <span className="text-[9px] font-black uppercase tracking-widest">View Audit</span>
                  <ChevronRight size={14} />
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Audit Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 bg-slate-900 text-white relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
                >
                  <X />
                </button>
                
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-black shadow-2xl">
                    {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedStudent.name}</h3>
                    <div className="flex items-center gap-3 mt-2 text-slate-400">
                      <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">{selectedStudent.admissionNo}</span>
                      <span className="text-xs font-bold uppercase tracking-widest italic">{selectedStudent.classId}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">NECTA Division Outcome</h4>
                    {(() => {
                      const stats = getDivisionStats(selectedStudent);
                      if (!stats || stats === 'N/A') return <p className="text-sm font-bold text-slate-400 italic">Audit insufficient...</p>;
                      
                      return (
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-4xl font-black text-slate-900 italic tracking-tighter">Div {stats.division}</p>
                              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Official Result Plan</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xl font-black text-slate-900">{stats.points} PTS</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">(Best 7 Logic)</p>
                           </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">Credit Compliance</h4>
                     <div className="flex justify-center gap-2">
                        {(() => {
                           const stats = getDivisionStats(selectedStudent);
                           if (!stats || stats === 'N/A') return null;
                           return Array.from({ length: 7 }).map((_, i) => (
                              <div 
                                key={i}
                                className={cn(
                                   "w-4 h-4 rounded-full border-2",
                                   i < stats.credits ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-200"
                                )}
                              />
                           ));
                        })()}
                     </div>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center mt-4">
                        {getDivisionStats(selectedStudent) !== 'N/A' && (getDivisionStats(selectedStudent) as any)?.credits >= 3 ? "Meets Core Division Requirements" : "Below Minimum Credits for Div I-III"}
                     </p>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Audit</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mark</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(() => {
                        const results = getStudentResults(selectedStudent.id);
                        if (results.length === 0) return (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center italic text-slate-400 text-sm font-medium">No audit data available for this candidate.</td>
                          </tr>
                        );
                        
                        // Sort by points to identify top 7
                        const sortedResults = [...results].sort((a, b) => 
                          calculatePoints(a.marks, a.level) - calculatePoints(b.marks, b.level)
                        );
                        
                        return sortedResults.map((r, i) => {
                          const pts = calculatePoints(r.marks, r.level);
                          const grade = calculateGrade(r.marks, r.level);
                          const isTop7 = i < 7;
                          
                          return (
                            <tr key={i} className={cn("hover:bg-slate-50/50 transition-colors", !isTop7 && "opacity-40")}>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    {isTop7 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                    <span className="text-sm font-bold text-slate-900">{r.subjectName}</span>
                                    {isTop7 && (
                                       <span className="text-[8px] font-black text-primary px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10 tracking-widest">CORE</span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className="text-[10px] font-black text-slate-900">{r.marks}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={cn(
                                   "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest",
                                   ['A', 'B', 'C'].includes(grade) ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                                 )}>{grade}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <span className="text-sm font-black text-slate-900">{pts}</span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
                <button className="flex-1 py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center justify-center gap-2">
                  <Download size={16} />
                  Export Audit PDF
                </button>
                <button className="py-4 px-6 bg-slate-100 text-slate-600 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <Printer size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
