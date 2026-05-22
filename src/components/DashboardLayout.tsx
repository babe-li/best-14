/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Table,
  ChevronRight,
  School,
  GraduationCap,
  Library,
  MessageSquare,
  ClipboardList,
  ShieldAlert,
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { cn } from '../lib/utils';
import { type User } from '../types';
import { SCHOOL_CONFIG } from '../constants';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
  badge?: number;
}

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, badge }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
      active 
        ? "bg-white/60 text-primary font-bold shadow-sm shadow-indigo-500/5 ring-1 ring-white/50" 
        : "text-slate-500 hover:bg-white/40 hover:text-primary active:scale-95"
    )}
  >
    <Icon className={cn("shrink-0", collapsed ? "w-6 h-6 mx-auto" : "w-4 h-4")} />
    {!collapsed && <span className="text-sm tracking-tight flex-1 flex justify-between items-center text-left">
      {label}
      {badge && (
        <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </span>}
    {collapsed && badge && (
      <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border-2 border-white" />
    )}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-bold uppercase tracking-widest">
        {label}
      </div>
    )}
  </button>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeView: string;
  setActiveView: (view: any) => void;
}

export const DashboardLayout = ({ children, user, onLogout, activeView, setActiveView }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [show2FAPrompt, setShow2FAPrompt] = useState(
    user.role === 'admin' && !user.twoFactorEnabled
  );

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, roles: ['admin', 'teacher', 'parent', 'student', 'accountant', 'librarian'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['admin', 'teacher', 'parent', 'student', 'accountant'] },
    { id: 'attendance', label: 'Attendance', icon: Calendar, roles: ['admin', 'teacher', 'parent', 'student', 'accountant', 'librarian'] },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, roles: ['admin', 'teacher'] },
    { id: 'permissions', label: 'Permissions', icon: ShieldAlert, roles: ['admin', 'teacher', 'parent'] },
    { id: 'finance', label: 'Fees & Finance', icon: CreditCard, roles: ['admin', 'accountant'] },
    { id: 'pay-fees', label: 'Pay Fees', icon: CreditCard, roles: ['parent'] },
    { id: 'exams', label: 'Exam Results', icon: GraduationCap, roles: ['admin', 'teacher', 'parent', 'student', 'accountant'] },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: 3, roles: ['admin', 'teacher', 'parent', 'student', 'accountant', 'librarian'] },
    { id: 'users', label: 'Staff & Roles', icon: ShieldAlert, roles: ['admin'] },
    { id: 'academics', label: 'Academics', icon: BookOpen, roles: ['admin', 'teacher', 'parent', 'student'] },
    { id: 'timetable', label: 'Timetable', icon: Table, roles: ['admin', 'teacher', 'student'] },
    { id: 'library', label: 'Library', icon: Library, roles: ['admin', 'teacher', 'student', 'librarian'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const handleNav = (id: string) => {
    setActiveView(id);
    setMobileOpen(false);
  };

  const handleSetup2FA = () => {
    setActiveView('settings');
    setShow2FAPrompt(false);
  };

  return (
    <div className="flex h-screen premium-bg text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
        className="hidden md:flex flex-col glass-sidebar z-30"
      >
        <div className="h-16 px-6 flex items-center gap-3 border-b border-white/20">
          <SchoolLogo size={32} className="bg-slate-900 rounded-xl shadow-lg shadow-slate-900/20 p-1" variant="light" />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-bold tracking-tight uppercase leading-none truncate">{SCHOOL_CONFIG.name}</h1>
                <span className="px-1.5 py-0.5 bg-premium-gold/10 text-premium-gold border border-premium-gold/20 rounded text-[7px] font-black uppercase tracking-tighter">
                  Elite
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">Premium Terminal</span>
            </motion.div>
          )}
        </div>

        <div className="flex-1 px-3 space-y-6 pt-6 overflow-y-auto overflow-x-hidden">
          <div>
            {!collapsed && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 px-3">Main Menu</div>}
            <nav className="space-y-1">
              {visibleMenuItems.slice(0, 7).map((item) => (
                <SidebarItem
                  key={item.id}
                  {...item}
                  active={activeView === item.id}
                  onClick={() => handleNav(item.id)}
                  collapsed={collapsed}
                />
              ))}
            </nav>
          </div>

          <div>
            {!collapsed && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 px-3">System</div>}
            <nav className="space-y-1">
              {visibleMenuItems.slice(7).map((item) => (
                <SidebarItem
                  key={item.id}
                  {...item}
                  active={activeView === item.id}
                  onClick={() => handleNav(item.id)}
                  collapsed={collapsed}
                />
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 mt-auto">
          {!collapsed && (
            <div className="p-4 bg-[#064e3b] border border-[#facc15]/20 rounded-xl text-white mb-4">
              <div className="text-[10px] text-[#facc15] uppercase mb-1 font-bold">Academic Year</div>
              <div className="text-lg font-bold tracking-tight mb-2 uppercase text-slate-100">May 2026</div>
              <div className="flex justify-between items-center">
                <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-[#faf8f5]">TERM II</span>
                <span className="text-[10px] text-emerald-400 font-bold">● ACTIVE</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={18} className="mx-auto" /> : (
              <>
                <Menu size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Minimize</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 md:hidden flex flex-col"
            >
              <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <SchoolLogo size={32} className="bg-primary rounded p-1 shadow-lg shadow-primary/20" variant="light" />
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-xs font-bold tracking-tight uppercase leading-none">{SCHOOL_CONFIG.name}</h1>
                      <span className="px-1.5 py-0.5 bg-premium-gold/10 text-premium-gold border border-premium-gold/20 rounded text-[7px] font-black uppercase tracking-tighter animate-pulse">
                        Elite
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Premium Edition 2026</span>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 px-3">Main Menu</div>
                  <nav className="space-y-1">
                    {visibleMenuItems.slice(0, 7).map((item) => (
                      <SidebarItem
                        key={item.id}
                        {...item}
                        active={activeView === item.id}
                        onClick={() => handleNav(item.id)}
                      />
                    ))}
                  </nav>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 px-3">System</div>
                  <nav className="space-y-1">
                    {visibleMenuItems.slice(7).map((item) => (
                      <SidebarItem
                        key={item.id}
                        {...item}
                        active={activeView === item.id}
                        onClick={() => handleNav(item.id)}
                      />
                    ))}
                  </nav>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                >
                  <LogOut size={16} />
                  Terminate Session
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white/40 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-slate-500 md:hidden hover:bg-slate-50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-widest">Workspace</span>
              <ChevronRight size={12} />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                {menuItems.find(i => i.id === activeView)?.label}
              </span>
            </div>
            {/* Mobile Workspace Label */}
            <span className="sm:hidden text-xs font-bold text-slate-900 uppercase tracking-tight truncate max-w-[120px]">
              {menuItems.find(i => i.id === activeView)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button 
              onClick={() => setActiveView('profile')}
              className="xs:flex flex-col items-end text-right hover:opacity-80 transition-opacity"
            >
              <span className="text-xs font-bold text-slate-900">{user.name}</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">{user.role}</span>
            </button>
            <button 
              onClick={() => setActiveView('profile')}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden hover:ring-4 hover:ring-primary/5 transition-all"
            >
              {user.name.split(' ').map(n => n[0]).join('')}
            </button>
            <div className="hidden sm:block h-4 w-px bg-slate-200 mx-1" />
            <button
              onClick={onLogout}
              className="hidden sm:flex p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* 2FA Alert Banner */}
        {show2FAPrompt && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-amber-500 shrink-0" size={20} />
              <div>
                <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Security Protocol Advisory</p>
                <p className="text-[10px] text-slate-500 font-medium">Enable 2FA to satisfy DPA No. 11 encryption standards.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button 
                onClick={() => setShow2FAPrompt(false)}
                className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 transition-all whitespace-nowrap"
              >
                Dismiss
              </button>
              <button 
                onClick={handleSetup2FA}
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all whitespace-nowrap"
              >
                Configure
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              key={activeView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* Status Bar */}
        <footer className="h-auto py-2 sm:h-8 bg-[#064e3b] text-white flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 text-[10px] shrink-0 uppercase tracking-widest font-bold gap-2 border-t border-[#facc15]/20">
          <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center text-[#faf8f5]">
            <span className="text-[#facc15]">DB: MARIADB</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Online
            </span>
          </div>
          <div className="opacity-60 text-center text-[#faf8f5]">
            Tanzania DPA COMPLIANT
          </div>
        </footer>
      </div>
    </div>
  );
};
