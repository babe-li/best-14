/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { School, LogIn, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { SCHOOL_CONFIG } from '../constants';
import { storageService } from '../services/storageService';
import { cn } from '../lib/utils';

interface AuthPageProps {
  onLogin: (user: any) => void;
}

export const AuthPage = ({ onLogin }: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [is2FAChallenge, setIs2FAChallenge] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate auth check
    setTimeout(() => {
      const db = storageService.getDB();
      // Check database users first
      // Check email login or admission number login
      let user = db.users.find(u => 
        (u.email.toLowerCase() === email.toLowerCase() || 
         (u.role === 'student' && u.studentMetadata?.admissionNo.toLowerCase() === email.toLowerCase())) && 
        u.password === password
      );
      
      // Fallback to hardcoded admin if matching
      if (!user && (email === SCHOOL_CONFIG.adminCredentials.email || email === 'admin') && password === SCHOOL_CONFIG.adminCredentials.password) {
        user = db.users.find(u => u.role === 'admin') || {
          id: 'admin-1',
          name: 'Super Admin',
          email: SCHOOL_CONFIG.adminCredentials.email,
          password: SCHOOL_CONFIG.adminCredentials.password,
          role: 'admin',
          avatar: 'SA'
        };
      }

      if (user) {
        if (user.twoFactorEnabled) {
          setPendingUser(user);
          setIs2FAChallenge(true);
          setLoading(false);
          
          // Simulation feedback
          if (user.role !== 'admin') {
            console.log(`2FA Code 123456 sent to ${user.phone || 'registered device'}`);
          }
        } else {
          storageService.setCurrentUser(user);
          onLogin(user);
        }
      } else {
        setError('Hati tambuzi si sahihi. Tafadhali jaribu tena.');
        setLoading(false);
      }
    }, 800);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      const db = storageService.getDB();
      const user = db.users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() || 
        (u.role === 'student' && u.studentMetadata?.admissionNo.toLowerCase() === email.toLowerCase())
      );

      if (user) {
        setResetStatus(`Instruction requested for ${user.role} account. Since this is a Tanzanian secure portal, please visit the School ICT office or contact the administrator to reset your password.`);
      } else {
        setError('Maelezo hayo hayapatikani kwenye mfumo.');
      }
      setLoading(false);
    }, 1200);
  };

  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
        <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-16">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">Access <br /> <span className="text-slate-300 italic font-medium">Recovery</span></h2>
            <p className="text-white/70 text-lg max-w-sm leading-relaxed font-medium">Restoring your digital access to the academic ecosystem.</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
            <div className="mb-10 text-center lg:text-left">
              <h3 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Reset Password</h3>
              <p className="text-slate-400 text-sm font-medium">Verify your registered identity</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {resetStatus ? (
              <div className="space-y-6">
                <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-xs font-bold leading-relaxed">
                  {resetStatus}
                </div>
                <button onClick={() => { setView('login'); setResetStatus(null); }} className="w-full py-4 text-primary font-black uppercase tracking-widest text-[10px]">Back to Login</button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email or Admission No</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. S-2026-001"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-11 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-lg shadow-xl shadow-primary/20 transition-all uppercase text-[10px] tracking-widest">
                  {loading ? 'Processing...' : 'Request Assistance'}
                </button>
                <button type="button" onClick={() => setView('login')} className="w-full py-2 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-primary transition-colors">Return to Login</button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate OTP check
    setTimeout(() => {
      const isCorrectOtp = pendingUser?.role === 'admin' 
        ? otp === '666111' 
        : otp === '123456';

      if (isCorrectOtp) {
        storageService.setCurrentUser(pendingUser);
        onLogin(pendingUser);
      } else {
        setError('Nambari ya siri si sahihi.');
        setLoading(false);
      }
    }, 800);
  };

  if (is2FAChallenge) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white p-10 rounded-2xl border border-slate-200 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Two-Factor Auth</h3>
          <p className="text-slate-400 text-sm font-medium mb-8">
            {pendingUser?.role === 'admin' 
              ? "Tumia namba ya siri ya kipekee ya msimamizi." 
              : `Namba ya siri imetumwa kwa namba ya simu ${pendingUser?.phone || 'iliyosajiliwa'}.`}
          </p>

          <form onSubmit={handleVerify2FA} className="space-y-6">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-center block">One-Time Password</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 text-center text-2xl font-bold tracking-[0.5em] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-200"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100 flex gap-2 items-center uppercase tracking-tight justify-center">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-lg shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-70"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : 'Verify Identity'}
            </button>
            <button 
              type="button" 
              onClick={() => setIs2FAChallenge(false)}
              className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-primary transition-colors"
            >
              Back to Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans font-sans">
      {/* Side Banner */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-dark rounded-full -ml-48 -mb-48 blur-3xl opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <SchoolLogo size={48} className="bg-white rounded p-1.5 shadow-xl" variant="color" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase">{SCHOOL_CONFIG.name}</h1>
              <p className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase">Enterprise Edition</p>
            </div>
          </div>
          <h2 className="text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Digitalizing <br /> <span className="text-slate-300 italic font-medium">Education</span> <br /> in Tanzania
          </h2>
          <p className="text-white/70 text-lg max-w-sm leading-relaxed font-medium">
            Professional school management with automated reports, fee tracking, and NECTA-compliant data.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8">
          <div className="flex flex-col text-white/40">
            <span className="text-[10px] uppercase font-bold tracking-widest mb-2">Version</span>
            <span className="text-white font-bold text-sm">2026.05.02</span>
          </div>
          <div className="flex flex-col text-white/40">
            <span className="text-[10px] uppercase font-bold tracking-widest mb-2">Compliance</span>
            <span className="text-white font-bold text-sm">DPA No. 11</span>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        <div className="lg:hidden absolute top-0 inset-x-0 h-1 bg-primary" />
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex justify-center mb-10">
            <SchoolLogo size={56} className="bg-primary rounded p-2 shadow-2xl" variant="light" />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">System Login</h3>
            <p className="text-slate-400 text-sm font-medium">Authenticated Access Required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email / Admission No</label>
                <button type="button" onClick={() => setView('forgot')} className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or Admission Number"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-11 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-11 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100 flex gap-2 items-center uppercase tracking-tight">
                <ShieldCheck size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-lg shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-70"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Authorize Login
                </>
              )}
            </button>
          </form>

          <footer className="mt-16 text-center lg:text-left border-t border-slate-100 pt-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
              Managed by Babeli Myovela <br />
              &copy; 2026 {SCHOOL_CONFIG.name}
            </p>
          </footer>
        </motion.div>
      </div>
    </div>
  );
};
