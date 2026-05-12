/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  Clock, 
  ArrowRight, 
  MessageSquare,
  Calendar,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { storageService } from '../../services/storageService';
import { type User, type Student, type Attendance, type Exam } from '../../types';
import { cn } from '../../lib/utils';

interface TeacherDashboardProps {
  user: User;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [db] = useState(storageService.getDB());

  useEffect(() => {
    // In our system, we use metadata to link teachers to students
    const teachersStudents = db.students.filter(s => s.metadata?.assignedTeacherId === user.id);
    setAssignedStudents(teachersStudents);

    // Get recent attendance taken by this teacher (simulation: recent attendance in their class)
    const classIds = [...new Set(teachersStudents.map(s => s.classId))];
    const recent = db.attendance
      .filter(a => {
        const student = db.students.find(s => s.id === a.studentId);
        return student && classIds.includes(student.classId);
      })
      .slice(-5)
      .reverse();
    setRecentAttendance(recent);

    // Get upcoming exams for their subjects
    const teacherSubjects = user.teacherMetadata?.subjects || [];
    const exams = db.exams
      .filter(e => teacherSubjects.includes(e.subjectId))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
    setUpcomingExams(exams);

    // Academic Performance Data for assigned students
    const studentIds = teachersStudents.map(s => s.id);
    const relevantResults = db.results.filter(r => studentIds.includes(r.studentId));
    
    const subjectAverages: {[key: string]: {sum: number, count: number}} = {};
    
    relevantResults.forEach(res => {
      const exam = db.exams.find(e => e.id === res.examId);
      if (exam) {
        const subId = exam.subjectId;
        if (!subjectAverages[subId]) {
          subjectAverages[subId] = { sum: 0, count: 0 };
        }
        subjectAverages[subId].sum += res.marks;
        subjectAverages[subId].count += 1;
      }
    });

    const chartData = Object.entries(subjectAverages).map(([subId, stats]) => {
      const subject = db.subjects.find(s => s.id === subId);
      return {
        name: subject?.name || subId,
        average: Math.round(stats.sum / stats.count),
      };
    });

    setPerformanceData(chartData);
  }, [user, db]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
        <div className="relative z-10">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mwalimu Command Center</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            Managing <span className="text-primary font-black">{assignedStudents.length}</span> Elite Candidates
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          {user.teacherMetadata?.subjects.map(subject => (
            <span key={subject} className="px-4 py-1.5 bg-premium-dark text-premium-gold rounded-full text-[9px] font-black uppercase tracking-widest border border-premium-gold/30 shadow-lg shadow-premium-dark/10">
              {subject}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Active</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned Students</p>
            <p className="text-3xl font-black text-slate-900">{assignedStudents.length}</p>
          </div>
          <div className="pt-2 flex -space-x-2">
            {assignedStudents.slice(0, 5).map(s => (
              <div key={s.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                {s.name[0]}
              </div>
            ))}
            {assignedStudents.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                +{assignedStudents.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Calendar size={20} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Academic Cycle</p>
            <p className="text-xl font-black text-slate-900 uppercase">Term II – 2026</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">
            <Clock size={12} />
            Updated 2 mins ago
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 text-center flex flex-col items-center justify-center">
           <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-2">
              <TrendingUp size={32} className="text-primary" />
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class Performance</p>
           <p className="text-2xl font-black text-slate-900">
             {performanceData.length > 0 
               ? `${Math.round(performanceData.reduce((acc, d) => acc + d.average, 0) / performanceData.length)}%`
               : '84.2%'}
           </p>
           <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">+2.4% vs Last Term</p>
        </div>
      </div>

      {/* Performance Chart Section */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Student Progress Velocity
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Average achievement across subjects</p>
          </div>
          <div className="flex gap-2">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg Marks</span>
             </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="average" 
                  fill="#5b21b6" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                >
                  {performanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.average >= 75 ? '#5b21b6' : entry.average >= 50 ? '#6366f1' : '#f43f5e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
               <TrendingUp size={48} className="text-slate-200 mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting assessment cycles for calculation</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fee Status Oversight */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" />
              Fee Compliance Oversight
            </h3>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3">Candidate</th>
                    <th className="px-5 py-3">Control Number</th>
                    <th className="px-5 py-3 text-right">Annual Fee</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-900">{s.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[10px] font-mono font-black text-primary tracking-tighter">{s.controlNumber || '99-PENDING'}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-[10px] font-black text-slate-500">
                          {(() => {
                            const levels = db.fees.filter(f => f.classId === s.classId);
                            const total = levels.reduce((acc, l) => acc + l.totalAmount, 0);
                            return (total / 1000).toFixed(0) + 'k';
                          })()}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn(
                          "text-[10px] font-black",
                          s.feeBalance > 0 ? "text-red-500" : "text-emerald-500"
                        )}>
                          {s.feeBalance > 0 ? (s.feeBalance / 1000).toFixed(0) + 'k' : 'SETTLED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {assignedStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                        No financial records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UserCheck size={14} className="text-primary" />
              Recent Attendance Log
            </h3>
            <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Full Report</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {recentAttendance.map((a, idx) => {
                const s = db.students.find(st => st.id === a.studentId);
                return (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {s?.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{s?.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{s?.classId} • {new Date(a.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border",
                      a.status === 'present' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      a.status === 'absent' ? "bg-red-50 text-red-600 border-red-100" :
                      "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {a.status}
                    </span>
                  </div>
                );
              })}
              {recentAttendance.length === 0 && (
                <div className="p-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                  No attendance data for your candidates
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={14} className="text-amber-500" />
              Upcoming Assessments
            </h3>
          </div>
          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-between group hover:border-primary transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="text-[10px] font-black uppercase leading-none">
                      {new Date(exam.date).toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-black leading-none mt-0.5">
                      {new Date(exam.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{exam.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{exam.subjectId} • {exam.classId}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-200 group-hover:text-primary transition-colors" />
              </div>
            ))}
            {upcomingExams.length === 0 && (
              <div className="p-12 bg-white border border-slate-200 border-dashed rounded-3xl text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                No upcoming exams scheduled for your subjects
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Notifications */}
      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-900/20">
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Internal Communication</h3>
          <p className="text-indigo-200 text-xs font-medium uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
            <MessageSquare size={14} />
            3 New administrative notices pending
          </p>
        </div>
        <button className="relative z-10 px-8 py-3 bg-white text-indigo-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg">
          Open Mailbox
          <ChevronRight size={16} />
        </button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};
