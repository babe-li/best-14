/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library as LibraryIcon, 
  Book, 
  Plus, 
  Search, 
  Search as SearchIcon, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  X,
  History,
  ClipboardList
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { type Student } from '../types';
import { cn, generateId } from '../lib/utils';

export const Library = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const [lendData, setLendData] = useState({
    studentId: '',
    bookTitle: '',
    isbn: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [loans, setLoans] = useState<{
    id: string;
    studentId: string;
    bookTitle: string;
    isbn: string;
    issueDate: string;
    dueDate: string;
    status: 'active' | 'returned' | 'overdue';
  }[]>([]);

  useEffect(() => {
    const db = storageService.getDB();
    setStudents(db.students);
    // Ideally we'd have a library collection in storageService
    const storedLoans = localStorage.getItem('sms_library_loans');
    if (storedLoans) setLoans(JSON.parse(storedLoans));
  }, []);

  const handleLend = (e: React.FormEvent) => {
    e.preventDefault();
    const newLoan = {
      id: generateId(),
      ...lendData,
      issueDate: new Date().toISOString(),
      status: 'active' as const
    };
    const updated = [newLoan, ...loans];
    setLoans(updated);
    localStorage.setItem('sms_library_loans', JSON.stringify(updated));
    setIsLendModalOpen(false);
    setLendData({
      studentId: '',
      bookTitle: '',
      isbn: '',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleReturn = (id: string) => {
    const updated = loans.map(l => l.id === id ? { ...l, status: 'returned' as const } : l);
    setLoans(updated);
    localStorage.setItem('sms_library_loans', JSON.stringify(updated));
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kituo cha Maktaba</h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Repository of academic resources and lending logistics.</p>
        </div>
        
        <button 
          onClick={() => setIsLendModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
        >
          <Plus size={18} />
          Issue Material
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-50 text-primary rounded-xl flex items-center justify-center font-bold">
             <Book size={24} />
           </div>
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Circulating Assets</p>
             <h3 className="text-2xl font-extrabold text-slate-900">{loans.filter(l => l.status === 'active').length}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
             <CheckCircle2 size={24} />
           </div>
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returned Today</p>
             <h3 className="text-2xl font-extrabold text-slate-900">{loans.filter(l => l.status === 'returned' && l.issueDate.includes(new Date().toISOString().split('T')[0])).length}</h3>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 border-l-4 border-l-red-500">
           <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold">
             <Clock size={24} />
           </div>
           <div>
             <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Overdue Penalties</p>
             <h3 className="text-2xl font-extrabold text-slate-900">0</h3>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lending Register</h3>
           <div className="relative w-64">
             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
             <input 
               type="text" 
               placeholder="Search by student or ISBN..."
               className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium outline-none"
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left order-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material Identity</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issuer (Student)</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Protocol</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loans.map(loan => {
                const student = students.find(s => s.id === loan.studentId);
                return (
                  <tr key={loan.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-4">
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{loan.bookTitle}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">ISBN: {loan.isbn}</p>
                    </td>
                    <td className="px-8 py-4">
                       <p className="text-xs font-bold text-slate-700">{student?.name || 'N/A'}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student?.admissionNo}</p>
                    </td>
                    <td className="px-8 py-4 text-xs font-medium text-slate-500">
                       {new Date(loan.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-center">
                       <span className={cn(
                         "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                         loan.status === 'active' ? "bg-indigo-50 text-primary" : "bg-slate-100 text-slate-400"
                       )}>
                         {loan.status}
                       </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                       {loan.status === 'active' && (
                         <button 
                           onClick={() => handleReturn(loan.id)}
                           className="text-[10px] font-bold text-primary uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded hover:bg-primary hover:text-white transition-all"
                         >
                           Record Return
                         </button>
                       )}
                    </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">No materials currently in circulation</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isLendModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLendModalOpen(false)} className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
               <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                 <div>
                   <h3 className="text-xl font-extrabold uppercase tracking-tight">Circulation Protocol</h3>
                   <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Issue academic material to student</p>
                 </div>
                 <button onClick={() => setIsLendModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
               </div>
               <form onSubmit={handleLend} className="p-8 space-y-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Student Identity</label>
                   <select 
                     required
                     value={lendData.studentId}
                     onChange={(e) => setLendData({...lendData, studentId: e.target.value})}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                   >
                     <option value="">Enroll student account...</option>
                     {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.classId})</option>)}
                   </select>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Academic Material Title</label>
                   <input 
                     required
                     type="text" 
                     placeholder="Title of textbook or resource"
                     value={lendData.bookTitle}
                     onChange={(e) => setLendData({...lendData, bookTitle: e.target.value})}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ISBN Reference</label>
                     <input 
                       type="text" 
                       placeholder="Unique ID"
                       value={lendData.isbn}
                       onChange={(e) => setLendData({...lendData, isbn: e.target.value})}
                       className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-bold tracking-widest"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Return Protocol Date</label>
                     <input 
                       required
                       type="date" 
                       value={lendData.dueDate}
                       onChange={(e) => setLendData({...lendData, dueDate: e.target.value})}
                       className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-bold"
                     />
                   </div>
                 </div>

                 <div className="pt-4">
                    <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest">
                       Verify & Circulate
                    </button>
                 </div>
               </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
