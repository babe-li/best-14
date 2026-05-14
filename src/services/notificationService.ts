/**
 * Notification Service for SMS/Email simulation
 * SPDX-License-Identifier: Apache-2.0
 */

import { storageService } from './storageService';
import { User, Student, Exam } from '../types';
import { SCHOOL_CONFIG } from '../constants';

export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  EXAM_RESULTS = 'EXAM_RESULTS',
  FEE_REMINDER = 'FEE_REMINDER',
  UPCOMING_EXAM = 'UPCOMING_EXAM'
}

interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
  type: NotificationType;
}

export const notificationService = {
  /**
   * Helper to find recipient emails based on user or student role
   * Returns an array of emails for student and/or parent
   */
  async getRecipientEmails(studentId: string): Promise<string[]> {
    const db = storageService.getDB();
    const emails: string[] = [];
    
    // 1. Check if student has their own user account
    const studentUser = db.users.find(u => u.id === studentId);
    if (studentUser?.email) emails.push(studentUser.email);

    // 2. Check if student has a linked parent with an account
    const student = db.students.find(s => s.id === studentId);
    if (student?.parentId) {
      const parent = db.users.find(u => u.id === student.parentId);
      if (parent?.email) emails.push(parent.email);
    }

    return [...new Set(emails)]; // De-duplicate just in case
  },

  /**
   * Simulates sending an email by logging to DB and console
   */
  async sendEmail(payload: NotificationPayload) {
    console.group(`📧 [EMAIL SENT] to ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Body: ${payload.body}`);
    console.groupEnd();

    const db = storageService.getDB();
    const notificationLog = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...payload,
      sentAt: new Date().toISOString(),
      status: 'delivered'
    };

    const updatedNotifications = [...(db.notifications || []), notificationLog];
    storageService.saveDB({ ...db, notifications: updatedNotifications } as any);

    return true;
  },

  // Event specific triggers
  async notifyNewMessage(recipientId: string, senderName: string, snippet: string) {
    const db = storageService.getDB();
    const user = db.users.find(u => u.id === recipientId);
    if (!user?.email) return;

    await this.sendEmail({
      to: user.email,
      type: NotificationType.NEW_MESSAGE,
      subject: `New Message from ${senderName}`,
      body: `Hi, you have a new message on the school portal:\n\n"${snippet}"\n\nPlease log in to view the full message.`
    });
  },

  async notifyPayment(student: Student, amount: number) {
    const emails = await this.getRecipientEmails(student.id);
    
    for (const email of emails) {
      await this.sendEmail({
        to: email,
        type: NotificationType.PAYMENT_RECEIVED,
        subject: `Payment Confirmation: ${student.name}`,
        body: `Salutations,\n\nWe have successfully received a payment of TZS ${amount.toLocaleString()} for ${student.name} (Admission: ${student.admissionNo}).\n\nThis payment was processed to account: ${SCHOOL_CONFIG.paymentDetails.accountNumber} (${SCHOOL_CONFIG.paymentDetails.accountName}).\n\nNew Fee Balance: TZS ${student.feeBalance.toLocaleString()}.\n\nThank you for choosing our school.`
      });
    }
  },

  async notifyResults(student: Student, exam: Exam, marks: number, grade: string) {
    const emails = await this.getRecipientEmails(student.id);
    
    for (const email of emails) {
      await this.sendEmail({
        to: email,
        type: NotificationType.EXAM_RESULTS,
        subject: `Exam Results Released: ${exam.title}`,
        body: `Salutations,\n\nExam results for ${student.name} in ${exam.title} (${exam.subjectId}) have been published.\n\nScore: ${marks}/${exam.maxMarks}\nGrade: ${grade}\n\nYou can view the full academic report in the student registry by logging into your portal.`
      });
    }
  },

  async notifyUpcomingExam(student: Student, exam: Exam) {
    const emails = await this.getRecipientEmails(student.id);
    
    for (const email of emails) {
      await this.sendEmail({
        to: email,
        type: NotificationType.UPCOMING_EXAM,
        subject: `Upcoming Exam: ${exam.title} (${exam.subjectId})`,
        body: `Salutations,\n\nThis is a reminder for ${student.name} regarding the upcoming exam:\n\nTitle: ${exam.title}\nSubject: ${exam.subjectId}\nLevel: ${exam.classId}\nDate: ${new Date(exam.date).toLocaleDateString()}\n\nPlease ensure adequate preparation.`
      });
    }
  }
};
