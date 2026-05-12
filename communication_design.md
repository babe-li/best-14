# Parent-Teacher Communication Module Design

## 1. Overview
The Communication Module provides a secure, channeled environment for pedagogical and administrative discourse between parents and faculty. It replaces informal communication (WhatsApp/SMS) with a tracked, professional audit trail.

## 2. Core Features
- **Contextual Messaging**: Messages are linked to a specific student profile, allowing teachers to see the academic context (grades/attendance) while chatting.
- **Assigned Liaison Protocol**: Administrators can assign a specific "Subject Teacher" or "Class Master" to be the primary point of contact for a student's parent.
- **Read Receipts & Notifications**: Real-time status indicators for message delivery and "Read" status.
- **Inquiry Management**: A dashboard for teachers to see pending parent queries across all their students.

## 3. Data Schema
### Message Object
```typescript
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  studentId?: string; // Links chat to a student context
}
```

## 4. Implementation Strategy
1. **Teacher Assignments**: Stored within the `Student` object or a separate `Liaison` table. When a parent logs in, the system queries for all teachers assigned to their children.
2. **Push Notifications**: (Future Phase) Deep integration with the Tanzanian SMS Gateway to send "New Message" alerts to parents in rural areas without consistent internet.
3. **Audit Trail**: Every message is immutable and timestamped, satisfying institutional transparency requirements.
