/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Search, 
  MessageSquare, 
  User, 
  CheckCheck, 
  Phone, 
  Video, 
  MoreHorizontal,
  Circle,
  Paperclip,
  Smile,
  GraduationCap,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { type Message, type User as UserType, type Student, type UserRole } from '../types';
import { cn, generateId } from '../lib/utils';

export const Messages = () => {
  const [db, setDb] = useState(storageService.getDB());
  const [currentUser] = useState(storageService.getCurrentUser());
  const [activeContact, setActiveContact] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContact]);

  useEffect(() => {
    if (!currentUser) return;
    
    // Sort and filter messages for the active conversation
    if (activeContact) {
      const chatMessages = db.messages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === activeContact.id) ||
        (m.senderId === activeContact.id && m.receiverId === currentUser.id)
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(chatMessages);
    }
  }, [activeContact, db.messages, currentUser]);

  // Fetch actual contacts from DB based on role
  const contacts: UserType[] = React.useMemo(() => {
    if (!currentUser) return [];
    
    // Admins and Teachers can message almost anyone
    if (currentUser.role === 'admin' || currentUser.role === 'teacher') {
      return db.users.filter(u => u.id !== currentUser.id);
    }
    
    // Students and Parents primarily message teachers and admins
    if (currentUser.role === 'student' || currentUser.role === 'parent') {
      return db.users.filter(u => 
        u.id !== currentUser.id && (u.role === 'teacher' || u.role === 'admin')
      );
    }
    
    return db.users.filter(u => u.id !== currentUser.id);
  }, [db.users, currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact || !currentUser) return;

    const msg: Message = {
      id: generateId(),
      senderId: currentUser.id,
      receiverId: activeContact.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedDB = { ...db, messages: [...db.messages, msg] };
    storageService.saveDB(updatedDB);
    setDb(updatedDB);
    setNewMessage('');

    // Trigger notification
    notificationService.notifyNewMessage(activeContact.id, currentUser.name, newMessage.substring(0, 50) + (newMessage.length > 50 ? '...' : ''));
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] min-h-[500px] flex gap-4 lg:gap-6 relative">
      {/* Contact List */}
      <div className={cn(
        "w-full lg:w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 transition-all",
        activeContact && "hidden lg:flex"
      )}>
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredContacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                activeContact?.id === contact.id ? "bg-primary-light text-primary" : "hover:bg-slate-50 text-slate-500"
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs">
                  {contact.avatar || contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate leading-tight">{contact.name}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-0.5">{contact.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className={cn(
        "flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative",
        !activeContact && "hidden lg:flex"
      )}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="px-4 lg:px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
              <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                <button 
                  onClick={() => setActiveContact(null)}
                  className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-primary transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-[10px] lg:text-xs text-slate-400 shrink-0">
                  {activeContact.avatar || activeContact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs lg:text-sm font-extrabold text-slate-900 tracking-tight truncate">{activeContact.name}</h3>
                  <div className="flex items-center gap-1.5 uppercase text-[9px] lg:text-[10px] font-bold text-emerald-500 tracking-widest">
                    <Circle size={6} fill="currentColor" className="lg:w-2 lg:h-2" />
                    Online
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button className="hidden sm:flex p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl">
                  <Phone size={18} />
                </button>
                <button className="hidden sm:flex p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl">
                  <Video size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 bg-slate-50/50">
              {messages.map((msg, i) => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[85%] lg:max-w-[70%]",
                      isMine ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-3 lg:p-4 rounded-xl lg:rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                      isMine 
                        ? "bg-slate-900 text-white rounded-tr-none" 
                        : "bg-white text-slate-600 border border-slate-200 rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && <CheckCheck size={12} className="text-primary" />}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                  <MessageSquare size={48} className="text-slate-300 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Start a new conversation</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 lg:px-8 py-4 lg:py-6 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 lg:gap-4">
                <button type="button" className="hidden sm:block p-2 text-slate-400 hover:text-primary">
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Wasiliana hapa..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl py-3 lg:py-4 pl-4 pr-10 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500">
                    <Smile size={18} />
                  </button>
                </div>
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 lg:p-4 bg-primary text-white rounded-xl lg:rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shrink-0"
                >
                  <Send size={18} className="lg:w-5 lg:h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-slate-50 rounded-2xl lg:rounded-3xl flex items-center justify-center mb-6 text-slate-300 border border-slate-100">
              <MessageSquare size={32} className="lg:w-10 lg:h-10" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Your Communication Hub</h3>
            <p className="text-slate-400 text-xs lg:text-sm font-medium max-w-sm leading-relaxed mx-auto italic">
              Select a contact to engage in professional discourse with parents and faculty.
            </p>
            
            <div className="mt-8 lg:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
              <div className="p-4 lg:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <GraduationCap className="text-primary mb-3" size={24} />
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight mb-1">Academic Sync</p>
                <p className="text-[10px] text-slate-400 leading-tight">Discuss results directly with subject teachers.</p>
              </div>
              <div className="p-4 lg:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <User className="text-indigo-400 mb-3" size={24} />
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight mb-1">Fee Inquiries</p>
                <p className="text-[10px] text-slate-400 leading-tight">Instant resolution of payment reconciliation issues.</p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Context Sidebar for Student Info */}
        <AnimatePresence>
          {activeContact && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-20 right-4 lg:right-6 w-48 lg:w-64 bg-slate-900 rounded-2xl p-4 lg:p-6 text-white shadow-2xl z-20 pointer-events-none opacity-0 lg:group-hover:opacity-100 transition-opacity"
            >
               <p className="text-[9px] lg:text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 lg:mb-4">Context</p>
               <p className="text-[11px] font-bold mb-4 lg:mb-6 leading-tight">Assigned for Student: Said Mwinyi (Form 4B)</p>
               <div className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-white/10 rounded-xl">
                 <div className="w-6 h-6 lg:w-8 lg:h-8 rounded bg-white/20 flex items-center justify-center shrink-0"><CheckCheck size={12} /></div>
                 <div>
                    <p className="text-[9px] lg:text-[10px] font-bold">Standard</p>
                    <p className="text-[8px] lg:text-[9px] opacity-60">Verified Admin</p>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
