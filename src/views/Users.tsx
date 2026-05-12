/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Mail, 
  Shield, 
  Trash2, 
  Edit3, 
  School,
  Heart,
  BookOpen,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { type User, type UserRole, type Student } from '../types';
import { cn, generateId } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<UserRole>('teacher');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    subjects: [] as string[],
    selectedSubject: '',
    childrenIds: [] as string[],
    studentAdmissionNo: '',
    studentId: ''
  });

  useEffect(() => {
    const db = storageService.getDB();
    setUsers(db.users);
    setStudents(db.students);
  }, []);

  const filteredUsers = users.filter(u => 
    u.role === activeTab && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: generateId(),
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: activeTab,
      avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase()
    };

    if (activeTab === 'teacher') {
      newUser.teacherMetadata = { subjects: formData.subjects };
    } else if (activeTab === 'parent') {
      newUser.parentMetadata = { childrenIds: formData.childrenIds };
    } else if (activeTab === 'student') {
      newUser.studentMetadata = { 
        admissionNo: formData.studentAdmissionNo, 
        studentId: formData.studentId 
      };
    }

    const db = storageService.getDB();
    const updatedUsers = [...db.users, newUser];
    storageService.saveDB({ ...db, users: updatedUsers });
    setUsers(updatedUsers);

    setSuccessMessage(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} account created successfully.`);
    setIsAddModalOpen(false);
    setFormData({ name: '', email: '', password: '', phone: '', subjects: [], selectedSubject: '', childrenIds: [], studentAdmissionNo: '', studentId: '' });
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const deleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const db = storageService.getDB();
      const updatedUsers = db.users.filter(u => u.id !== id);
      storageService.saveDB({ ...db, users: updatedUsers });
      setUsers(updatedUsers);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Identity & Access Control</h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Management of institutional staff and parental entities.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['teacher', 'parent', 'student', 'accountant'].map((role) => (
              <button 
                key={role}
                onClick={() => setActiveTab(role as UserRole)}
                className={cn(
                  "px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all",
                  activeTab === role ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {role}s
              </button>
            ))}
          </div>
          <div className="w-[1px] h-8 bg-slate-100 mx-2" />
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
          >
            <UserPlus size={18} />
            Add {activeTab}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-700 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 size={18} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}s by name or email...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-xs font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left order-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">User Detail</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">{activeTab === 'teacher' ? 'Assignments' : 'Linked Students'}</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                        {user.avatar || user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                      <Shield size={10} />
                      Verified
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1">
                      {activeTab === 'teacher' ? (
                        user.teacherMetadata?.subjects.map(s => (
                          <span key={s} className="px-2 py-1 bg-indigo-50 text-primary rounded text-[9px] font-bold uppercase tracking-widest border border-indigo-100">
                            {s}
                          </span>
                        ))
                      ) : (
                        user.parentMetadata?.childrenIds.map(cid => {
                          const s = students.find(st => st.id === cid);
                          return (
                            <span key={cid} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-widest">
                              {s?.name || 'Unknown'}
                            </span>
                          );
                        })
                      )}
                      {(!user.teacherMetadata?.subjects.length && !user.parentMetadata?.childrenIds.length) && (
                        <span className="text-[10px] text-slate-300 italic">None assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"><Edit3 size={16}/></button>
                       <button 
                         onClick={() => deleteUser(user.id)}
                         className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                       >
                         <Trash2 size={16}/>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                    No {activeTab} accounts registered in system
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="fixed inset-0 m-auto w-full max-w-2xl h-fit bg-white z-[110] rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg text-primary">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold uppercase tracking-tight">Onboard {activeTab}</h3>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Credentials and Authorization Logic</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddUser} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                    <div className="relative">
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium" 
                        placeholder="e.g. Salim Ali Juma"
                      />
                      <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Email</label>
                    <div className="relative">
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium font-mono" 
                        placeholder="academic@school.tz"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                    <div className="relative">
                      <input 
                        required
                        type="password" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-bold tracking-widest" 
                        placeholder="••••••••"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number (+255)</label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium" 
                        placeholder="07XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>

                {activeTab === 'teacher' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subject Specializations</label>
                      <div className="flex gap-2">
                        <select 
                          value={formData.selectedSubject}
                          onChange={e => setFormData({...formData, selectedSubject: e.target.value})}
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-medium"
                        >
                          <option value="">Enroll subject protocol...</option>
                          {SCHOOL_CONFIG.defaultSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button 
                          type="button"
                          onClick={() => {
                            if (formData.selectedSubject && !formData.subjects.includes(formData.selectedSubject)) {
                              setFormData({...formData, subjects: [...formData.subjects, formData.selectedSubject], selectedSubject: ''});
                            }
                          }}
                          className="px-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {formData.subjects.map(s => (
                         <span key={s} className="px-3 py-1 bg-indigo-50 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                           {s}
                           <button type="button" onClick={() => setFormData({...formData, subjects: formData.subjects.filter(sub => sub !== s)})}><X size={10}/></button>
                         </span>
                       ))}
                    </div>
                  </div>
                )}

                {activeTab === 'parent' && (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Link Registered Students</label>
                      
                      {/* Selected Students Tags */}
                      {formData.childrenIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                          {formData.childrenIds.map(cid => {
                            const s = students.find(st => st.id === cid);
                            return (
                              <span key={cid} className="px-3 py-1 bg-white text-primary rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-2 shadow-sm">
                                {s?.name}
                                <button 
                                  type="button" 
                                  onClick={() => setFormData({...formData, childrenIds: formData.childrenIds.filter(id => id !== cid)})}
                                  className="hover:text-red-500 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Searchable Select List */}
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                          <input 
                            type="text"
                            placeholder="Filter students by name or admission..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/10 outline-none"
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase();
                              // Local filtering for display
                              const dropdown = document.getElementById('student-select-list');
                              if (dropdown) {
                                const items = Array.from(dropdown.children) as HTMLElement[];
                                items.forEach(item => {
                                  const txt = item.textContent?.toLowerCase() || '';
                                  item.style.display = txt.includes(val) ? 'flex' : 'none';
                                });
                              }
                            }}
                          />
                        </div>
                        
                        <div id="student-select-list" className="max-h-[180px] overflow-y-auto border border-slate-100 rounded-2xl bg-white shadow-inner divide-y divide-slate-50">
                          {students.filter(s => !formData.childrenIds.includes(s.id)).map(s => (
                            <div 
                              key={s.id}
                              onClick={() => setFormData({...formData, childrenIds: [...formData.childrenIds, s.id]})}
                              className="p-3 hover:bg-primary/5 cursor-pointer flex items-center justify-between group transition-colors"
                            >
                              <div>
                                <p className="text-xs font-black text-slate-900 group-hover:text-primary">{s.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.classId} — {s.admissionNo}</p>
                              </div>
                              <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                <CheckCircle2 size={12} />
                              </div>
                            </div>
                          ))}
                          {students.length === 0 && (
                            <p className="p-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No students available to link</p>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1">Selected candidates will be linked to the parent's financial and academic dashboard.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'student' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Link to Student Record</label>
                      <select 
                        required
                        value={formData.studentId}
                        onChange={e => {
                          const s = students.find(st => st.id === e.target.value);
                          setFormData({
                            ...formData, 
                            studentId: e.target.value,
                            studentAdmissionNo: s?.admissionNo || '',
                            name: s?.name || formData.name
                          });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-medium"
                      >
                        <option value="">Select candidate record...</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.admissionNo})</option>
                        ))}
                      </select>
                    </div>
                    {formData.studentAdmissionNo && (
                      <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Selected Admission</p>
                        <p className="text-xs font-black text-slate-900">{formData.studentAdmissionNo}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-6">
                  <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                    <Shield size={16} />
                    Finalize Account Provisioning
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
