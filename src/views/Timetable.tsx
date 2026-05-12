/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  Clock, 
  MapPin, 
  User as UserIcon,
  BookOpen,
  ArrowRight,
  MoreVertical,
  Download
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { type TimetableEntry, type Class, type Subject, type User as UserType } from '../types';
import { cn } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const Timetable = () => {
  const [db, setDb] = useState(storageService.getDB());
  const [currentUser] = useState(storageService.getCurrentUser());
  const [selectedClass, setSelectedClass] = useState<string>(db.classes[0]?.id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formData, setFormData] = useState<Partial<TimetableEntry>>({
    day: 'Monday',
    startTime: '08:00',
    endTime: '08:40',
    subjectId: '',
    teacherId: '',
    classId: '',
    room: ''
  });

  const canManage = currentUser?.role === 'admin';

  useEffect(() => {
    if (db.classes.length > 0 && !selectedClass) {
      setSelectedClass(db.classes[0].id);
    }
  }, [db.classes, selectedClass]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newDb = { ...db };
    if (!newDb.timetable) newDb.timetable = [];

    if (editingEntry) {
      newDb.timetable = newDb.timetable.map(entry => 
        entry.id === editingEntry.id ? { ...entry, ...formData } as TimetableEntry : entry
      );
    } else {
      const newEntry: TimetableEntry = {
        id: generateId(),
        day: formData.day || 'Monday',
        startTime: formData.startTime || '08:00',
        endTime: formData.endTime || '08:40',
        subjectId: formData.subjectId || '',
        teacherId: formData.teacherId || '',
        classId: selectedClass,
        room: formData.room || ''
      };
      newDb.timetable.push(newEntry);
    }

    storageService.saveDB(newDb);
    setDb(newDb);
    setIsAddModalOpen(false);
    setEditingEntry(null);
    setFormData({
      day: 'Monday',
      startTime: '08:00',
      endTime: '08:40',
      subjectId: '',
      teacherId: '',
      classId: '',
      room: ''
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this class session?')) {
      const newDb = { ...db };
      newDb.timetable = newDb.timetable.filter(entry => entry.id !== id);
      storageService.saveDB(newDb);
      setDb(newDb);
    }
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsAddModalOpen(true);
  };

  const classTimetable = db.timetable.filter(entry => entry.classId === selectedClass);
  
  // Sort entries by time within each day
  const sortedTimetable = [...classTimetable].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getSubjectName = (id: string) => db.subjects.find(s => s.id === id)?.name || id;
  const getTeacherName = (id: string) => db.users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
            Timetable <span className="text-primary">Management</span>
          </h2>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            Scheduling System • Term II 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all"
          >
            {db.classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.section}</option>
            ))}
          </select>

          {canManage && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
            >
              <Plus size={16} />
              Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {DAYS.slice(0, 5).map((day) => (
          <div key={day} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day}</h3>
              <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                {sortedTimetable.filter(e => e.day === day).length} Sessions
              </span>
            </div>

            <div className="space-y-3 min-h-[500px] p-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 uppercase tracking-tighter">
              {sortedTimetable.filter(e => e.day === day).map((entry) => (
                <motion.div 
                  layoutId={entry.id}
                  key={entry.id}
                  className="group relative bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ring-1 ring-slate-100"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black">
                      <Clock size={12} />
                      {entry.startTime} - {entry.endTime}
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(entry)}
                          className="p-1 px-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-primary transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 px-1.5 hover:bg-slate-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h4 className="text-xs font-black text-slate-900 mb-1 truncate">{getSubjectName(entry.subjectId)}</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                      <UserIcon size={10} className="text-slate-300" />
                      {getTeacherName(entry.teacherId)}
                    </div>
                    {entry.room && (
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                        <MapPin size={10} className="text-slate-300" />
                        Room: {entry.room}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {sortedTimetable.filter(e => e.day === day).length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ArrowRight size={14} className="opacity-20" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">No Sessions</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white z-[110] rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <form onSubmit={handleSave}>
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                      {editingEntry ? 'Edit Session' : 'Schedule New Session'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Class Slot Configuration</p>
                  </div>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-all">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Day</label>
                      <select 
                        required
                        value={formData.day}
                        onChange={(e) => setFormData({...formData, day: e.target.value as any})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      >
                        {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room (Optional)</label>
                      <input 
                        type="text"
                        placeholder="E.g. Lab 1"
                        value={formData.room}
                        onChange={(e) => setFormData({...formData, room: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                      <input 
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                      <input 
                        type="time"
                        required
                        value={formData.endTime}
                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                    <div className="relative">
                      <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        required
                        value={formData.subjectId}
                        onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all appearance-none"
                      >
                        <option value="">Select Subject</option>
                        {db.subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teacher</label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        required
                        value={formData.teacherId}
                        onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all appearance-none"
                      >
                        <option value="">Select Teacher</option>
                        {db.users.filter(u => u.role === 'teacher' || u.role === 'admin').map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-3.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={14} />
                      {editingEntry ? 'Update Session' : 'Add to Calendar'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
