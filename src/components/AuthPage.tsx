/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  School, 
  LogIn, 
  Mail, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  KeyRound, 
  Sparkles 
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';
import { SCHOOL_CONFIG } from '../constants';
import { storageService } from '../services/storageService';
import { cn } from '../lib/utils';

interface AuthPageProps {
  onLogin: (user: any) => void;
  onBack?: () => void;
}

// Decorative morphing dynamic background shapes
const MorphingBlob = ({ className, delay = 0, duration = 12 }: { className?: string; delay?: number; duration?: number }) => (
  <motion.div
    animate={{
      borderRadius: [
        "42% 58% 70% 30% / 45% 45% 55% 55%",
        "70% 30% 52% 48% / 60% 40% 60% 40%",
        "30% 70% 70% 30% / 50% 60% 40% 50%",
        "42% 58% 70% 30% / 45% 45% 55% 55%"
      ],
      rotate: [0, 180, 360]
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={cn("absolute pointer-events-none mix-blend-multiply opacity-50 filter blur-3xl", className)}
  />
);

export const AuthPage = ({ onLogin, onBack }: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [is2FAChallenge, setIs2FAChallenge] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  // Focus tracking to provide morphing glow feedback
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'otp' | null>(null);

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

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col md:flex-row font-sans relative overflow-hidden">
      
      {/* Decorative Full Screen Morphing Background Grains */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#faf8f5]">
        <MorphingBlob className="w-96 h-96 bg-primary/5 -top-10 -left-10" delay={0} duration={16} />
        <MorphingBlob className="w-[450px] h-[450px] bg-yellow-500/5 bottom-10 right-10" delay={2} duration={20} />
        <MorphingBlob className="w-80 h-80 bg-primary/10 top-1/3 left-1/2" delay={4} duration={14} />
      </div>

      {/* Side Banner */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-16 z-10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-yellow-500/10 mix-blend-overlay" />
        
        {/* Animated fluid blobs inside side banner */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <MorphingBlob className="w-[500px] h-[500px] bg-white/10 -top-20 -right-20 blur-3xl" duration={18} />
          <MorphingBlob className="w-96 h-96 bg-yellow-300/5 bottom-10 left-10 blur-3xl" delay={3} duration={15} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <SchoolLogo size={48} className="bg-white rounded p-1.5 shadow-xl" variant="color" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase">{SCHOOL_CONFIG.name}</h1>
              <p className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase">Enterprise Edition</p>
            </div>
          </div>
          <h2 className="text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Digitalizing <br /> 
            <span className="text-[#facc15] font-black italic">Education</span> <br /> 
            in Tanzania
          </h2>
          <p className="text-slate-100/90 text-lg max-w-sm leading-relaxed font-medium">
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

      {/* Login & View morph controller container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 bg-transparent relative overflow-hidden z-10">
        <div className="lg:hidden absolute top-0 inset-x-0 h-1 bg-primary" />
        
        {/* The Card uses 'layout' to automatically morph form dimensions smoothly */}
        <motion.div 
          layout
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="w-full max-w-md bg-white border-t-4 border-t-[#facc15] border-x border-b border-slate-100 shadow-2xl p-8 sm:p-10 rounded-3xl relative"
        >
          {/* Internal floating background decorative morph lights */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

          <AnimatePresence mode="wait">
            {is2FAChallenge ? (
              // 2FA Challenge View
              <motion.div
                key="2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center uppercase tracking-tight">Two-Factor Auth</h3>
                <p className="text-slate-400 text-sm text-center font-medium mb-8">
                  {pendingUser?.role === 'admin' 
                    ? "Tumia namba ya siri ya kipekee ya msimamizi." 
                    : `Namba ya siri imetumwa kwa namba ya simu ${pendingUser?.phone || 'iliyosajiliwa'}.`}
                </p>

                <form onSubmit={handleVerify2FA} className="space-y-6">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center block">One-Time Password</label>
                    <div className="relative">
                      {/* Gradient outline focus highlight */}
                      <motion.div 
                        className="absolute inset-0 -m-[1px] rounded-lg bg-gradient-to-r from-[#064e3b] to-[#facc15] opacity-0 pointer-events-none blur-[2px]"
                        animate={{ opacity: focusedField === 'otp' ? 0.4 : 0 }}
                      />
                      <input
                        type="text"
                        value={otp}
                        onFocus={() => setFocusedField('otp')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        required
                        className="relative w-full bg-slate-50 border border-slate-200 rounded-lg py-4 text-center text-2xl font-bold tracking-[0.5em] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-200"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100 flex gap-2 items-center uppercase tracking-tight justify-center">
                      <AlertCircle size={14} className="shrink-0" />
                      {error}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-lg shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : 'Verify Identity'}
                  </motion.button>
                  <button 
                    type="button" 
                    onClick={() => setIs2FAChallenge(false)}
                    className="w-full text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-primary transition-colors block mt-2"
                  >
                    Back to Login
                  </button>
                </form>
              </motion.div>
            ) : view === 'forgot' ? (
              // Reset Password View
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="mb-8 text-center lg:text-left">
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
                    <motion.button 
                      whileHover={{ scale: 1.01 }} 
                      whileTap={{ scale: 0.99 }}
                      onClick={() => { setView('login'); setResetStatus(null); }} 
                      className="w-full py-4 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-all font-black uppercase tracking-widest text-[10px]"
                    >
                      Back to Login
                    </motion.button>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email or Admission No</label>
                      <div className="relative">
                        <motion.div 
                          className="absolute inset-0 -m-[1px] rounded-lg bg-gradient-to-r from-[#064e3b] to-[#facc15] opacity-0 pointer-events-none blur-[2px]"
                          animate={{ opacity: focusedField === 'email' ? 0.4 : 0 }}
                        />
                        <input
                          type="text"
                          value={email}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. S-2026-001"
                          required
                          className="relative w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-11 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      </div>
                    </div>
                    
                    <motion.button 
                      type="submit" 
                      disabled={loading} 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-lg shadow-xl shadow-primary/20 transition-all uppercase text-[10px] tracking-widest"
                    >
                      {loading ? 'Processing...' : 'Request Assistance'}
                    </motion.button>

                    <button 
                      type="button" 
                      onClick={() => setView('login')} 
                      className="w-full py-2 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-primary transition-colors"
                    >
                      Return to Login
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              // Primary Login View
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="lg:hidden flex justify-center mb-10">
                  <SchoolLogo size={56} className="bg-primary rounded p-2 shadow-2xl" variant="light" />
                </div>

                <div className="mb-10 text-center lg:text-left flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1 uppercase tracking-tight">System Login</h3>
                    <p className="text-slate-400 text-xs font-semibold">Authenticated Access Required</p>
                  </div>
                  <div className="hidden lg:block">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }} 
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="text-primary"
                    >
                      <Sparkles size={20} className="opacity-60" />
                    </motion.div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email / Admission No</label>
                      <button 
                        type="button" 
                        onClick={() => setView('forgot')} 
                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <motion.div 
                        className="absolute inset-0 -m-[1px] rounded-lg bg-gradient-to-r from-[#064e3b] to-[#facc15] opacity-0 pointer-events-none blur-[2px]"
                        animate={{ opacity: focusedField === 'email' ? 0.4 : 0 }}
                      />
                      <input
                        type="text"
                        value={email}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email or Admission Number"
                        required
                        className="relative w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-11 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <motion.div 
                        className="absolute inset-0 -m-[1px] rounded-lg bg-gradient-to-r from-[#064e3b] to-[#facc15] opacity-0 pointer-events-none blur-[2px]"
                        animate={{ opacity: focusedField === 'password' ? 0.4 : 0 }}
                      />
                      <input
                        type="password"
                        value={password}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="relative w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-11 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 text-sm font-medium"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-100 flex gap-2 items-center uppercase tracking-tight">
                      <AlertCircle size={14} className="shrink-0" />
                      {error}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
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
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent Custom Footer inside the layout-morphed container */}
          <footer className="mt-8 text-center lg:text-left border-t border-slate-100 pt-6">
            {onBack && (
              <button 
                onClick={onBack}
                className="mb-6 w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center lg:justify-start gap-2"
              >
                <ArrowLeft size={10} />
                Back to Frontpage
              </button>
            )}
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
