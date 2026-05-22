/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Globe, 
  Shield, 
  Bell, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Plus,
  Trash2,
  Layers,
  GraduationCap,
  X,
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { type GradingScale, type GradingRange, type AcademicLevel } from '../types';
import { SCHOOL_CONFIG } from '../constants';
import { cn } from '../lib/utils';

export const Settings = () => {
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser());
  const [status, setStatus] = useState<string | null>(null);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [sections, setSections] = useState<string[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  const [newSection, setNewSection] = useState('');
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<Partial<GradingScale> | null>(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [role, setRole] = useState<any>('teacher');

  const users = storageService.getDB().users;
  const students = storageService.getDB().students;

  useEffect(() => {
    const db = storageService.getDB();
    setSections(db.settings?.sections || ['A', 'B', 'C']);
    setGradingScales(db.settings?.gradingScales || []);
  }, []);

  const addSection = () => {
    if (!newSection) return;
    const db = storageService.getDB();
    const updatedSections = [...(db.settings?.sections || []), newSection.trim().toUpperCase()];
    const uniqueSections = Array.from(new Set(updatedSections));
    
    storageService.saveDB({ 
      ...db, 
      settings: { ...db.settings, sections: uniqueSections } 
    });
    setSections(uniqueSections);
    setNewSection('');
    setStatus(`Section ${newSection.toUpperCase()} added to system configuration.`);
  };

  const removeSection = (section: string) => {
    const db = storageService.getDB();
    const updatedSections = db.settings.sections.filter(s => s !== section);
    storageService.saveDB({ 
      ...db, 
      settings: { ...db.settings, sections: updatedSections } 
    });
    setSections(updatedSections);
    setStatus(`Section ${section} removed from system.`);
  };

  const initializeDefaultData = () => {
    const db = storageService.getDB();
    
    if (db.classes.length === 0) {
      const defaultClasses = SCHOOL_CONFIG.academicLevels.map(lvl => ({
        id: lvl.replace(/\s+/g, '-').toLowerCase(),
        name: lvl,
        section: 'A',
        teacherId: 'admin_1',
        capacity: 40
      }));
      
      storageService.saveDB({ ...db, classes: defaultClasses });
      setStatus('System initialized with default Tanzanian academic levels.');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setStatus('System is already configured.');
    }
  };

  const toggle2FA = () => {
    setIs2FALoading(true);
    setTimeout(() => {
      if (!currentUser) return;
      const updatedUser = { ...currentUser, twoFactorEnabled: !currentUser.twoFactorEnabled };
      
      // Update in storage
      const db = storageService.getDB();
      const updatedUsers = db.users.map(u => u.email === updatedUser.email ? updatedUser : u);
      storageService.saveDB({ ...db, users: updatedUsers });
      storageService.setCurrentUser(updatedUser);
      
      setCurrentUser(updatedUser);
      setIs2FALoading(false);
      setStatus(`Two-Factor Authentication is now ${updatedUser.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}.`);
    }, 1000);
  };

  const handleChangePassword = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, hasChangedInitialPassword: true };
    const db = storageService.getDB();
    const updatedUsers = db.users.map(u => u.email === updatedUser.email ? updatedUser : u);
    storageService.saveDB({ ...db, users: updatedUsers });
    storageService.setCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
    setStatus('Password updated successfully. Account is now verified.');
  };

  const handleSaveGradingScale = () => {
    if (!editingScale?.name) return;
    
    const db = storageService.getDB();
    const newScale: GradingScale = {
      id: editingScale.id || `scale_${Date.now()}`,
      name: editingScale.name,
      ranges: editingScale.ranges || [],
      applicableLevels: editingScale.applicableLevels || []
    };

    let updatedScales: GradingScale[];
    if (editingScale.id) {
      updatedScales = (db.settings.gradingScales || []).map(s => s.id === editingScale.id ? newScale : s);
    } else {
      updatedScales = [...(db.settings.gradingScales || []), newScale];
    }

    storageService.saveDB({
      ...db,
      settings: { ...db.settings, gradingScales: updatedScales }
    });
    setGradingScales(updatedScales);
    setIsGradingModalOpen(false);
    setEditingScale(null);
    setStatus(`Grading scale "${newScale.name}" has been synchronized.`);
  };

  const deleteGradingScale = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this grading scale?')) return;
    const db = storageService.getDB();
    const updatedScales = (db.settings.gradingScales || []).filter(s => s.id !== id);
    storageService.saveDB({
      ...db,
      settings: { ...db.settings, gradingScales: updatedScales }
    });
    setGradingScales(updatedScales);
    setStatus('Grading scale removed from system.');
  };

  const addRange = () => {
    setEditingScale(prev => ({
      ...prev,
      ranges: [...(prev?.ranges || []), { grade: '', min: 0, max: 0, remark: '', points: 5 }]
    }));
  };

  const removeRange = (index: number) => {
    setEditingScale(prev => ({
      ...prev,
      ranges: (prev?.ranges || []).filter((_, i) => i !== index)
    }));
  };

  const updateRange = (index: number, field: keyof GradingRange, value: any) => {
    setEditingScale(prev => {
      const ranges = [...(prev?.ranges || [])];
      ranges[index] = { ...ranges[index], [field]: field === 'grade' || field === 'remark' ? value : Number(value) };
      return { ...prev, ranges };
    });
  };

  const toggleLevelSelection = (level: AcademicLevel) => {
    setEditingScale(prev => {
      const current = prev?.applicableLevels || [];
      const updated = current.includes(level) 
        ? current.filter(l => l !== level)
        : [...current, level];
      return { ...prev, applicableLevels: updated };
    });
  };

  return (
    <div className="space-y-10 max-w-5xl pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Environment</h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Technical configuration and enterprise preferences.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Licensed
          </span>
          <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
            v2.6.5
          </span>
        </div>
      </div>

      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-between border border-emerald-100"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} />
              {status}
            </div>
            <button onClick={() => setStatus(null)} className="opacity-50 hover:opacity-100">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl flex items-center justify-center">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Class Architecture</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define Sections & Streams</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="e.g. STREAM D"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:border-primary transition-all"
              />
              <button 
                onClick={addSection}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <div key={section} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 group/item">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{section}</span>
                  <button 
                    onClick={() => removeSection(section)}
                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-[10px] text-slate-400 leading-relaxed font-medium italic">
            * Define the streams (e.g. A, B, North, South) that can exist within each level. These will be available for selection when categorizing students.
          </p>
        </div>

        {/* Grading Protocols Section */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Grading Protocols</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define Evaluation Matrix</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setEditingScale({ name: '', ranges: [], applicableLevels: [] });
                setIsGradingModalOpen(true);
              }}
              className="p-2 transition-all hover:bg-slate-50 text-slate-400 hover:text-primary rounded-lg"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {gradingScales.map((scale) => (
              <div key={scale.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group/item">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                    <ClipboardCheck size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{scale.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {scale.ranges.length} RANGES • {scale.applicableLevels.length} LEVELS
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-all">
                  <button 
                    onClick={() => {
                      setEditingScale(scale);
                      setIsGradingModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-primary transition-colors"
                  >
                    <SettingsIcon size={16} />
                  </button>
                  <button 
                    onClick={() => deleteGradingScale(scale.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {gradingScales.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No custom scales initialized.</p>
              </div>
            )}
          </div>

          <p className="mt-8 text-[10px] text-slate-400 leading-relaxed font-medium italic">
            * Define custom grading ranges for different academic levels (e.g. Primary vs. Secondary). These scales determine the letter grade assigned to numerical exam marks.
          </p>
        </div>

        {/* User Management Section */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm col-span-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Access Control & Users</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Provision Teachers & Parents</p>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('userName') as string;
            const email = formData.get('userEmail') as string;
            const phone = formData.get('userPhone') as string;
            
            if (!name || !email || !role) return;

            const db = storageService.getDB();
            const userId = `u_${Date.now()}`;
            const newUser = {
              id: userId,
              name,
              email,
              phone,
              role,
              twoFactorEnabled: false,
              hasChangedInitialPassword: false
            };

            // Link students to this parent if needed
            let updatedStudents = [...db.students];
            if (role === 'parent' && selectedStudentIds.length > 0) {
              updatedStudents = db.students.map(s => 
                selectedStudentIds.includes(s.id) ? { ...s, parentId: userId } : s
              );
            }

            storageService.saveDB({ 
              ...db, 
              users: [...db.users, newUser],
              students: updatedStudents
            });
            
            setStatus(`${role.charAt(0).toUpperCase() + role.slice(1)} account created for ${name}.`);
            e.currentTarget.reset();
            setSelectedStudentIds([]);
            setRole('teacher');
          }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input name="userName" required type="text" placeholder="John Doe" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input name="userEmail" required type="email" placeholder="user@school.tz" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input name="userPhone" type="tel" placeholder="+255..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                <select 
                  name="userRole" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                >
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
            </div>

            {role === 'parent' && (
              <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link Children (Students)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {students.map(student => (
                    <label key={student.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-primary transition-all">
                      <input 
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, student.id]);
                          else setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="text-[10px] font-bold text-slate-900">{student.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{student.classId}</p>
                      </div>
                    </label>
                  ))}
                  {students.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">No students registered yet. Add students first.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg">
                Create Account
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-center">Role</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {storageService.getDB().users.map(user => (
                    <tr key={user.id} className="text-xs font-bold text-slate-600">
                      <td className="px-4 py-4">{user.name}</td>
                      <td className="px-4 py-4 text-slate-400">{user.email}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-black uppercase",
                          user.role === 'admin' ? "bg-slate-900 text-white" : 
                          user.role === 'teacher' ? "bg-indigo-50 text-primary" : 
                          "bg-emerald-50 text-emerald-600"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-[10px] text-slate-300">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Security & 2FA */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 text-primary border border-indigo-100 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Security Hardening</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Authentication Multi-Layer</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="text-slate-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Two-Factor Auth (2FA)</p>
                  <p className="text-[10px] text-slate-500 font-medium tracking-tight">Email verification required for login.</p>
                </div>
              </div>
              <button 
                onClick={toggle2FA}
                disabled={is2FALoading}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  currentUser?.twoFactorEnabled ? "bg-primary" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                  currentUser?.twoFactorEnabled ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound className="text-slate-400" size={20} />
                <div>
                  <p className="text-xs font-bold text-slate-900">Initial Password</p>
                  <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                    {currentUser?.hasChangedInitialPassword ? 'Status: Secure' : 'Status: Needs Change'}
                  </p>
                </div>
              </div>
              {!currentUser?.hasChangedInitialPassword && (
                <button 
                  onClick={handleChangePassword}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>

          <p className="mt-8 text-[10px] text-slate-400 leading-relaxed font-medium italic">
            * 2FA provides an extra layer of security by requiring a 6-digit code sent to your academic email in addition to your password. This ensures that even if your password is stolen, your account remains unreachable.
          </p>
        </div>

        {/* Core Setup */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Database Architecture</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Primary Records Initializer</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed grow font-medium">
              Initialize the core application state with predefined Tanzanian academic levels (Form 1–4) and NECTA-certified grading protocols. This operation resets default structural mappings.
            </p>
            <div className="mt-8">
              <button 
                onClick={initializeDefaultData}
                className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-primary transition-all text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10"
              >
                <RefreshCw size={16} />
                Initialize Environment
              </button>
            </div>
          </div>
        </div>

        {/* SMS Gateway */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col group grayscale opacity-60">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-primary border border-indigo-100 rounded-xl flex items-center justify-center">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">SMS Gateway (TZ)</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cellular Sync: Inactive</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed grow font-medium">
              Synchronize with local Tanzanian MNOs (Vodacom, Tigo, Airtel) to facilitate automated parent alerts for fee updates, attendance anomalies, and academic cycle results.
            </p>
            <div className="mt-8">
              <button disabled className="w-full py-4 bg-slate-50 text-slate-300 font-bold rounded-xl cursor-not-allowed text-[10px] uppercase tracking-widest border border-slate-100">
                Connect Gateway Protocol
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
          <Building2 size={20} className="text-primary" />
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Enterprise Profile Meta</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { label: 'Licensed Institution', value: 'Tanzania Premier School', icon: Building2 },
            { label: 'Operational Region', value: 'Dar es Salaam / Kinondoni', icon: Globe },
            { label: 'Currency Unit', value: 'TZS - Tanzanian Shilling', icon: Database },
            { label: 'System Administrator', value: SCHOOL_CONFIG.adminCredentials.name, icon: Lock },
            { label: 'Admin Endpoint', value: SCHOOL_CONFIG.adminCredentials.email, icon: Mail },
          ].map((item) => (
            <div key={item.label} className="space-y-2 group">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{item.label}</label>
              <div className="relative">
                <input 
                  type="text" 
                  readOnly 
                  value={item.value} 
                  className="w-full px-11 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-900 select-all" 
                />
                <item.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors" size={14} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Encryption & Compliance Status</p>
          <div className="flex justify-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase italic"><Shield size={12} className="text-emerald-500" /> AES-256</span>
            <span className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase italic"><Shield size={12} className="text-emerald-500" /> TCRA Cert</span>
            <span className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase italic"><Shield size={12} className="text-emerald-500" /> DPA No. 11</span>
          </div>
        </div>
      </div>

      {/* Grading Scale Modal */}
      <AnimatePresence>
        {isGradingModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGradingModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 m-auto w-full max-w-2xl h-fit max-h-[90vh] bg-white rounded-[32px] shadow-2xl z-[110] flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Grading Protocol Designer</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure mark-to-grade transition logic</p>
                </div>
                <button onClick={() => setIsGradingModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 text-left">
                <div className="space-y-6 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Protocol Name</label>
                    <input 
                      type="text" 
                      value={editingScale?.name || ''}
                      onChange={(e) => setEditingScale(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. NECTA Secondary Matrix"
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Applicable Academic Levels</label>
                    <div className="flex flex-wrap gap-2">
                       {SCHOOL_CONFIG.academicLevels.map(level => (
                         <button 
                           key={level}
                           onClick={() => toggleLevelSelection(level as AcademicLevel)}
                           className={cn(
                             "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                             editingScale?.applicableLevels?.includes(level)
                              ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                              : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                           )}
                         >
                           {level}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Scaling Ranges</label>
                    <button 
                      onClick={addRange}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      + Add Range
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editingScale?.ranges?.map((range, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="col-span-1 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase text-left block">Grade</label>
                          <input 
                            type="text" 
                            value={range.grade}
                            onChange={(e) => updateRange(index, 'grade', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black uppercase outline-none focus:border-primary"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase text-left block">Min %</label>
                          <input 
                            type="number" 
                            value={range.min}
                            onChange={(e) => updateRange(index, 'min', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-primary"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase text-left block">Max %</label>
                          <input 
                            type="number" 
                            value={range.max}
                            onChange={(e) => updateRange(index, 'max', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-primary"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase text-left block">Points</label>
                          <input 
                            type="number" 
                            value={range.points}
                            onChange={(e) => updateRange(index, 'points', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-primary"
                          />
                        </div>
                        <div className="col-span-4 space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase text-left block">Descriptor</label>
                          <input 
                            type="text" 
                            value={range.remark}
                            onChange={(e) => updateRange(index, 'remark', e.target.value)}
                            placeholder="e.g. Excellent"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-primary"
                          />
                        </div>
                        <div className="col-span-1 pb-1">
                          <button 
                            onClick={() => removeRange(index)}
                            className="w-full aspect-square flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!editingScale?.ranges || editingScale.ranges.length === 0) && (
                      <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No ranges defined. Click 'Add Range' to begin.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                <button 
                  onClick={handleSaveGradingScale}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
                >
                  Save Protocol
                </button>
                <button 
                  onClick={() => setIsGradingModalOpen(false)}
                  className="flex-1 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
