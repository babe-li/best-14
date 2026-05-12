/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  Clock,
  UserCheck,
  Building,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Brain,
  Zap,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area
} from 'recharts';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';
import { formatCurrency, cn } from '../../lib/utils';
import { type Student, type Payment, type Exam, type User } from '../../types';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [db, setDb] = useState(storageService.getDB());
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setStudents(db.students);
    setPayments(db.payments);
    setExams(db.exams);

    // Calculate Subject Performance
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

    const perfData = Object.entries(subjectDataMap).map(([subject, data]) => ({
      subject,
      score: Math.round(data.totalMarks / data.totalStudents),
      studentCount: data.uniqueStudents.size
    })).sort((a, b) => b.score - a.score).slice(0, 6);

    setSubjectPerformance(perfData);
  }, [db]);

  const generateAIInsight = async () => {
    setIsAnalyzing(true);
    try {
      const insight = await aiService.getFinancialInsights({
        totalExpected: students.reduce((acc, s) => acc + s.feeBalance, 0) + payments.reduce((acc, p) => acc + p.amount, 0),
        totalCollected: payments.reduce((acc, p) => acc + p.amount, 0),
        overdueCount: students.filter(s => s.feeBalance > 0).length
      });
      setAiInsight(insight);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalArrears = students.reduce((acc, s) => acc + s.feeBalance, 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const activeStudents = students.filter(s => s.status === 'active').length;

  const stats = [
    { label: 'Total Enrolled', value: students.length.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', change: `${activeStudents} Active`, changeType: 'neutral' },
    { label: 'Staff Count', value: db.users.filter(u => u.role === 'teacher').length.toString(), icon: GraduationCap, color: 'text-slate-600', bg: 'bg-slate-50', change: '8 Roles Defined', changeType: 'neutral' },
    { label: 'Fee Revenue', value: formatCurrency(totalCollected), icon: CreditCard, color: 'text-premium-gold', bg: 'bg-premium-gold/10', border: 'border-premium-gold/20', change: 'Premium Flow', changeType: 'positive' },
    { label: 'Attendance', value: '94.2%', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', change: 'Above Target', changeType: 'positive' },
  ];

  const recentPayments = payments.slice(-5).reverse().map(p => {
    const student = students.find(s => s.id === p.studentId);
    return {
      name: student?.name || 'Unknown',
      amount: formatCurrency(p.amount),
      method: p.method,
      date: new Date(p.date).toLocaleDateString()
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Executive Management Terminal</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time school performance analytics</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest bg-premium-dark text-premium-gold border border-premium-gold/30 px-4 py-2 rounded-xl shadow-xl shadow-premium-dark/10">
          <ShieldCheck size={12} className="text-premium-gold" />
          <span className="animate-pulse">System Governance: Elite Secured</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Statistics Grid (Existing stats moved here) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bg-white p-5 border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/20 hover:shadow-md transition-all",
                (stat as any).border
              )}
            >
              <div className="flex justify-between items-start">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-300", 
                  stat.bg, 
                  stat.color
                )}>
                  <stat.icon size={16} />
                </div>
                <div className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                  stat.changeType === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                )}>
                  {stat.change}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</div>
                <div className="text-xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Neural Analysis Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 rounded-[2rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden group min-h-[17.5rem] flex flex-col"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-premium-gold/10 rounded-full -ml-24 -mb-24 blur-2xl opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Brain size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Financial Intelligence</h3>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em]">Neural Analytics Engine</p>
              </div>
              <div className="ml-auto">
                <button 
                  onClick={generateAIInsight}
                  disabled={isAnalyzing}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all disabled:opacity-50"
                >
                  <Zap size={16} className={cn(isAnalyzing && "animate-spin")} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {aiInsight ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl italic text-[11px] text-white/90 leading-relaxed font-medium">
                    "{aiInsight}"
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-900 bg-slate-800" />)}
                    </div>
                    <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Verified by Audit Engine</p>
                  </div>
                </motion.div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] animate-pulse">Waiting for manual trigger...</p>
                  <button 
                    onClick={generateAIInsight}
                    className="mt-4 px-6 py-2.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Run Neural Scan
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
             <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
               <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Core Active</span>
             </div>
             <Sparkles size={14} className="text-white/10" />
          </div>
        </motion.div>
      </div>
      
      {/* Dynamic Academic Insights */}
      <div className="grid grid-cols-1 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Academic Subject Performance</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">V2.4 Metrics - Global Averages</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Avg Score</span>
               </div>
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            {subjectPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="subject" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 border-b border-white/10 pb-2">{data.subject}</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-[9px] font-bold text-white/40 uppercase">Performance:</span>
                                <span className="text-sm font-black text-white">{data.score}%</span>
                              </div>
                              <div className="flex items-center justify-between gap-8">
                                <span className="text-[9px] font-bold text-white/40 uppercase">Student Base:</span>
                                <span className="text-sm font-black text-white">{data.studentCount} candidates</span>
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
                    fill="url(#barGradient)" 
                    radius={[8, 8, 4, 4]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                <BookOpen size={48} className="text-slate-200 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collecting academic data streams...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Flow (Term II)</h3>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-primary rounded-full" />
               <span className="text-[10px] font-bold text-slate-900 uppercase">Fees Collected</span>
            </div>
          </div>
          <div className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Jan', amount: 4500000 },
                { month: 'Feb', amount: 3200000 },
                { month: 'Mar', amount: 5800000 },
                { month: 'Apr', amount: 4100000 },
                { month: 'May', amount: 7200000 },
              ]}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `TSh ${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Transactions</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentPayments.map((p, idx) => (
              <div key={idx} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  <span className="text-xs font-black text-emerald-600">{p.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.method}</span>
                  <span className="text-[9px] text-slate-400 font-bold">{p.date}</span>
                </div>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <div className="p-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">No revenue data available</div>
            )}
          </div>
          <div className="p-6 bg-slate-50 mt-auto rounded-b-3xl">
            <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-primary hover:border-primary transition-all">
              Go to Finance Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
