import React, { useState, useEffect } from 'react';
import TopHeader from './components/TopHeader';
import CommentBank from './components/CommentBank';
import BghCommentBank from './components/BghCommentBank';
import { UserConfig, CommentItem } from './types';
import { MOCK_USERS_DB, INITIAL_COMMENTS } from './constants';

const LOCAL_STORAGE_KEY = 'vnedu_comment_bank_v5';

// Helper to guarantee every comment starts with subject 'Em'
const formatWithEmSubject = (text: string): string => {
  let content = (text || '').trim();
  content = content.replace(/^\[.*?\]\s*/, '');
  if (/^em\b/i.test(content)) {
    return 'Em' + content.slice(2);
  }
  if (!content) return content;
  const firstChar = content.charAt(0);
  const rest = content.slice(1);
  return `Em ${firstChar.toLowerCase()}${rest}`;
};

const App: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  // Active User / Role (Default to BGH: Ban Giám Hiệu)
  const [currentUser, setCurrentUser] = useState<UserConfig>(MOCK_USERS_DB['bgh']);

  // Selected Grade & Level Filter (Synced with Main View)
  const [selectedGrade, setSelectedGrade] = useState<string>('Khối 01');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');

  // Comment Bank State with LocalStorage Persistence
  const [comments, setComments] = useState<CommentItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('vnedu_comment_bank_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: CommentItem) => ({
            ...item,
            content: formatWithEmSubject(item.content)
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse comments from localStorage, using initial comments', e);
    }
    return INITIAL_COMMENTS;
  });

  // Save to LocalStorage whenever comments change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(comments));
    } catch (e) {
      console.error('Failed to save comments to localStorage', e);
    }
  }, [comments]);

  // Adjust grade when switching users if current grade is not assigned to that teacher
  useEffect(() => {
    const userGrades = Object.keys(currentUser.assignments);
    if (userGrades.length > 0 && !userGrades.includes(selectedGrade)) {
      setSelectedGrade(userGrades[0]);
    }
  }, [currentUser]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const isBgh = currentUser.role === 'bgh';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopHeader 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
        
        {/* Dynamic Page View based on Role */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isBgh ? (
            /* TRANG NGÂN HÀNG NHẬN XÉT BAN GIÁM HIỆU */
            <BghCommentBank 
              currentUser={currentUser}
              comments={comments}
              setComments={setComments}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedLevelFilter={selectedLevelFilter}
              setSelectedLevelFilter={setSelectedLevelFilter}
            />
          ) : (
            /* TRANG NGÂN HÀNG NHẬN XÉT CÁ NHÂN GIÁO VIÊN */
            <CommentBank 
              currentUser={currentUser} 
              comments={comments}
              setComments={setComments}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedLevelFilter={selectedLevelFilter}
              setSelectedLevelFilter={setSelectedLevelFilter}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;