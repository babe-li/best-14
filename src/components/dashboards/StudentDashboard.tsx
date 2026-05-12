/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  Trophy,
  Library,
  Calendar,
  AlertCircle,
  ChevronRight,
  Brain,
  Sparkles,
  Zap,
  Loader2
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { aiService, type AIPredictionResult } from '../../services/aiService';
import { type User, type Student, type Result, type Attendance } from '../../types';
import { cn } from '../../lib/utils';

interface StudentDashboardProps {
  user: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [db] = useState(storageService.getDB());
  const [aiPrediction, setAiPrediction] = useState<AIPredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    // ... existing linking logic ...
    const student = db.students.find(s => s.admissionNo === user.phone || s.id === user.id);
    if (!student) return;

    setStudentData(student);
    // ... results and attendance ...
    const sResults = db.results
      .filter(r => r.studentId === student.id)
      .sort((a, b) => {
        const examA = db.exams.find(e => e.id === a.examId);
        const examB = db.exams.find(e => e.id === b.examId);
        return (examB?.date || '').localeCompare(examA?.date || '');
      });
    setResults(sResults);
    
    // Automatically trigger recommendations based on lowest score
    if (sResults.length > 0) {
      const weakest = [...sResults].sort((a, b) => a.marks - b.marks)[0];
      const subject = db.exams.find(e => e.id === weakest.examId)?.subjectId || 'Studies';
      fetchResources(subject, weakest.marks);
    }

