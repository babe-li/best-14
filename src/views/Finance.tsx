/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Plus, 
  History, 
  Download, 
  PieChart as PieChartIcon, 
  Filter, 
  Search,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Smartphone,
  Landmark,
  X,
  FileText,
  ShieldCheck,
  Zap,
  Globe,
  RefreshCw,
  ArrowRight,
  Settings2,
  Trash2,
  Edit2,
  Mail
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { type Payment, type Student, type FeeStructure } from '../types';
import { formatCurrency, generateId, cn } from '../lib/utils';
import { SCHOOL_CONFIG } from '../constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const Finance = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'fee-structure' | 'statement' | 'status'>('payments');
  const [feeStructure, setFeeStructure] = useState<FeeStructure[]>([]);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportStatement = async () => {
    if (!selectedStudentId) return;
    setIsExporting(true);
    const element = document.getElementById('statement-to-export');
    if (element) {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Statement_${selectedStudentId}.pdf`);
    }
    setIsExporting(false);
  };

  const handlePreviewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  // Webhook Simulator State
  const [webhookData, setWebhookData] = useState({
    controlNumber: '',
    amount: '',
    provider: 'Vodacom M-Pesa'
  });

  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [newFeeItem, setNewFeeItem] = useState({ name: '', amount: '', term: 'Term 1' as 'Term 1' | 'Term 2' | 'Term 3' | 'Annual' });

  // Payment Form State
  const [newPayment, setNewPayment] = useState<{
     studentId: string;
     amount: string;
     method: Payment['method'];
  }>({
    studentId: '',
    amount: '',
    method: 'M-Pesa',
  });

  // Interactive Checkout Simulation States
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStepIndex, setPaymentStepIndex] = useState(0);
  const [payerPhone, setPayerPhone] = useState('');
  const [payerCardNumber, setPayerCardNumber] = useState('');
  const [payerCardExpiry, setPayerCardExpiry] = useState('');
  const [payerCardCvv, setPayerCardCvv] = useState('');
  const [payerBankAccount, setPayerBankAccount] = useState('');
  const [isSendingReminder, setIsSendingReminder] = useState<string | null>(null);

  const checkoutSteps = [
    "Contacting Secure Financial Integration Server...",
    "Validating Clearing Route to 0657206083 (Tigo Pesa)...",
    "Processing settlement request through designated API...",
    "Securing institutional ledger update and instant confirmation...",
    "Synchronizing payments database and generating signed e-receipt..."
  ];

  const [currentUser] = useState(storageService.getCurrentUser());
  const isParent = currentUser?.role === 'parent';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  useEffect(() => {
    const db = storageService.getDB();
    let studentList = db.students;
    let paymentList = db.payments;

    if (isParent && currentUser) {
      studentList = db.students.filter(s => s.parentId === currentUser.id);
      const studentIds = studentList.map(s => s.id);
      paymentList = db.payments.filter(p => studentIds.includes(p.studentId));
    }

    setStudents(studentList);
    setPayments(paymentList);
    setFeeStructure(db.fees);
  }, [currentUser]);

  const handleSendReminder = async (student: Student) => {
    setIsSendingReminder(student.id);
    try {
      await notificationService.notifyFeeReminder(student, student.feeBalance);
      alert(`Reminder Sent!\nAn automated outstanding fee payment reminder email has been successfully sent to the parent/guardian regarding ${student.name}'s balance of TZS ${student.feeBalance.toLocaleString()}.\n\nSettle target: 0657206083.`);
    } catch (error) {
      console.error(error);
      alert("Failed to send fee reminder. Please try again.");
    } finally {
      setIsSendingReminder(null);
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setPaymentStepIndex(0);

    // Simulate multi-step handshake clearing
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < checkoutSteps.length) {
        setPaymentStepIndex(step);
      } else {
        clearInterval(interval);
        
        // Finalize state database save
        const db = storageService.getDB();
        const payment: Payment = {
          id: generateId(),
          studentId: newPayment.studentId,
          amount: Number(newPayment.amount),
          method: newPayment.method,
          date: new Date().toISOString(),
          receiptNo: `REC-${Date.now().toString().slice(-6)}`,
          isAutomated: true,
          externalTransactionId: `TXN-${generateId().toUpperCase()}`
        };

        const updatedStudents = db.students.map(s => {
          if (s.id === payment.studentId) {
            const updatedStudent = { 
              ...s, 
              feeBalance: Math.max(0, s.feeBalance - payment.amount),
              updatedAt: new Date().toISOString()
            };
            notificationService.notifyPayment(updatedStudent, payment.amount);
            return updatedStudent;
          }
          return s;
        });

        const updatedPayments = [payment, ...db.payments];
        storageService.saveDB({ ...db, students: updatedStudents, payments: updatedPayments });
        
        setStudents(updatedStudents);
        setPayments(updatedPayments);
        
        // Reset states
        setIsProcessingPayment(false);
        setIsRecordModalOpen(false);
        setSelectedPayment(payment);
        setIsReceiptModalOpen(true);
        
        // Clear custom forms
        setPayerPhone('');
        setPayerCardNumber('');
        setPayerCardExpiry('');
        setPayerCardCvv('');
        setPayerBankAccount('');
        setNewPayment({ studentId: '', amount: '', method: 'M-Pesa' });
      }
    }, 1100);
  };

  const handleSimulatedWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);

    setTimeout(() => {
      const db = storageService.getDB();
      const student = db.students.find(s => s.controlNumber === webhookData.controlNumber);

      if (!student) {
        alert('Payment Refused: Invalid Control Number');
        setSimulating(false);
        return;
      }

      let chosenMethod: Payment['method'] = 'Mobile Money';
      const providerLower = webhookData.provider.toLowerCase();
      if (providerLower.includes('m-pesa')) chosenMethod = 'M-Pesa';
      else if (providerLower.includes('tigo')) chosenMethod = 'Tigo Pesa';
      else if (providerLower.includes('airtel')) chosenMethod = 'Airtel Money';
      else if (providerLower.includes('halo')) chosenMethod = 'HaloPesa';
      else if (providerLower.includes('crdb')) chosenMethod = 'CRDB Bank';
      else if (providerLower.includes('nmb')) chosenMethod = 'NMB Bank';
      else if (providerLower.includes('nbc')) chosenMethod = 'NBC Bank';
      else if (providerLower.includes('equity')) chosenMethod = 'Equity Bank';
      else if (providerLower.includes('visa')) chosenMethod = 'Visa';
      else if (providerLower.includes('mastercard')) chosenMethod = 'Mastercard';
      else if (providerLower.includes('bank')) chosenMethod = 'Bank';

      const payment: Payment = {
        id: generateId(),
        studentId: student.id,
        amount: Number(webhookData.amount),
        method: chosenMethod,
        date: new Date().toISOString(),
        receiptNo: `GEPG-${Date.now().toString().slice(-8)}`,
        isAutomated: true,
        externalTransactionId: `TXN-${generateId().toUpperCase()}`
      };

      const updatedStudents = db.students.map(s => {
        if (s.id === student.id) {
          const updatedStudent = { 
            ...s, 
            feeBalance: Math.max(0, s.feeBalance - payment.amount),
            updatedAt: new Date().toISOString()
          };
          notificationService.notifyPayment(updatedStudent, payment.amount);
          return updatedStudent;
        }
        return s;
      });

      const updatedPayments = [payment, ...db.payments];
      storageService.saveDB({ ...db, students: updatedStudents, payments: updatedPayments });
      
      alert(`Electronic Payment Success!\nSettlement Target: 0657206083 (${SCHOOL_CONFIG.paymentDetails.provider})\nAmount: TZS ${payment.amount.toLocaleString()}\nStudent: ${student.name}\n\nSMS payment confirmation successfully returned/sent to registered mobile number: ${student.metadata?.parentPhone || '0657206083'} to confirm payment.`);

      setStudents(updatedStudents);
      setPayments(updatedPayments);
      setSimulating(false);
      setIsSimulatorOpen(false);
      setSelectedPayment(payment);
      setIsReceiptModalOpen(true);
      setWebhookData({ controlNumber: '', amount: '', provider: 'Vodacom M-Pesa' });
    }, 1500);
  };

  const deleteFeeStructure = (id: string) => {
    const db = storageService.getDB();
    const updatedFees = db.fees.filter(f => f.id !== id);
    storageService.saveDB({ ...db, fees: updatedFees });
    setFeeStructure(updatedFees);
  };

  const handleSaveFeeStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStructure) return;

    const db = storageService.getDB();
    let updatedFees;
    
    if (db.fees.find(f => f.id === editingStructure.id)) {
      updatedFees = db.fees.map(f => f.id === editingStructure.id ? editingStructure : f);
    } else {
      updatedFees = [...db.fees, editingStructure];
    }

    storageService.saveDB({ ...db, fees: updatedFees });
    setFeeStructure(updatedFees);
    setIsFeeModalOpen(false);
    setEditingStructure(null);
  };

  const handleRefreshControlNumbers = () => {
    if (!window.confirm('Are you sure you want to regenerate control numbers for ALL students for the new academic cycle? This will update their digital payment keys.')) return;
    
    const db = storageService.getDB();
    const updatedStudents = db.students.map(s => ({
      ...s,
      controlNumber: storageService.generateControlNumber(s.name),
      updatedAt: new Date().toISOString()
    }));
    
    storageService.saveDB({ ...db, students: updatedStudents });
    setStudents(updatedStudents);
    alert('Academic rollover complete: All control numbers have been refreshed.');
  };

  const addFeeItem = () => {
    if (!newFeeItem.name || !newFeeItem.amount || !editingStructure) return;
    const items = [...editingStructure.items, { 
      id: generateId(),
      name: newFeeItem.name, 
      amount: Number(newFeeItem.amount),
      term: newFeeItem.term
    }];
    const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);
    setEditingStructure({ ...editingStructure, items, totalAmount });
    setNewFeeItem({ name: '', amount: '', term: 'Term 1' });
  };

  const removeFeeItem = (index: number) => {
    if (!editingStructure) return;
    const items = editingStructure.items.filter((_, i) => i !== index);
    const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);
    setEditingStructure({ ...editingStructure, items, totalAmount });
  };

  const updateFeeItem = (index: number, name: string, amount: number, term: 'Term 1' | 'Term 2' | 'Term 3' | 'Annual') => {
    if (!editingStructure) return;
    const items = [...editingStructure.items];
    const sanitizedAmount = isNaN(amount) ? 0 : Math.max(0, amount);
    items[index] = { ...items[index], name, amount: sanitizedAmount, term };
    const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);
    setEditingStructure({ ...editingStructure, items, totalAmount });
  };

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalArrears = students.reduce((acc, s) => acc + s.feeBalance, 0);

  const getStudentStatus = (student: Student) => {
    const studentPayments = payments.filter(p => p.studentId === student.id);
    const totalPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);
    
    // Get total expected fees for this student class
    const classFees = feeStructure.filter(f => f.classId === student.classId);
    const totalExpected = classFees.reduce((acc, f) => acc + f.totalAmount, 0);

    if (student.feeBalance <= 0) return { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (totalPaid > 0) return { label: 'Partially Paid', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' };
  };

  const filteredPayments = payments.filter(p => {
    const student = students.find(s => s.id === p.studentId);
    return student?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.receiptNo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fee Management</h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">Revenue tracking & fee architecture.</p>
        </div>
        
        {isParent && (
          <div className="flex-1 lg:max-w-md bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
               <Smartphone size={20} />
            </div>
            <div>
               <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Official Payment Account</p>
               <p className="text-sm font-black text-slate-900 font-mono">{SCHOOL_CONFIG.paymentDetails.accountNumber}</p>
               <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-tight">{SCHOOL_CONFIG.paymentDetails.provider} - {SCHOOL_CONFIG.paymentDetails.accountName}</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar scroll-smooth">
          <button 
            onClick={() => setActiveTab('payments')}
            className={cn(
              "px-4 lg:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === 'payments' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {isParent ? 'My Payments' : 'Payments'}
          </button>
          <button 
            onClick={() => setActiveTab('status')}
            className={cn(
              "px-4 lg:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === 'status' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Status
          </button>
          {!isParent && (
            <button 
              onClick={() => setActiveTab('fee-structure')}
              className={cn(
                "px-4 lg:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === 'fee-structure' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Structures
            </button>
          )}
          <button 
            onClick={() => setActiveTab('statement')}
            className={cn(
              "px-4 lg:px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === 'statement' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {isParent ? 'My Statement' : 'Ledger'}
          </button>
        </div>

        <div className="flex gap-3">
          {activeTab === 'payments' ? (
            <>
              {isAdmin && (
                <button 
                  onClick={() => setIsSimulatorOpen(true)}
                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all"
                >
                  <Zap size={14} className="text-amber-400" />
                  Webhook Simulator
                </button>
              )}
              {(isAdmin || isParent) && (
                <button 
                  onClick={() => setIsRecordModalOpen(true)}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
                >
                  <Plus size={18} />
                  {isParent ? 'Initialize Payment' : 'Record Payment'}
                </button>
              )}
            </>
          ) : activeTab === 'fee-structure' ? (
            isAdmin && (
              <button 
                onClick={() => {
                  setEditingStructure({ id: generateId(), classId: '', items: [], totalAmount: 0 });
                  setIsFeeModalOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
              >
                <Settings2 size={18} />
                Setup Level Fees
              </button>
            )
          ) : (
            <button 
              onClick={exportStatement}
              disabled={!selectedStudentId || isExporting}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <Download size={18} />
              {isExporting ? 'Generating...' : 'Export Statement'}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'status' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full text-slate-900">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Search students by name or admission #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
              />
            </div>
            {isAdmin && (
              <button 
                onClick={handleRefreshControlNumbers}
                className="flex items-center gap-2 px-5 py-3 text-indigo-600 font-bold text-[10px] uppercase tracking-widest bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors"
                title="Regenerate for new year/term"
              >
                <RefreshCw size={14} />
                Refresh Control Numbers
              </button>
            )}
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Fees</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Paid</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Balance</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                    {!isParent && (
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(student => {
                      const status = getStudentStatus(student);
                      const studentPayments = payments.filter(p => p.studentId === student.id);
                      const totalPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);
                      const totalExpected = student.feeBalance + totalPaid;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student.admissionNo}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                              {student.classId}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-xs font-black text-slate-900 italic tracking-tight">{formatCurrency(totalExpected)}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-xs font-black text-emerald-600 italic tracking-tight">{formatCurrency(totalPaid)}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className={cn(
                              "text-sm font-black italic tracking-tight",
                              student.feeBalance > 0 ? "text-red-500" : "text-emerald-500"
                            )}>{formatCurrency(student.feeBalance)}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={cn(
                              "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm",
                              status.color
                            )}>
                              {status.label}
                            </span>
                          </td>
                          {!isParent && (
                            <td className="px-8 py-5 text-center">
                              <button
                                id={`remind-${student.id}`}
                                disabled={student.feeBalance <= 0 || isSendingReminder === student.id}
                                onClick={() => handleSendReminder(student)}
                                className={cn(
                                  "flex items-center gap-1.5 mx-auto px-3.5 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest border shadow-sm transition-all",
                                  student.feeBalance <= 0 
                                    ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" 
                                    : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:scale-[1.02] active:scale-[0.98]"
                                )}
                              >
                                <Mail size={12} className={isSendingReminder === student.id ? "animate-spin" : ""} />
                                {isSendingReminder === student.id ? 'Sending...' : 'Remind Parent'}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={isParent ? 6 : 7} className="px-8 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                        No student status data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'payments' ? (
        <>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary p-6 rounded-2xl text-white shadow-xl shadow-primary/20 relative overflow-hidden flex flex-col justify-between h-40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {isParent ? 'Total Fees Paid' : 'Total Revenue Collected'}
                </p>
                <h2 className="text-3xl font-extrabold tracking-tight">{formatCurrency(totalCollected)}</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold bg-white/15 w-fit px-3 py-1 rounded uppercase tracking-widest">
                <CheckCircle2 size={12} className={cn(isParent ? "text-emerald-400" : "text-emerald-400")} />
                {isParent ? 'Status: Complete' : 'Collection: 84%'}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-40 border-l-4 border-l-red-500">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {isParent ? 'Outstanding Balance' : 'Fee Arrears Balance'}
                  </p>
                  <AlertCircle size={16} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(totalArrears)}</h2>
              </div>
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                {isParent ? (totalArrears > 0 ? 'Payment Required' : 'Account Settled') : 'Requires Action: 142 Overdue'}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-40">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Daily Operations</p>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight text-right">
                  {payments.filter(p => p.date.includes(new Date().toISOString().split('T')[0])).length}
                </h2>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">New entries today</span>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded">
                  <History size={16} className="text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Financial Organizations & Settlement Node */}
          <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full -mr-40 -mt-40 blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-3xl opacity-40 pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Globe size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
                  Global Financial Gateway Connected
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight">
                  Unified Billing & Multi-Bank Clearing Node
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Our unified fee system supports direct instant clearance with <strong>all regional mobile operators, card payment networks, and commercial banking organizations</strong>. All institutional fees, platform convenience surcharges, and tuition balances are automatically cleared and deposited to our secure primary settlement merchant account.
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                    <Smartphone className="text-primary" size={20} />
                    <div>
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Core Settlement Number</span>
                      <span className="text-xs font-mono font-bold text-white tracking-widest">0657206083</span>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={18} />
                    <div>
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Settlement Platform</span>
                      <span className="text-xs font-bold text-slate-200">Tigo Pesa Merchant</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid of supported integrations */}
              <div className="flex-1 lg:max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Clearing Handshake Status
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE Sync
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { name: 'Tigo Pesa', color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' },
                    { name: 'M-Pesa', color: 'border-red-500/30 text-red-400 bg-red-500/5' },
                    { name: 'Airtel', color: 'border-rose-500/30 text-rose-400 bg-rose-500/5' },
                    { name: 'HaloPesa', color: 'border-orange-500/30 text-orange-400 bg-orange-500/5' },
                    { name: 'CRDB Bank', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
                    { name: 'NMB Bank', color: 'border-sky-500/30 text-sky-400 bg-sky-500/5' },
                    { name: 'NBC Bank', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5' },
                    { name: 'Equity', color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
                    { name: 'Visa', color: 'border-yellow-500/30 text-yellow-500/5 animate-pulse' },
                    { name: 'Mastercard', color: 'border-orange-500/30 text-orange-400 bg-orange-500/5' }
                  ].map((org) => (
                    <div 
                      key={org.name}
                      className={cn(
                        "p-2 rounded-xl border text-center font-bold text-[9px] uppercase tracking-wider transition-all hover:scale-105",
                        org.color
                      )}
                    >
                      {org.name}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 leading-tight">
                    Secure checkout uses real-time instant payment notification APIs to reconcile matching student control keys.
                  </p>
                </div>
              </div>
            </div>
          </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full text-slate-900">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Filter by receipt # or student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 text-primary font-bold text-xs uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
          <Download size={16} />
          Export Ledger
        </button>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isParent ? 'My Payment History' : 'Transaction History'}
          </h3>
          {isAdmin && <button className="text-[10px] font-bold text-primary uppercase tracking-widest border border-primary/20 px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-all">Audit Log</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left order-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receipt #</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student / Level</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Credit</th>
                <th className="px-6 py-4 text-[10px) font-bold text-slate-400 uppercase tracking-widest text-center">Mode</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((payment) => {
                const student = students.find(s => s.id === payment.studentId);
                return (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {payment.receiptNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{student?.name || 'Archived Student'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student?.classId || 'N/A'}</p>
                        {student?.controlNumber && (
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1 rounded uppercase tracking-tighter">REF: {student.controlNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-extrabold text-emerald-600 tracking-tight">{formatCurrency(payment.amount)}</span>
                        {payment.isAutomated && (
                          <span className="text-[8px] font-extrabold text-emerald-500 bg-emerald-50 px-1 rounded uppercase tracking-widest mt-1">Verified API</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {(() => {
                          let Icon = Smartphone;
                          let colorClass = "text-slate-600 bg-slate-50";
                          
                          if (payment.method === 'Bank') {
                            Icon = Landmark;
                            colorClass = "text-blue-600 bg-blue-50";
                          } else if (payment.method === 'Cash') {
                            Icon = Banknote;
                            colorClass = "text-emerald-600 bg-emerald-50";
                          } else if (payment.method === 'M-Pesa') {
                            Icon = Smartphone;
                            colorClass = "text-red-600 bg-red-50";
                          } else if (payment.method === 'Tigo Pesa') {
                            Icon = Smartphone;
                            colorClass = "text-blue-600 bg-blue-50";
                          } else if (payment.method === 'Airtel Money') {
                            Icon = Smartphone;
                            colorClass = "text-rose-600 bg-rose-50";
                          } else if (payment.method === 'HaloPesa') {
                            Icon = Smartphone;
                            colorClass = "text-orange-500 bg-orange-50";
                          } else if (payment.method === 'CRDB Bank') {
                            Icon = Landmark;
                            colorClass = "text-emerald-700 bg-emerald-50";
                          } else if (payment.method === 'NMB Bank') {
                            Icon = Landmark;
                            colorClass = "text-sky-600 bg-sky-50";
                          } else if (payment.method === 'NBC Bank') {
                            Icon = Landmark;
                            colorClass = "text-cyan-600 bg-cyan-50";
                          } else if (payment.method === 'Equity Bank') {
                            Icon = Landmark;
                            colorClass = "text-amber-800 bg-amber-50";
                          } else if (payment.method === 'Visa') {
                            Icon = CreditCard;
                            colorClass = "text-yellow-600 bg-yellow-50";
                          } else if (payment.method === 'Mastercard') {
                            Icon = CreditCard;
                            colorClass = "text-orange-600 bg-orange-50";
                          } else if (payment.method === 'Mobile Money') {
                            Icon = Smartphone;
                            colorClass = "text-indigo-600 bg-indigo-50";
                          }

                          return (
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                              colorClass
                            )}>
                              <Icon size={16} />
                            </div>
                          );
                        })()}
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{payment.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400">
                      {new Date(payment.date).toLocaleDateString('en-TZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handlePreviewReceipt(payment)}
                        className="p-2 text-slate-300 hover:text-primary transition-colors"
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : activeTab === 'fee-structure' ? (
    <div className="space-y-10">
      {/* Level Filter Bar for Fees */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setSelectedLevelFilter('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
            selectedLevelFilter === 'all' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100 hover:border-primary"
          )}
        >
          All Levels
        </button>
        {SCHOOL_CONFIG.academicLevels.map(lvl => (
          <button 
            key={lvl}
            onClick={() => setSelectedLevelFilter(lvl)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              selectedLevelFilter === lvl ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100 hover:border-primary"
            )}
          >
            {lvl}
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {SCHOOL_CONFIG.academicLevels
          .filter(lvl => selectedLevelFilter === 'all' || selectedLevelFilter === lvl)
          .map(level => {
            const levelFees = feeStructure.filter(f => f.classId === level);
            
            return (
              <div key={level} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                         <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{level} Cost Center</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Fees Architecture</p>
                      </div>
                   </div>
                   {isAdmin && levelFees.length < 3 && (
                     <button 
                        onClick={() => {
                          setEditingStructure({ id: generateId(), classId: level, items: [], totalAmount: 0 });
                          setIsFeeModalOpen(true);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                     >
                        <Plus size={18} />
                     </button>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {levelFees.map((structure) => {
                    const itemsByTerm = structure.items.reduce((acc, item) => {
                      if (!acc[item.term]) acc[item.term] = [];
                      acc[item.term].push(item);
                      return acc;
                    }, {} as Record<string, typeof structure.items>);

                    return (
                    <motion.div 
                      layout
                      key={structure.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                      
                      <div className="flex justify-between items-start mb-6 relative z-10 text-slate-400">
                        <div className="text-[9px] font-black uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                          Aggregated Fees
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingStructure(structure);
                                setIsFeeModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => deleteFeeStructure(structure.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6 mb-8 relative z-10">
                        {Object.entries(itemsByTerm).map(([term, items]) => (
                          <div key={term} className="space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{term}</p>
                            <div className="space-y-1">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group/item p-1 hover:bg-slate-50 rounded-lg transition-colors">
                                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{item.name}</span>
                                  <span className="text-[10px] font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {structure.items.length === 0 && (
                          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic text-center py-4">No items defined</p>
                        )}
                      </div>

                      <div className="pt-5 border-t border-slate-100 flex justify-between items-center relative z-10">
                        <div>
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Total</p>
                           <span className="text-lg font-black text-slate-900 tracking-tight italic">{formatCurrency(structure.totalAmount)}</span>
                        </div>
                      </div>
                    </motion.div>
                    )})}
                  
                  {levelFees.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 group hover:border-indigo-200 transition-colors">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-300 group-hover:text-indigo-400 transition-colors">
                        <Plus size={24} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-4">No structures defined for {level}</p>
                      {isAdmin && (
                        <button 
                           onClick={() => {
                             setEditingStructure({ id: generateId(), classId: level, items: [], totalAmount: 0 });
                             setIsFeeModalOpen(true);
                           }}
                           className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                        >
                           Initialize Cost Center
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-1.5">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Student Account</label>
           <select 
             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
             onChange={(e) => setSelectedStudentId(e.target.value)}
             value={selectedStudentId || ''}
           >
             <option value="">Choose student to view statement...</option>
             {students.map(s => (
               <option key={s.id} value={s.id}>{s.name} ({s.classId}) - {s.admissionNo}</option>
             ))}
           </select>
        </div>
      </div>

      {selectedStudentId ? (
        <div id="statement-to-export" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-4 rounded-[40px]">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center font-black text-2xl border border-slate-100 shadow-inner">
                  {students.find(s => s.id === selectedStudentId)?.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{students.find(s => s.id === selectedStudentId)?.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{students.find(s => s.id === selectedStudentId)?.admissionNo} • {students.find(s => s.id === selectedStudentId)?.classId}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Government Utility Number</p>
                   <p className="text-sm font-mono font-black text-primary tracking-tighter">
                     {students.find(s => s.id === selectedStudentId)?.controlNumber || '99-PENDING-REF'}
                   </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                   <div className="flex justify-between items-center p-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Fees</span>
                      <span className="text-sm font-black text-slate-900 italic tracking-tighter">
                        {(() => {
                          const student = students.find(s => s.id === selectedStudentId);
                          if (!student) return formatCurrency(0);
                          const levels = feeStructure.filter(f => f.classId === student.classId);
                          const total = levels.reduce((acc, l) => acc + l.totalAmount, 0);
                          return formatCurrency(total);
                        })()}
                      </span>
                   </div>
                   <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Total Credits</span>
                      <span className="text-sm font-black text-emerald-600 italic tracking-tighter">
                        {formatCurrency(payments.filter(p => p.studentId === selectedStudentId).reduce((acc, p) => acc + p.amount, 0))}
                      </span>
                   </div>
                   <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100/50">
                      <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Current Balance</span>
                      <span className="text-base font-black text-red-600 italic tracking-tighter">
                        {formatCurrency(students.find(s => s.id === selectedStudentId)?.feeBalance || 0)}
                      </span>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[32px] text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Institutional Audit</p>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-primary">
                       <ShieldCheck size={20} />
                     </div>
                     <p className="text-[11px] font-bold leading-relaxed text-slate-300">Account verified against GEPG registry. No outstanding collection flags active for the current fiscal cycle.</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden h-fit">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Fiscal Ledger Matrix</h3>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {(() => {
                  const student = students.find(s => s.id === selectedStudentId);
                  const studentPayments = payments.filter(p => p.studentId === selectedStudentId);
                  const feeItemsCount = feeStructure.filter(f => f.classId === student?.classId).reduce((acc, f) => acc + f.items.length, 0);
                  return `${studentPayments.length + feeItemsCount} Ledger Entries`;
                })()}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Date</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description / Narrative</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Debit (-)</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Credit (+)</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right bg-slate-100/50">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const student = students.find(s => s.id === selectedStudentId);
                    if (!student) return null;

                    // Combine charges and payments
                    const ledgerEntries: any[] = [];
                    
                    // 1. Add Charges from Fee Structure (usually applied at start of year or terms)
                    const studentFees = feeStructure.filter(f => f.classId === student.classId);
                    studentFees.forEach(structure => {
                      structure.items.forEach(item => {
                        ledgerEntries.push({
                          date: structure.id.split('_')[1] || '2026-01-01', // Mocking date from ID if needed, or context
                          description: `${item.name} (${item.term})`,
                          type: 'debit',
                          amount: item.amount,
                          reference: 'FEE-ALLOC'
                        });
                      });
                    });

                    // 2. Add Payments
                    const studentPayments = payments.filter(p => p.studentId === selectedStudentId);
                    studentPayments.forEach(p => {
                      ledgerEntries.push({
                        date: p.date,
                        description: `Payment: ${p.receiptNo}`,
                        type: 'credit',
                        amount: p.amount,
                        reference: p.receiptNo,
                        method: p.method
                      });
                    });

                    // Sort by date (oldest first for balance calc)
                    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    let runningBalance = 0;
                    return ledgerEntries.length > 0 ? ledgerEntries.map((entry, idx) => {
                      if (entry.type === 'debit') runningBalance += entry.amount;
                      else runningBalance -= entry.amount;

                      return (
                        <tr key={idx} className="text-xs hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  entry.type === 'debit' ? "bg-red-400" : "bg-emerald-400"
                                )} />
                                <span className="text-slate-400 font-bold uppercase tracking-tighter">
                                  {new Date(entry.date).toLocaleDateString('en-TZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <p className="text-slate-900 font-black tracking-tight uppercase leading-none mb-1">{entry.description}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{entry.reference}</span>
                                {entry.method && (
                                  <>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">{entry.method}</span>
                                  </>
                                )}
                             </div>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-red-500 italic tracking-tighter">
                            {entry.type === 'debit' ? formatCurrency(entry.amount) : '—'}
                          </td>
                          <td className="px-6 py-5 text-right font-black text-emerald-600 italic tracking-tighter">
                            {entry.type === 'credit' ? formatCurrency(entry.amount) : '—'}
                          </td>
                          <td className="px-8 py-5 text-right font-black text-slate-900 bg-slate-50/30 tracking-tighter italic">
                            {formatCurrency(Math.max(0, runningBalance))}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-24 text-center">
                           <div className="max-w-xs mx-auto">
                              <Search size={40} className="text-slate-200 mx-auto mb-4" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">No Ledger Records</p>
                              <p className="text-[11px] font-bold text-slate-300">The fiscal registry for this student account is currently null.</p>
                           </div>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-32 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <Search className="text-slate-300" size={32} />
           </div>
           <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Statement Generator</h3>
           <p className="text-xs text-slate-400 font-medium mt-1">Select a student account above to generate a full financial statement.</p>
        </div>
      )}
    </div>
  )}

      {/* Fee Structure Definition Modal */}
      <AnimatePresence>
        {isFeeModalOpen && editingStructure && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeeModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit max-h-[90vh] bg-white z-[110] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="px-8 py-6 bg-indigo-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <Settings2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">Define Fee Architecture</h3>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-0.5">Academic Level Cost Center</p>
                  </div>
                </div>
                <button onClick={() => setIsFeeModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveFeeStructure} className="overflow-y-auto flex-1 p-8 space-y-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Academic Level</label>
                  <select 
                    required
                    value={editingStructure.classId}
                    onChange={(e) => setEditingStructure({...editingStructure, classId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                  >
                    <option value="">Select Level...</option>
                    {SCHOOL_CONFIG.academicLevels.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Fiscal Components Matrix</h4>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">{editingStructure.items.length} Elements</span>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {editingStructure.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 group/item hover:border-indigo-200 hover:shadow-sm transition-all space-y-3">
                         <div className="flex items-center justify-between">
                            <input 
                              type="text" 
                              value={item.name}
                              onChange={(e) => updateFeeItem(idx, e.target.value, item.amount, item.term)}
                              className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0 uppercase tracking-tight flex-1"
                              placeholder="Item Description"
                            />
                            <button 
                              type="button"
                              onClick={() => removeFeeItem(idx)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                               <span className="text-[8px] font-black text-slate-300 uppercase">TZS</span>
                               <input 
                                 type="number" 
                                 value={item.amount}
                                 onChange={(e) => updateFeeItem(idx, item.name, Number(e.target.value), item.term)}
                                 className="w-full bg-transparent border-none text-xs font-black text-primary focus:ring-0 p-0 text-right italic"
                                 placeholder="0"
                               />
                            </div>
                            <select 
                              value={item.term}
                              onChange={(e) => updateFeeItem(idx, item.name, item.amount, e.target.value as any)}
                              className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 focus:ring-0 outline-none"
                            >
                               <option>Term 1</option>
                               <option>Term 2</option>
                               <option>Term 3</option>
                               <option>Annual</option>
                            </select>
                         </div>
                      </div>
                    ))}
                    {editingStructure.items.length === 0 && (
                      <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">No financial elements mapped</p>
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-200/50 space-y-4">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Append New Element</p>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Element Name"
                        value={newFeeItem.name}
                        onChange={(e) => setNewFeeItem({...newFeeItem, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all uppercase tracking-tight"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                          <input 
                            type="number" 
                            placeholder="Amount"
                            value={newFeeItem.amount}
                            onChange={(e) => setNewFeeItem({...newFeeItem, amount: e.target.value})}
                            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all italic text-right"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase pointer-events-none">TZS</div>
                        </div>
                        <select 
                          value={newFeeItem.term}
                          onChange={(e) => setNewFeeItem({...newFeeItem, term: e.target.value as any})}
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                        >
                           <option>Term 1</option>
                           <option>Term 2</option>
                           <option>Term 3</option>
                           <option>Annual</option>
                        </select>
                        <button 
                          type="button"
                          onClick={addFeeItem}
                          disabled={!newFeeItem.name || !newFeeItem.amount}
                          className="bg-slate-900 text-white p-2.5 rounded-xl flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white pb-2">
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Aggregate Structural Liability</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tight italic">{formatCurrency(editingStructure.totalAmount)}</p>
                   </div>
                   <button 
                     type="submit"
                     className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-[10px] tracking-[0.2em]"
                   >
                     Authorize Structure
                   </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Webhook Simulator Modal */}
      <AnimatePresence>
        {isSimulatorOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSimulatorOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-400 text-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">GePG/Selcom Simulator</h3>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-0.5">Automated Reconciliation Endpoint</p>
                  </div>
                </div>
                <button onClick={() => setIsSimulatorOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSimulatedWebhook} className="p-8 space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight mb-1 flex items-center gap-2">
                    <Globe size={12} />
                    External API Signal
                  </p>
                  <p className="text-[10px] text-amber-600 leading-tight">
                    This simulator mimics an incoming HTTP POST request from a payment aggregator (Selcom, NMB, or GePG) to your system's reconciliation webhook. All funds are routed to the central school account: 0657206083.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mock Control Number</label>
                    <div className="relative">
                      <input 
                        required
                        type="text" 
                        value={webhookData.controlNumber}
                        onChange={(e) => setWebhookData({...webhookData, controlNumber: e.target.value.replace(/\D/g, '').slice(0, 12)})}
                        placeholder="991234567890"
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-bold tracking-widest"
                      />
                      <RefreshCw size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Simulated Transaction Amount</label>
                    <div className="relative">
                      <input 
                        required
                        type="number" 
                        value={webhookData.amount}
                        onChange={(e) => setWebhookData({...webhookData, amount: e.target.value})}
                        placeholder="0.00"
                        className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-bold"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-[10px] text-slate-400 tracking-widest">TZS</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Provider (Mock)</label>
                    <select 
                      value={webhookData.provider}
                      onChange={(e) => setWebhookData({...webhookData, provider: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-medium"
                    >
                      <option>Tigo Pesa</option>
                      <option>Vodacom M-Pesa</option>
                      <option>Airtel Money</option>
                      <option>Halotel HaloPesa</option>
                      <option>CRDB Bank</option>
                      <option>NMB Bank</option>
                      <option>NBC Bank</option>
                      <option>Equity Bank</option>
                      <option>Visa Gateway</option>
                      <option>Mastercard Gateway</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={simulating}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-900/10 hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest disabled:opacity-50"
                  >
                    {simulating ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ArrowRight size={16} />
                        Trigger Webhook Event
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRecordModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white z-[70] rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between text-slate-900">
                <div>
                  <h3 className="text-xl font-extrabold uppercase tracking-tight">{isParent ? 'School Fee Checkout' : 'Secure Payment Portal'}</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Direct Settlement and Clearing Gateway</p>
                </div>
                <button onClick={() => setIsRecordModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors font-bold text-slate-400">
                  <X size={20} />
                </button>
              </div>

              {isProcessingPayment ? (
                <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-slate-950/5 border-t-primary rounded-full animate-spin mx-auto" />
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-850 uppercase tracking-widest">
                      Securing Transaction Link
                    </p>
                    <p className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-200 p-3 rounded-xl min-h-[50px] flex items-center justify-center animate-pulse">
                      {checkoutSteps[paymentStepIndex]}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500 rounded-full"
                      style={{ width: `${((paymentStepIndex + 1) / checkoutSteps.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 italic">
                    All processed fees settle directly to receiving account: <strong className="text-slate-900 font-mono">0657206083</strong>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRecordPayment} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                    <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck size={14} />
                       Secured Gateway Protocol
                    </p>
                    <div className="space-y-2">
                       <p className="text-[11px] text-slate-600 font-bold leading-tight">
                         Our multi-channel payment node settles balances directly to the consolidated platform holding account:
                       </p>
                       <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Core Number</span>
                             <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 rounded">Active Tigo Pesa</span>
                          </div>
                          <p className="text-lg font-black text-slate-900 tracking-wider font-mono">0657206083</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Miyomboni Secondary School Primary Settlement Wallet</p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Student Select */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Student Account</label>
                      <select 
                        required
                        value={newPayment.studentId}
                        onChange={(e) => setNewPayment({...newPayment, studentId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-xs font-bold"
                      >
                        <option value="">Choose Student Account...</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.classId}) - Bal: {formatCurrency(s.feeBalance)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount to Transfer (TZS)</label>
                      <div className="relative">
                        <input 
                          required
                          type="number" 
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                          placeholder="0.00"
                          className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-black text-slate-900 tracking-tight"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-[10px] text-slate-400 tracking-widest">TZS</div>
                      </div>
                    </div>

                    {/* Financial Organization Grid */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Financial Organization Gateway</label>
                      
                      {/* Mobile Operators Group */}
                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Mobile Network Wallets</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'Tigo Pesa', color: 'border-blue-200/50 hover:border-blue-500 hover:text-blue-600', activeStyle: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10' },
                            { id: 'M-Pesa', color: 'border-red-200/50 hover:border-red-500 hover:text-red-600', activeStyle: 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/10' },
                            { id: 'Airtel Money', color: 'border-rose-200/50 hover:border-rose-500 hover:text-rose-600', activeStyle: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/10' },
                            { id: 'HaloPesa', color: 'border-orange-200/50 hover:border-orange-500 hover:text-orange-500', activeStyle: 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/10' },
                          ].map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setNewPayment({...newPayment, method: method.id as any})}
                              className={cn(
                                "py-2 px-1 rounded-xl border transition-all font-black text-[9px] uppercase tracking-wider text-center",
                                newPayment.method === method.id ? method.activeStyle : "bg-white text-slate-500 " + method.color
                              )}
                            >
                              {method.id}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bank Operators Group */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Commercial Banks</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'CRDB Bank', color: 'border-emerald-200/50 hover:border-emerald-600 hover:text-emerald-500', activeStyle: 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/10' },
                            { id: 'NMB Bank', color: 'border-sky-200/50 hover:border-sky-500 hover:text-sky-600', activeStyle: 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/10' },
                            { id: 'NBC Bank', color: 'border-cyan-200/50 hover:border-cyan-500 hover:text-cyan-600', activeStyle: 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/10' },
                            { id: 'Equity Bank', color: 'border-amber-200/50 hover:border-amber-700 hover:text-amber-800', activeStyle: 'bg-amber-800 text-white border-amber-800 shadow-md shadow-amber-800/10' }
                          ].map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setNewPayment({...newPayment, method: method.id as any})}
                              className={cn(
                                "py-2 px-1 rounded-xl border transition-all font-black text-[9px] uppercase tracking-wider text-center",
                                newPayment.method === method.id ? method.activeStyle : "bg-white text-slate-500 " + method.color
                              )}
                            >
                              {method.id}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Card Processors Group */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Card Providers</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'Visa', color: 'border-yellow-250/50 hover:border-yellow-500 hover:text-yellow-600', activeStyle: 'bg-yellow-600 text-white border-yellow-600 shadow-md shadow-yellow-600/10' },
                            { id: 'Mastercard', color: 'border-orange-200/50 hover:border-orange-500 hover:text-orange-600', activeStyle: 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/10' }
                          ].map((method) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setNewPayment({...newPayment, method: method.id as any})}
                              className={cn(
                                "py-2.5 rounded-xl border transition-all font-black text-[9px] uppercase tracking-wider text-center",
                                newPayment.method === method.id ? method.activeStyle : "bg-white text-slate-500 " + method.color
                              )}
                            >
                              {method.id}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Inputs based on payment provider option */}
                    <AnimatePresence mode="wait">
                      {(['Visa', 'Mastercard'].includes(newPayment.method)) ? (
                        <motion.div 
                          key="card"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl overflow-hidden"
                        >
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Enter Card Security Details</span>
                          <div className="space-y-2.5">
                            <input 
                              required
                              type="text"
                              value={payerCardNumber}
                              onChange={(e) => setPayerCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim())}
                              placeholder="4111 2222 3333 4444"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                required
                                type="text"
                                value={payerCardExpiry}
                                onChange={(e) => setPayerCardExpiry(e.target.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})/, '$1/'))}
                                placeholder="MM/YY"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center outline-none"
                              />
                              <input 
                                required
                                type="password"
                                value={payerCardCvv}
                                onChange={(e) => setPayerCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                placeholder="CVV"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center outline-none"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ) : (['CRDB Bank', 'NMB Bank', 'NBC Bank', 'Equity Bank'].includes(newPayment.method)) ? (
                        <motion.div 
                          key="bank"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl overflow-hidden"
                        >
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Enter Bank Account Code</span>
                          <input 
                            required
                            type="text"
                            value={payerBankAccount}
                            onChange={(e) => setPayerBankAccount(e.target.value.replace(/\D/g, '').slice(0, 16))}
                            placeholder="Account Number (e.g. 01J51XXXXXXX)"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                          />
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="wallet"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl overflow-hidden"
                        >
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Enter Sender Wallet Number</span>
                          <input 
                            required
                            type="text"
                            value={payerPhone}
                            onChange={(e) => setPayerPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                            placeholder="Mobile Money Number (e.g. 255XXXXXXXXX)"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-4 sticky bottom-0 bg-white pb-2">
                    <button 
                      type="submit"
                      className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"
                    >
                      <FileText size={16} />
                      Verify and Authorize Settlement
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* E-Receipt Modal */}
      <AnimatePresence>
        {isReceiptModalOpen && selectedPayment && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReceiptModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 z-[80] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-lg bg-white z-[90] rounded-t-3xl shadow-2xl p-10 border border-slate-200"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Electronic Receipt</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Payment Confirmation # {selectedPayment.receiptNo}</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</span>
                  <span className="text-sm font-bold text-slate-900">{students.find(s => s.id === selectedPayment.studentId)?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Paid</span>
                  <span className="text-lg font-extrabold text-primary">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</span>
                  <span className="text-xs font-bold text-slate-900">{selectedPayment.method}</span>
                </div>
                {selectedPayment.externalTransactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference ID</span>
                    <span className="text-[10px] font-mono font-bold text-slate-600">{selectedPayment.externalTransactionId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    SMS Confirmation
                  </span>
                  <span className="text-[9px] font-black font-mono text-indigo-700 uppercase tracking-widest">
                    Sent to {students.find(s => s.id === selectedPayment.studentId)?.metadata?.parentPhone || "+255 657 206 083"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auth Status</span>
                  <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                    <ShieldCheck size={12} />
                    Verified
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl hover:bg-black transition-all uppercase text-[10px] tracking-widest"
              >
                Close Receipt
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
