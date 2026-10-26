import React from 'react';

// User & Role Config
export interface UserConfig {
  id: string;
  name: string;
  role: 'bgh' | 'admin' | 'subject_teacher' | 'homeroom_teacher';
  avatarColor: string;
  title: string;
  assignments: {
    [grade: string]: string[]; // Grade -> Array of Subjects
  };
}

// Comment Model with BGH Distribution Support
export interface CommentItem {
  id: number;
  grade: string;
  subject: string;
  term: string;
  level: 'T' | 'H' | 'C';
  content: string;
  // Ownership & Distribution Metadata:
  ownerId: string; // 'bgh' or teacherId ('user_a', 'user_b', etc.)
  source: 'bgh' | 'personal'; // 'bgh' = Ban Giám hiệu ban hành, 'personal' = GV tự soạn
  isAppliedToAllTeachers?: boolean; // For BGH: marked as pushed to teachers
  appliedTeacherIds?: string[]; // Teacher IDs who have received this comment
  appliedAt?: string; // Timestamp when pushed
}

// Excel Import Row Model
export interface ImportRow {
  index: number;
  grade: string;
  subject: string;
  term: string;
  level: string;
  content: string;
  isValid: boolean;
  error?: string;
}