    const sAttendance = db.attendance.filter(a => a.studentId === student.id);
    setAttendance(sAttendance);
  }, [user, db]);

  const fetchResources = async (subject: string, score: number) => {
    setLoadingResources(true);
    try {
      const resp = await aiService.suggestLearningResources(subject, score);
      setRecommendations(resp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingResources(false);
    }
  };

  const generatePrediction = async () => {
    if (!studentData || results.length === 0) return;
    setIsPredicting(true);
    try {
      const records = results.map(r => ({
        subjectId: db.exams.find(e => e.id === r.examId)?.subjectId || 'Unknown',
        marks: r.marks,
        grade: r.grade,
        term: db.exams.find(e => e.id === r.examId)?.term || 1
      }));
      const prediction = await aiService.predictPerformance(studentData.name, records);
      setAiPrediction(prediction);
    } catch (error) {
      console.error("AI Prediction failed", error);
    } finally {
      setIsPredicting(false);
    }
  };

  if (!studentData) {
    return (
      <div className="p-12 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-slate-300" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Record Unlinked</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-xs mx-auto">
            Your system account is not currently linked to a candidate record. Please contact the registrar.
          </p>
        </div>
      </div>
    );
  }

  const attendanceRate = attendance.length > 0 
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) 
    : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-900 text-premium-gold rounded-2xl flex items-center justify-center font-black text-xl lg:text-2xl shadow-xl shadow-slate-900/10 border border-premium-gold/30">
            {studentData.name[0]}
          </div>
          <div>
            <h2 className="text-lg lg:text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">{studentData.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] lg:text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">Adm: {studentData.admissionNo}</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] lg:text-[10px] font-black uppercase tracking-widest border border-slate-200">{studentData.classId}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
           <div className="flex-1 bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100 sm:min-w-[140px]">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                 <Clock size={18} />
              </div>
              <div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Attendance</p>
                 <p className="text-base lg:text-lg font-black text-slate-900 leading-none">{attendanceRate}%</p>
              </div>
           </div>
           <div className="flex-1 bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100 sm:min-w-[160px]">
              <div className={cn(
                "w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center",
                studentData.feeBalance > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
              )}>
                 <Zap size={18} />
              </div>
              <div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Fee Status</p>
                 <p className={cn(
                   "text-base lg:text-lg font-black leading-none",
                   studentData.feeBalance > 0 ? "text-red-500" : "text-emerald-500"
                 )}>
                   {studentData.feeBalance > 0 ? `TZS ${studentData.feeBalance.toLocaleString()}` : "CLEARED"}
                 </p>
              </div>
           </div>
           <div className="flex-1 bg-premium-dark p-4 rounded-2xl flex items-center gap-3 shadow-xl shadow-premium-dark/10 border border-premium-gold/20 sm:min-w-[140px]">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-premium-gold/20 rounded-xl flex items-center justify-center text-premium-gold">
                 <Trophy size={18} />
              </div>
              <div>
                 <p className="text-[9px] font-bold text-premium-gold/60 uppercase tracking-widest leading-none mb-1">Rank</p>
                 <p className="text-base lg:text-lg font-black text-premium-gold leading-none">Div I ✨</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap size={14} className="text-primary" />
              Academic Transcript
            </h3>
            <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View Report Card</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[400px]">
             <div className="divide-y divide-slate-50">
                {results.map((r, idx) => {
                  const exam = db.exams.find(e => e.id === r.examId);
                  return (
                    <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all",
                            r.grade === 'A' ? "bg-emerald-50 text-emerald-600" :
                            r.grade === 'B' ? "bg-indigo-50 text-indigo-600" :
                            "bg-slate-50 text-slate-400"
                          )}>
                             {r.grade}
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-900">{exam?.title}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{exam?.subjectId} • {exam?.year}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-slate-900">{r.marks}%</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight italic">{r.remarks}</p>
                       </div>
                    </div>
                  );
                })}
                {results.length === 0 && (
                  <div className="p-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                    No results have been published yet for this cycle.
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* AI Projection Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Brain size={14} className="text-primary" />
            Neural Performance Projection
          </h3>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden group min-h-[400px] flex flex-col"
          >
            {/* Animated background glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full -ml-24 -mb-24 blur-2xl opacity-30" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-primary">
                    <Sparkles size={20} className="animate-pulse" />
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">AI Academic Forecast</h4>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em]">Based on NECTA Standards</p>
                 </div>
              </div>

              {aiPrediction ? (
                <div className="space-y-6">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                         <span className="text-3xl font-black text-white tracking-tighter">{aiPrediction.predictedGrade}</span>
                         <div className="absolute -bottom-2 px-2 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg">
                           Predicted
                         </div>
                      </div>
                      <div>
                         <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Confidence</p>
                         <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${aiPrediction.confidence * 100}%` }}
                                 className="h-full bg-primary"
                               />
                            </div>
                            <span className="text-xs font-bold text-white">{(aiPrediction.confidence * 100).toFixed(0)}%</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                         <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mb-2">Neural Reasoning</p>
                         <p className="text-xs text-white/80 leading-relaxed font-medium">{aiPrediction.reasoning}</p>
                      </div>

                      <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
                         <p className="text-[9px] text-primary/80 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Zap size={10} />
                           Recommendation
                         </p>
                         <p className="text-xs text-white/90 leading-relaxed font-bold italic">"{aiPrediction.recommendation}"</p>
                      </div>
                   </div>
                   
                   <button 
                     onClick={generatePrediction}
                     disabled={isPredicting}
                     className="mt-4 w-full py-3 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all"
                   >
                     Update Prediction Matrix
                   </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                   <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                      <Brain size={32} />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Neural Engine Offline</p>
                      <p className="text-[11px] text-white/70 max-w-[200px] leading-relaxed">Let AI analyze your performance trends to predict your future NECTA results.</p>
                   </div>
                   <button 
                     onClick={generatePrediction}
                     disabled={isPredicting || results.length === 0}
                     className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-30"
                   >
                     {isPredicting ? (
                       <>
                         <Loader2 size={16} className="animate-spin" />
                         Analyzing Matrix...
                       </>
                     ) : (
                       <>
                         <Zap size={16} />
                         Generate Forecast
                       </>
                     )}
                   </button>
                   {results.length === 0 && (
                     <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest">Requires results data to analyze</p>
                   )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recommended Resources */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Library size={14} className="text-primary" />
          Neural Library Suggestions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           {loadingResources ? (
             [1,2,3].map(i => (
               <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
             ))
           ) : recommendations.length > 0 ? (
             recommendations.map((title, idx) => (
               <motion.div 
                 key={idx}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm hover:border-primary/20 hover:shadow-md transition-all group flex flex-col justify-between"
               >
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Recommended</p>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">{title}</p>
                  <div className="mt-4 flex items-center justify-between">
                     <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Library Ref: #{1000 + idx}</span>
                     <ArrowRight size={14} className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
               </motion.div>
             ))
           ) : (
             <div className="col-span-full py-8 text-center bg-slate-50 border border-slate-100 border-dashed rounded-3xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No recommendations available yet</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
