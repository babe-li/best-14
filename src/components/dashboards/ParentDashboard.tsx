/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CreditCard, 
  GraduationCap, 
  Clock, 
  ArrowRight, 
  ChevronRight,
  TrendingUp,
  Award,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { type User, type Student, type Payment, type Result } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

interface ParentDashboardProps {
  user: User;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ user }) => {
  const [children, setChildren] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [db] = useState(storageService.getDB());

  useEffect(() => {
    // Find students linked to this parent
    // Check both by parentId in student record and childrenIds in parent metadata
    const linkedIds = user.parentMetadata?.childrenIds || [];
    const myChildren = db.students.filter(s => s.parentId === user.id || linkedIds.includes(s.id));
    setChildren(myChildren);

    const childIds = myChildren.map(s => s.id);
    
    // Get their payments
    const myPayments = db.payments
      .filter(p => childIds.includes(p.studentId))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    setPayments(myPayments);

    // Get their latest results
    const myResults = db.results
      .filter(r => childIds.includes(r.studentId))
      .sort((a, b) => {
        const examA = db.exams.find(e => e.id === a.examId);
        const examB = db.exams.find(e => e.id === b.examId);
        return (examB?.date || '').localeCompare(examA?.date || '');
      })
      .slice(0, 5);
    setResults(myResults);
  }, [user, db]);

  const totalBalance = children.reduce((acc, s) => acc + s.feeBalance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Parental Oversight Terminal</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            Monitoring <span className="text-primary">{children.length}</span> Active Candidates
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 bg-premium-dark text-premium-gold px-5 py-2.5 border border-premium-gold/30 rounded-xl shadow-xl shadow-premium-dark/20">
           <div className="w-8 h-8 bg-premium-gold/10 rounded-lg flex items-center justify-center text-premium-gold">
              <Wallet size={16} />
           </div>
           <div>
              <p className="text-[8px] font-bold text-premium-gold/50 uppercase tracking-widest leading-none mb-1">Estate Balance</p>
              <p className="text-sm font-black leading-none">{formatCurrency(totalBalance)}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {children.map((child) => (
          <div key={child.id} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 hover:border-primary transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors">
                {child.name[0]}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{child.name}</p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{child.classId} • {child.status}</p>
                  <p className="text-[9px] font-mono font-black text-primary tracking-tighter">REF: {child.controlNumber || '99-PENDING'}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100 mb-2">
               <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-slate-400 uppercase tracking-widest font-bold">Annual Fee</span>
                  <span className="text-slate-900">
                    {(() => {
                      const levels = db.fees.filter(f => f.classId === child.classId);
                      return formatCurrency(levels.reduce((acc, l) => acc + l.totalAmount, 0));
                    })()}
                  </span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-red-400 uppercase tracking-widest font-bold">Balance Due</span>
                  <span className="text-red-600">{formatCurrency(child.feeBalance)}</span>
               </div>
            </div>
            <div className="pt-2 flex justify-between items-end border-t border-slate-50">
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Performance</p>
                  <p className="text-lg font-black text-indigo-600">
                    {db.results.filter(r => r.studentId === child.id).length > 0 ? 'Div I' : 'N/A'}
                  </p>
               </div>
               <button className="p-2 text-slate-300 hover:text-primary transition-colors">
                  <ChevronRight size={20} />
               </button>
            </div>
          </div>
        ))}
        {children.length === 0 && (
          <div className="col-span-full p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <AlertCircle size={32} className="text-slate-300 mx-auto mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No candidates linked to your account.</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Please contact school administration.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academic Performance */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap size={14} className="text-indigo-600" />
              Latest Exam Results
            </h3>
            <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Full Transcript</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Candidate</th>
                  <th className="px-6 py-4 font-bold">Exam Activity</th>
                  <th className="px-6 py-4 font-bold text-right">Score</th>
                  <th className="px-6 py-4 font-bold text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((result, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900">{db.students.find(s => s.id === result.studentId)?.name.split(' ')[0]}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-700">{db.exams.find(e => e.id === result.examId)?.title}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{db.exams.find(e => e.id === result.examId)?.subjectId}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-black text-slate-900">{result.marks}%</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black tracking-widest",
                        result.grade === 'A' ? "bg-emerald-100 text-emerald-700" :
                        result.grade === 'B' ? "bg-indigo-100 text-indigo-700" :
                        result.grade === 'F' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                      )}>
                        {result.grade}
                      </span>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-300 italic font-medium uppercase tracking-widest text-[10px]">No results published yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={14} className="text-emerald-500" />
              Recent Transactions
            </h3>
          </div>
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Award size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{formatCurrency(p.amount)}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{p.method}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.date).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium italic border-t border-slate-50 pt-2">
                  Receipt No: <span className="font-bold text-slate-900 tracking-tighter uppercase">{p.receiptNo}</span>
                </p>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="p-12 bg-white border border-slate-200 border-dashed rounded-3xl text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                No payment history available
              </div>
            )}
            <button className="w-full py-4 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/10 hover:bg-emerald-700 transition-all">
              Initialize Fee Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
