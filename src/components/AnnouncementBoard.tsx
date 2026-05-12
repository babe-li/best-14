/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, 
  Clock, 
  User, 
  Plus, 
  X, 
  Send, 
  AlertCircle,
  Bell,
  Trash2,
  Filter
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { type Announcement, type User as UserType, type UserRole } from '../types';
import { cn, generateId } from '../lib/utils';

export const AnnouncementBoard = () => {
  const [db, setDb] = useState(storageService.getDB());
  const [currentUser] = useState(storageService.getCurrentUser());
  const [isAdding, setIsAdding] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetRoles: ['student', 'teacher', 'parent'] as UserRole[]
  });

  if (!currentUser) return null;

  const announcements = db.announcements
    .filter(a => a.targetRoles.includes(currentUser.role))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const canPublish = currentUser.role === 'admin' || currentUser.role === 'teacher';

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    const announcement: Announcement = {
      id: generateId(),
      ...newAnnouncement,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      timestamp: new Date().toISOString(),
    };

    const updatedDB = {
      ...db,
      announcements: [announcement, ...db.announcements]
    };

    storageService.saveDB(updatedDB);
    setDb(updatedDB);
    setIsAdding(false);
    setNewAnnouncement({
      title: '',
      content: '',
      priority: 'medium',
      targetRoles: ['student', 'teacher', 'parent']
    });
  };

  const handleDelete = (id: string) => {
    const updatedDB = {
      ...db,
      announcements: db.announcements.filter(a => a.id !== id)
    };
    storageService.saveDB(updatedDB);
    setDb(updatedDB);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Megaphone size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Announcements</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official School Updates</p>
          </div>
        </div>
        {canPublish && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            <Plus size={14} />
            Post Update
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                  announcement.priority === 'high' ? "bg-rose-50 text-rose-600" : 
                  announcement.priority === 'medium' ? "bg-amber-50 text-amber-600" : 
                  "bg-slate-50 text-slate-400"
                )}>
                  {announcement.priority} PRIORITY
                </div>
                {canPublish && (announcement.authorId === currentUser.id || currentUser.role === 'admin') && (
                  <button 
                    onClick={() => handleDelete(announcement.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              <h3 className="text-sm font-bold text-slate-900 mb-2 leading-tight">{announcement.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium line-clamp-3">
                {announcement.content}
              </p>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {announcement.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-900">{announcement.authorName}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{announcement.authorRole}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock size={12} />
                  <span className="text-[9px] font-bold">
                    {new Date(announcement.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {announcements.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <Bell size={32} className="text-slate-200 mb-4" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">No Recent Announcements</p>
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">New Announcement</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Post update to school community</p>
                </div>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePublish} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Announcement Title</label>
                  <input 
                    type="text"
                    required
                    value={newAnnouncement.title}
                    onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    placeholder="e.g. End of Term Notice"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Content Details</label>
                  <textarea 
                    required
                    rows={4}
                    value={newAnnouncement.content}
                    onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                    placeholder="Write your announcement details here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Priority Level</label>
                    <select 
                      value={newAnnouncement.priority}
                      onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all appearance-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Target Audience</label>
                    <div className="flex flex-wrap gap-2">
                       {['student', 'teacher', 'parent'].map((role) => (
                         <button
                           key={role}
                           type="button"
                           onClick={() => {
                             const current = newAnnouncement.targetRoles;
                             if (current.includes(role as UserRole)) {
                               if (current.length > 1) {
                                 setNewAnnouncement({...newAnnouncement, targetRoles: current.filter(r => r !== role)});
                               }
                             } else {
                               setNewAnnouncement({...newAnnouncement, targetRoles: [...current, role as UserRole]});
                             }
                           }}
                           className={cn(
                             "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                             newAnnouncement.targetRoles.includes(role as UserRole)
                               ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                               : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                           )}
                         >
                           {role}s
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Publish Announcement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
