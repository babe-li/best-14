/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Shield, 
  Users, 
  BookOpen, 
  BarChart3, 
  Globe, 
  Zap,
  Menu,
  X,
  CreditCard,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';
import { SCHOOL_CONFIG } from '../constants';

export interface LandingProps {
  onEnterApp: () => void;
}

export const Landing = ({ onEnterApp }: LandingProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary selection:text-white relative">
      {/* Global Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop" 
          alt="Forest Background"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SchoolLogo size={36} className="bg-primary rounded p-1.5 shadow-lg" variant="light" />
            <div>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{SCHOOL_CONFIG.name}</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Management Portal</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Modules', 'Pricing', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors">
                {item}
              </a>
            ))}
            <button 
              onClick={onEnterApp}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
            >
              System Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={{ height: isMenuOpen ? 'auto' : 0, opacity: isMenuOpen ? 1 : 0 }}
        className="fixed top-20 left-0 right-0 z-40 bg-white border-b border-slate-100 overflow-hidden md:hidden"
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          {['Features', 'Modules', 'Pricing', 'About'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {item}
            </a>
          ))}
          <button 
            onClick={onEnterApp}
            className="w-full py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            Access Portal
          </button>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 relative overflow-hidden">
        {/* Forest Background with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop" 
            alt="Forest Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />
        </div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full mb-8">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">2026 Academic Edition</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-8">
                The Operating System for <span className="text-primary italic">Modern Schools</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg mb-10">
                A unified ecosystem for students, teachers, and administrators. Manage everything from NECTA compliance to fee tracking in one clean interface.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onEnterApp}
                  className="px-10 py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-3 group"
                >
                  Enter Portal
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-4 px-6 py-2">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">U{i}</div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Used by 50+ schools <br /> in Tanzania</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative z-10"
            >
              <div className="bg-white rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/20" />
                  </div>
                  <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">dashboard.preview</div>
                  <div className="w-4 h-4" />
                </div>
                <div className="p-8 grid grid-cols-2 gap-4">
                  <div className="col-span-2 h-40 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-center">
                    <BarChart3 className="text-primary/20" size={48} />
                  </div>
                  <div className="h-24 bg-slate-50/50 rounded-xl border border-slate-100" />
                  <div className="h-24 bg-slate-50/50 rounded-xl border border-slate-100" />
                </div>
              </div>
            </motion.div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-[3rem] rotate-12 -z-0" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-slate-100 rounded-full -z-0" />
          </div>
        </div>
      </section>

      {/* Stats/Badges */}
      <section className="py-12 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-12">
          {[
            { label: 'Active Users', value: '150k+', icon: Users },
            { label: 'Compliance', value: 'NECTA READY', icon: Shield },
            { label: 'Uptime', value: '99.99%', icon: Zap },
            { label: 'Regions', value: '14+ TZ Regions', icon: Globe },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-white font-extrabold text-lg leading-none mb-1">{stat.value}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">The Solution Ecosystem</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">Everything you need to <br /> run an <span className="text-primary">Elite Institution</span></h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Academic Engine', desc: 'Manage curricula, lesson plans, and results analysis with NECTA standards.', icon: BookOpen, color: 'text-indigo-500' },
              { title: 'Finance Control', desc: 'Secure fee tracking, parent receipts, and automated financial reports.', icon: CreditCard, color: 'text-emerald-500' },
              { title: 'Live Timetabling', desc: 'Dynamic scheduling for classes and exams with resource conflict alerts.', icon: Clock, color: 'text-amber-500' },
              { title: 'Student Management', desc: '360-degree view of student progress, attendance, and health records.', icon: Users, color: 'text-sky-500' },
              { title: 'Security & 2FA', desc: 'Enterprise-grade encryption with mandatory two-factor authentication.', icon: Shield, color: 'text-slate-900' },
              { title: 'Digital Repository', desc: 'Cloud storage for library resources, exams, and institutional documents.', icon: LayoutDashboard, color: 'text-rose-500' },
            ].map((module, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all group"
              >
                <div className={`w-14 h-14 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-8 ${module.color} group-hover:scale-110 transition-transform`}>
                  <module.icon size={28} />
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight">{module.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{module.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-primary rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-8">Ready to transform your school?</h2>
            <p className="text-white/70 text-lg font-medium mb-12">
              Join the growing list of top-performing schools in Tanzania using our digital ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={onEnterApp}
                className="px-12 py-5 bg-white text-primary rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-2xl shadow-black/10"
              >
                Launch System Portal
              </button>
              <button className="px-12 py-5 bg-primary-dark text-white border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all">
                Speak with Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <SchoolLogo size={32} className="bg-primary rounded p-1" variant="light" />
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">{SCHOOL_CONFIG.name}</h1>
            </div>
            <p className="text-slate-400 font-medium max-w-sm mb-8 leading-relaxed">
              Professionalizing educational management in Tanzania through secure, scalable, and intuitive digital solutions.
            </p>
            <div className="flex gap-6">
              {[Globe, Shield, Zap].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-8">Platform</h5>
            <ul className="space-y-4">
              {['Features', 'Security', 'Tanzania Edition', 'NECTA Sync'].map(link => (
                <li key={link}><a href="#" className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-8">Support</h5>
            <ul className="space-y-4">
              {['Documentation', 'ICT Support', 'Teacher Training', 'Contact'].map(link => (
                <li key={link}><a href="#" className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-slate-50">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            &copy; 2026 {SCHOOL_CONFIG.name}. Enterprise Edition V2.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-500">Privacy Policy</a>
            <a href="#" className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-500">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
