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
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  User as UserIcon,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  X,
  FileText,
  UserCheck,
  CheckCircle
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { type PermissionRequest, type Student, type User, type PermissionStatus } from '../types';
import { cn, generateId } from '../lib/utils';

export const Permissions = () => {
  const [db, setDb] = useState(storageService.getDB());
  const [currentUser] = useState(storageService.getCurrentUser());
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PermissionStatus | 'all'>('all');
  
  const [newRequest, setNewRequest] = useState({
    studentId: '',
    reason: '',
    type: 'Personal' as const,
    startDate: '',
    endDate: ''
  });

  const [reviewData, setReviewData] = useState({
    status: 'Approved' as PermissionStatus,
    note: ''
  });

  useEffect(() => {
    setRequests(db.permissions || []);
  }, [db.permissions]);

  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isParent = currentUser?.role === 'parent';
  const canReview = isAdmin || isTeacher;

  // Filter requests based on role
  const filteredRequests = requests.filter(req => {
    // Parents only see their own requests (or their children's)
    if (isParent) {
      const ownedStudents = db.students.filter(s => s.parentId === currentUser?.id).map(s => s.id);
      if (!ownedStudents.includes(req.studentId)) return false;
    }

    const matchesSearch = db.students.find(s => s.id === req.studentId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const request: PermissionRequest = {
      id: generateId(),
      parentId: currentUser.id,
      studentId: newRequest.studentId,
      reason: newRequest.reason,
      type: newRequest.type as any,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const newDb = { ...db, permissions: [request, ...(db.permissions || [])] };
    storageService.saveDB(newDb);
    setDb(newDb);
    setIsRequestModalOpen(false);
    setNewRequest({ studentId: '', reason: '', type: 'Personal', startDate: '', endDate: '' });
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !currentUser) return;

    const updatedPermissions = requests.map(req => {
      if (req.id === selectedRequest.id) {
        return {
          ...req,
          status: reviewData.status,
          reviewedBy: currentUser.id,
          reviewNote: reviewData.note
        };
      }
      return req;
    });

    const newDb = { ...db, permissions: updatedPermissions };
    storageService.saveDB(newDb);
    setDb(newDb);
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
  };

  const getStatusColor = (status: PermissionStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Expired': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const children = isParent ? db.students.filter(s => s.parentId === currentUser?.id) : [];

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Exit Permission <span className="text-primary italic">Requests</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">
            Student out-pass and leave management protocol
          </p>
        </div>

        {isParent && (
          <button 
            onClick={() => setIsRequestModalOpen(true)}
            className="group flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto justify-center"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Request Permission
          </button>
        )}
      </div>

      {/* Stats/Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by student or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl text-xs font-black placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {(['all', 'Pending', 'Approved', 'Rejected'] as const).map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                  statusFilter === status 
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                    : "bg-white/60 text-slate-400 border-white/40 hover:border-slate-200"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:flex bg-slate-900 rounded-[32px] p-6 text-white items-center gap-4 shadow-xl shadow-slate-900/10">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-primary">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Requests</p>
            <p className="text-xl font-black italic">{requests.filter(r => r.status === 'Pending').length}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRequests.map((req) => {
          const student = db.students.find(s => s.id === req.studentId);
          return (
            <motion.div
              layout
              key={req.id}
              className="glass-card p-6 rounded-[32px] group hover:scale-[1.02] transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                      {student?.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{student?.name}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{student?.classId} • {student?.admissionNo}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm",
                    getStatusColor(req.status)
                  )}>
                    {req.status}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Request Type</p>
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{req.type}</p>
                    </div>
                    <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Submission Date</p>
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/40 rounded-2xl border border-white/60">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <MessageSquare size={10} />
                      Justification Narrative
                    </p>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic line-clamp-2">
                       "{req.reason}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Exit</span>
                        <span className="text-[9px] font-black text-slate-900">{new Date(req.startDate).toLocaleDateString()}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entry</span>
                        <span className="text-[9px] font-black text-slate-900">{new Date(req.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {canReview && req.status === 'Pending' && (
                      <button 
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsReviewModalOpen(true);
                        }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                      >
                        Review Protocol
                      </button>
                    )}

                    {req.reviewedBy && (
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <UserCheck size={12} />
                         </div>
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Authorized</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="lg:col-span-2 py-20 text-center">
             <ShieldAlert size={48} className="text-slate-200 mx-auto mb-4" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">No Protocol Logs Found</p>
             <p className="text-xs font-bold text-slate-300 transition-all">The current filtration matrix yielded zero permission records.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-[40px] shadow-2xl p-8 w-full max-w-lg overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Permission Request <span className="text-primary italic">Form</span></h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional out-pass application</p>
                </div>
                <button onClick={() => setIsRequestModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Student</label>
                  <select 
                    required
                    value={newRequest.studentId}
                    onChange={(e) => setNewRequest({...newRequest, studentId: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-xs font-black uppercase tracking-tight"
                  >
                    <option value="">Select Ward</option>
                    {children.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.classId})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Type</label>
                    <select 
                      value={newRequest.type}
                      onChange={(e) => setNewRequest({...newRequest, type: e.target.value as any})}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-xs font-black uppercase tracking-tight"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Medical">Medical</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                    <input 
                      type="date" 
                      required
                      value={newRequest.startDate}
                      onChange={(e) => setNewRequest({...newRequest, startDate: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-xs font-black"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Return Date</label>
                  <input 
                    type="date" 
                    required
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({...newRequest, endDate: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-xs font-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Reason</label>
                  <textarea 
                    required
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-xs font-bold leading-relaxed min-h-[120px]"
                    placeholder="Provide a clear explanation for the out-pass request..."
                  />
                </div>

                <div className="flex bg-blue-50 p-4 rounded-2xl gap-3 border border-blue-100">
                   <AlertCircle size={18} className="text-blue-500 shrink-0" />
                   <p className="text-[10px] font-bold text-blue-600 leading-relaxed italic">
                      This request will be sent to the school administration for electronic vetting and authorization.
                   </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Submit Protocol
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isReviewModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-[40px] shadow-2xl p-8 w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Vetting <span className="text-primary italic">Console</span></h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Protocol ID: {selectedRequest.id}</p>
                </div>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[28px] border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-primary border border-slate-200">
                    {db.students.find(s => s.id === selectedRequest.studentId)?.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">{db.students.find(s => s.id === selectedRequest.studentId)?.name}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason: {selectedRequest.type}</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 italic font-serif">Original Justification</p>
                  <p className="text-xs font-medium text-slate-600 leading-tight italic">"{selectedRequest.reason}"</p>
                </div>
              </div>

              <form onSubmit={handleReview} className="space-y-6">
                <div className="flex gap-4">
                   <button 
                     type="button"
                     onClick={() => setReviewData({...reviewData, status: 'Approved'})}
                     className={cn(
                       "flex-1 py-4 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2",
                       reviewData.status === 'Approved' 
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                        : "bg-white text-emerald-500 border-emerald-100 hover:border-emerald-200"
                     )}
                   >
                     <CheckCircle size={14} />
                     Authorize
                   </button>
                   <button 
                     type="button"
                     onClick={() => setReviewData({...reviewData, status: 'Rejected'})}
                     className={cn(
                       "flex-1 py-4 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2",
                       reviewData.status === 'Rejected' 
                        ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
                        : "bg-white text-red-500 border-red-100 hover:border-red-200"
                     )}
                   >
                     <XCircle size={14} />
                     Refuse
                   </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vetting Note</label>
                  <textarea 
                    value={reviewData.note}
                    onChange={(e) => setReviewData({...reviewData, note: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-xs font-bold leading-relaxed min-h-[100px]"
                    placeholder="Provide context for the decision..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                   Execute Protocol Execution
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
