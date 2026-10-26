import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserConfig, CommentItem, ImportRow } from '../types';
import { 
  Download, Upload, Search, Trash2, Edit, Plus, Info, Check, X, Save, 
  AlertTriangle, ShieldCheck, UserCheck, Sparkles 
} from 'lucide-react';
import CommentBankImportModal from './CommentBankImportModal';
import * as XLSX from 'xlsx';

interface CommentBankProps {
  currentUser: UserConfig;
  comments: CommentItem[];
  setComments: React.Dispatch<React.SetStateAction<CommentItem[]>>;
  selectedGrade?: string;
  setSelectedGrade?: (grade: string) => void;
  selectedLevelFilter?: string;
  setSelectedLevelFilter?: (level: string) => void;
}

const CommentBank: React.FC<CommentBankProps> = ({ 
  currentUser, 
  comments, 
  setComments,
  selectedGrade: propSelectedGrade,
  setSelectedGrade: propSetSelectedGrade,
  selectedLevelFilter: propSelectedLevelFilter,
  setSelectedLevelFilter: propSetSelectedLevelFilter
}) => {
  // State
  const [internalGrade, setInternalGrade] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [term, setTerm] = useState('Giữa kỳ 1');
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [searchTerm, setSearchTerm] = useState('');
  const [internalLevelFilter, setInternalLevelFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'bgh' | 'personal'>('ALL');

  // Controlled or uncontrolled grade
  const selectedGrade = propSelectedGrade !== undefined ? propSelectedGrade : internalGrade;
  const setSelectedGrade = propSetSelectedGrade !== undefined ? propSetSelectedGrade : setInternalGrade;

  // Controlled or uncontrolled level filter
  const selectedLevelFilter = propSelectedLevelFilter !== undefined ? propSelectedLevelFilter : internalLevelFilter;
  const setSelectedLevelFilter = propSetSelectedLevelFilter !== undefined ? propSetSelectedLevelFilter : setInternalLevelFilter;

  // Inline Add State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLevel, setNewLevel] = useState<'T' | 'H' | 'C'>('T');
  const [newContent, setNewContent] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Inline Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLevel, setEditLevel] = useState<'T' | 'H' | 'C'>('T');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  
  // Import/Export States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Get available Grades based on User Assignments
  const availableGrades = useMemo(() => {
    return Object.keys(currentUser.assignments).sort();
  }, [currentUser]);

  // Update Subject List when Grade Changes
  const availableSubjects = useMemo(() => {
    if (!selectedGrade) return [];
    return currentUser.assignments[selectedGrade] || [];
  }, [selectedGrade, currentUser]);

  // Auto-select Grade if user only has 1 or current is invalid
  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.includes(selectedGrade)) {
      setSelectedGrade(availableGrades[0]);
    }
  }, [availableGrades, selectedGrade, setSelectedGrade]);

  // Auto-select Subject if only 1 exists for the grade
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
      }
    } else {
      setSelectedSubject('');
    }
  }, [availableSubjects, selectedGrade, selectedSubject]);

  // Filter Comments accessible to this specific teacher:
  // 1. Comments applied by BGH to this teacher
  // 2. Personal comments created by this teacher
  const teacherAccessibleComments = useMemo(() => {
    return comments.filter(c => {
      // 1. Personal comments created by this teacher
      if (c.ownerId === currentUser.id) return true;
      
      // 2. Comments from BGH: automatically poured into any teacher who teaches this grade & subject!
      if (c.source === 'bgh') {
        const teacherSubjects = currentUser.assignments[c.grade] || [];
        return teacherSubjects.includes(c.subject);
      }

      return false;
    });
  }, [comments, currentUser]);

  // Context Comments (matching Grade & Subject)
  const contextComments = useMemo(() => {
    return teacherAccessibleComments.filter(c => {
      const matchGrade = !selectedGrade || c.grade === selectedGrade;
      const matchSubject = !selectedSubject || c.subject === selectedSubject;
      return matchGrade && matchSubject;
    });
  }, [teacherAccessibleComments, selectedGrade, selectedSubject]);

  // Count by level and source in current context
  const contextCounts = useMemo(() => {
    return {
      all: contextComments.length,
      T: contextComments.filter(c => c.level === 'T').length,
      H: contextComments.filter(c => c.level === 'H').length,
      C: contextComments.filter(c => c.level === 'C').length,
      bgh: contextComments.filter(c => c.source === 'bgh').length,
      personal: contextComments.filter(c => c.source === 'personal').length
    };
  }, [contextComments]);

  // Filter AND Sort Comments
  const processedComments = useMemo(() => {
    const filtered = contextComments.filter(c => {
      const matchTerm = !term || term === 'Tất cả học kỳ' || c.term === term;
      const matchLevel = !selectedLevelFilter || selectedLevelFilter === 'ALL' || c.level === selectedLevelFilter;
      const matchSource = sourceFilter === 'ALL' || c.source === sourceFilter;
      
      const contentStr = String(c.content || '');
      const matchSearch = contentStr.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTerm && matchLevel && matchSource && matchSearch;
    });

    // Level (T -> H -> C), then newest first
    return filtered.sort((a, b) => {
      const levelPriority: Record<string, number> = { 'T': 1, 'H': 2, 'C': 3 };
      const priorityA = levelPriority[a.level] || 4;
      const priorityB = levelPriority[b.level] || 4;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return b.id - a.id;
    });
  }, [contextComments, term, selectedLevelFilter, sourceFilter, searchTerm]);

  // Duplicate check in teacher's accessible comments
  const handleCheckDuplicate = (content: string, rating: string, currentId?: number): boolean => {
    const normalize = (str: string) => String(str || '').trim().toLowerCase();
    const inputContent = normalize(content);
    const activeTerm = term === 'Tất cả học kỳ' ? 'Cuối kỳ 1' : term;

    return contextComments.some(existingItem => {
      const matchContext = 
         existingItem.grade === selectedGrade && 
         existingItem.subject === selectedSubject && 
         (term === 'Tất cả học kỳ' ? true : existingItem.term === activeTerm);
      
      if (!matchContext) return false;
      if (currentId && existingItem.id === currentId) return false;

      const matchContent = normalize(existingItem.content) === inputContent;
      const matchRating = existingItem.level === rating;

      return matchContent && matchRating;
    });
  };



  // Download template
  const handleDownloadTemplate = () => {
    if (!selectedGrade || !selectedSubject) {
      alert("Vui lòng chọn Khối và Môn học trước khi tải mẫu.");
      return;
    }

    const activeTerm = term === 'Tất cả học kỳ' ? 'Cuối kỳ 1' : term;
    const existingData = contextComments.filter(c => 
      term === 'Tất cả học kỳ' ? true : c.term === activeTerm
    );

    const rows: any[] = [];
    let currentRowIndex = 1;

    existingData.forEach(item => {
      rows.push({
        'STT': currentRowIndex++,
        'Khối': item.grade,
        'Môn học': item.subject,
        'Học kỳ': item.term,
        'Mức độ (T/H/C)': item.level,
        'Nội dung nhận xét': item.content
      });
    });

    for (let i = 0; i < 50; i++) {
      rows.push({
        'STT': currentRowIndex++,
        'Khối': selectedGrade,
        'Môn học': selectedSubject,
        'Học kỳ': activeTerm,
        'Mức độ (T/H/C)': '', 
        'Nội dung nhận xét': '' 
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 16 }, { wch: 70 }
    ];

    const endRow = rows.length + 1;
    (worksheet as any)['!dataValidation'] = [
      {
        sqref: `E2:E${endRow}`,
        type: 'list',
        operator: 'equal',
        formula1: '"T,H,C"',
        showErrorMessage: true,
        errorTitle: 'Giá trị không hợp lệ',
        error: 'Vui lòng chọn T, H hoặc C từ danh sách.',
      }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mau_Nhan_Xet_Ca_Nhan");

    const cleanGrade = selectedGrade.replace(/\s+/g, '_');
    const cleanSubject = selectedSubject.replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Mau_Nhan_Xet_Ca_Nhan_${cleanGrade}_${cleanSubject}.xlsx`);
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Upload Excel into Teacher's personal bank
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;

      try {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        const normalize = (str: string) => str ? String(str).trim().toLowerCase() : '';
        const generateSig = (g: string, s: string, t: string, l: string, c: string) => 
          `${g}|${s}|${t}|${l}|${normalize(c)}`;

        const existingSignatures = new Set(
          contextComments.map(c => generateSig(c.grade, c.subject, c.term, c.level, c.content))
        );
        const fileSignatures = new Set<string>();
        const parsedRows: ImportRow[] = [];

        jsonData.forEach((row: any, index: number) => {
          const grade = row['Khối'] || selectedGrade;
          const subject = row['Môn học'] || selectedSubject;
          const t = row['Học kỳ'] || (term === 'Tất cả học kỳ' ? 'Cuối kỳ 1' : term);
          const rawLevel = row['Mức độ (T/H/C)'];
          const rawContent = row['Nội dung nhận xét'];
          const content = rawContent ? String(rawContent) : '';

          if (!rawLevel && !content) return; 

          let level = '';
          let isValid = true;
          let error = '';

          if (rawLevel) {
            const cleanLevel = String(rawLevel).trim().toUpperCase();
            if (['T', 'H', 'C'].includes(cleanLevel)) {
              level = cleanLevel;
            } else {
              isValid = false;
              error = 'Mức độ không hợp lệ (Phải là T, H hoặc C)';
            }
          } else {
            if (content) { isValid = false; error = 'Thiếu mức độ (T/H/C)'; } else { return; } 
          }

          if (!content && level) {
            isValid = false;
            error = 'Thiếu nội dung nhận xét';
          }
          
          if (isValid) {
            const sig = generateSig(grade, subject, t, level, content);
            if (existingSignatures.has(sig)) return;
            if (fileSignatures.has(sig)) return;
            fileSignatures.add(sig);
          }

          parsedRows.push({
            index,
            grade,
            subject,
            term: t,
            level,
            content: content || '',
            isValid,
            error
          });
        });

        if (parsedRows.length === 0) {
          alert("Không tìm thấy dữ liệu mới. Tất cả các câu trong file đều đã tồn tại trên kho nhận xét của bạn hoặc file rỗng.");
          return;
        }

        setImportData(parsedRows);
        setShowImportModal(true);

      } catch (error) {
        console.error("Error reading file:", error);
        alert("Đã xảy ra lỗi khi đọc file Excel. Vui lòng đảm bảo file đúng định dạng.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      const validRows = importData.filter(r => r.isValid);
      const invalidCount = importData.length - validRows.length;

      // Notice: Imported comments belong strictly to this teacher's personal bank!
      const newComments: CommentItem[] = validRows.map((r, idx) => ({
        id: Date.now() + idx,
        grade: r.grade,
        subject: r.subject,
        term: r.term,
        level: r.level as 'T' | 'H' | 'C',
        content: r.content,
        ownerId: currentUser.id,
        source: 'personal' // Teacher personal comment, never jumps to others
      }));
      
      if (newComments.length === 0) {
        alert("Không có dữ liệu hợp lệ để lưu.");
        setIsImporting(false);
        return;
      }

      setComments(prev => [...newComments, ...prev]);
      setIsImporting(false);
      setShowImportModal(false);
      setImportData([]); 
      
      if (invalidCount > 0) {
        alert(`Đã nhập thành công ${newComments.length} nhận xét vào kho cá nhân của ${currentUser.name}. Bỏ qua ${invalidCount} dòng lỗi.`);
      } else {
        alert(`Đã nhập thành công ${newComments.length} nhận xét vào kho cá nhân của ${currentUser.name}. (Chỉ lưu cho riêng thầy/cô).`);
      }
    }, 600);
  };

  // Inline Add Handler - Saves strictly as personal comment
  const handleAddNewClick = () => {
    setEditingId(null);
    setIsAddingNew(true);
    setNewLevel('T');
    setNewContent('');
    setAddError(null);
  };

  const handleSaveNew = () => {
    if (!newContent.trim()) {
      alert("Vui lòng nhập nội dung nhận xét");
      return;
    }

    const isDuplicate = handleCheckDuplicate(newContent, newLevel);
    if (isDuplicate) {
      setAddError("Nhận xét với mức độ này đã tồn tại trong môn học.");
      return;
    }

    const newId = Date.now();
    const activeTerm = term === 'Tất cả học kỳ' ? 'Cuối kỳ 1' : term;
    
    // Crucial requirement: Teacher adds to personal bank only!
    const newComment: CommentItem = {
      id: newId,
      grade: selectedGrade,
      subject: selectedSubject,
      term: activeTerm,
      level: newLevel,
      content: newContent.trim(),
      ownerId: currentUser.id,
      source: 'personal' // Will NEVER propagate to other teachers!
    };
    
    setComments(prev => [newComment, ...prev]);
    setIsAddingNew(false);
    setAddError(null);
  };

  // Inline Edit Handlers - only for personal comments
  const handleEditClick = (comment: CommentItem) => {
    if (comment.source === 'bgh') {
      alert("Đây là nhận xét do Ban Giám Hiệu ban hành. Thầy/cô có thể bấm 'Sao chép' hoặc tạo bản sao cá nhân để tùy chỉnh.");
      return;
    }
    setIsAddingNew(false);
    setEditingId(comment.id);
    setEditLevel(comment.level);
    setEditContent(comment.content);
    setEditError(null);
  };

  const handleUpdateComment = () => {
    if (!editContent.trim()) {
      alert("Vui lòng nhập nội dung nhận xét");
      return;
    }

    const isDuplicate = handleCheckDuplicate(editContent, editLevel, editingId!);
    if (isDuplicate) {
      setEditError("Nhận xét với mức độ này đã tồn tại trong môn học.");
      return;
    }

    setComments(prev => prev.map(c => 
      c.id === editingId 
        ? { ...c, level: editLevel, content: editContent.trim() }
        : c
    ));

    setEditingId(null);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  // Delete Handlers
  const handleDeleteClick = (comment: CommentItem) => {
    if (comment.source === 'bgh') {
      alert("Nhận xét do Ban Giám Hiệu áp dụng chung cho bộ môn, giáo viên không thể xóa khỏi hệ thống.");
      return;
    }
    setDeleteModal({ isOpen: true, id: comment.id });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.id !== null) {
      setComments(prev => prev.filter(c => c.id !== deleteModal.id));
      if (editingId === deleteModal.id) {
        setEditingId(null);
      }
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-hidden">
      
      {/* 1. Header & Configuration Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
              NGÂN HÀNG NHẬN XÉT THEO MÔN HỌC
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
              {contextCounts.all} câu
            </span>
          </div>

          {/* Source Tabs Pill (All / From BGH / Personal) */}
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-gray-200 shadow-2xs text-xs shrink-0 flex-nowrap">
            <button
              onClick={() => setSourceFilter('ALL')}
              className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                sourceFilter === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tất cả ({contextCounts.all})
            </button>
            <button
              onClick={() => setSourceFilter('bgh')}
              className={`whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                sourceFilter === 'bgh' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:bg-white/50'
              }`}
              title="Nhận xét do Ban Giám Hiệu áp dụng cho bộ môn"
            >
              <ShieldCheck size={13} />
              <span>Từ BGH ({contextCounts.bgh})</span>
            </button>
            <button
              onClick={() => setSourceFilter('personal')}
              className={`whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                sourceFilter === 'personal' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-white/50'
              }`}
              title="Nhận xét riêng do thầy/cô tự thêm (chỉ thầy/cô thấy)"
            >
              <UserCheck size={13} />
              <span>Cá nhân tự thêm ({contextCounts.personal})</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mb-3">
          Kho câu lời phê mẫu cho <span className="font-semibold text-blue-700">{currentUser.name}</span> • Môn {selectedSubject || '...'} ({selectedGrade || '...'})
        </p>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Năm học</label>
            <select 
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-hidden shadow-2xs"
            >
              <option value="2026-2027">2026 - 2027</option>
              <option value="2025-2026">2025 - 2026</option>
              <option value="2024-2025">2024 - 2025</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Khối lớp (Phân công)</label>
            <select 
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-hidden shadow-2xs"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Môn học (Phân công)</label>
            <select 
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-hidden shadow-2xs"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {availableSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Học kỳ</label>
            <select 
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-hidden shadow-2xs"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              <option value="Giữa kỳ 1">Giữa kỳ 1</option>
              <option value="Cuối kỳ 1">Cuối kỳ 1</option>
              <option value="Giữa kỳ 2">Giữa kỳ 2</option>
              <option value="Cuối năm">Cuối năm</option>
              <option value="Tất cả học kỳ">Tất cả học kỳ</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Toolbar & Level Tabs - Responsive & Anti-wrapping */}
      <div className="px-6 py-3 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: Search input & Level tabs */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="relative w-56 sm:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nội dung..."
              className="w-full pl-9 pr-7 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden text-sm shadow-2xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="inline-flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-2xs text-xs shrink-0 flex-nowrap">
            <button
              onClick={() => setSelectedLevelFilter('ALL')}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                selectedLevelFilter === 'ALL' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tất cả ({contextCounts.all})
            </button>
            <button
              onClick={() => setSelectedLevelFilter('T')}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md font-semibold transition-all inline-flex items-center gap-1.5 ${
                selectedLevelFilter === 'T' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <span>Mức T</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">{contextCounts.T}</span>
            </button>
            <button
              onClick={() => setSelectedLevelFilter('H')}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md font-semibold transition-all inline-flex items-center gap-1.5 ${
                selectedLevelFilter === 'H' ? 'bg-cyan-600 text-white shadow-xs' : 'text-cyan-700 hover:bg-cyan-50'
              }`}
            >
              <span>Mức H</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">{contextCounts.H}</span>
            </button>
            <button
              onClick={() => setSelectedLevelFilter('C')}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md font-semibold transition-all inline-flex items-center gap-1.5 ${
                selectedLevelFilter === 'C' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span>Mức C</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">{contextCounts.C}</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={handleDownloadTemplate}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
            title="Tải file mẫu Excel"
          >
            <Download size={14} className="text-gray-500" />
            <span>Tải file mẫu</span>
          </button>
          
          <button 
            onClick={handleTriggerUpload}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            title="Nhập dữ liệu nhận xét vào kho cá nhân của bạn"
          >
            <Upload size={14} />
            <span>Tải lên Excel (Cá nhân)</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          
          <button 
            onClick={handleAddNewClick}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus size={15} />
            <span>Thêm vào kho cá nhân</span>
          </button>
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
        <div className="flex-1 overflow-auto custom-scrollbar bg-white border border-gray-200 rounded-xl shadow-xs relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-gray-600 uppercase text-xs font-bold sticky top-0 z-10 shadow-xs border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center bg-slate-50">STT</th>
                <th className="px-5 py-3.5 w-28 bg-slate-50">Mức độ</th>
                <th className="px-5 py-3.5 w-36 bg-slate-50">Nguồn gốc</th>
                <th className="px-5 py-3.5 bg-slate-50">Nội dung nhận xét</th>
                <th className="px-5 py-3.5 w-36 text-center bg-slate-50">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {/* INLINE ADD ROW (PERSONAL COMMENT ONLY) */}
              {isAddingNew && (
                <tr className="bg-blue-50/70 border-b-2 border-blue-200 animate-in fade-in duration-200">
                  <td className="px-5 py-3 text-center text-sm text-blue-600 font-bold">#</td>
                  <td className="px-5 py-3 align-top">
                    <select 
                      className="w-full p-2 border border-blue-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-hidden bg-white text-gray-800 shadow-2xs"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value as any)}
                    >
                      <option value="T">T - Hoàn thành tốt</option>
                      <option value="H">H - Hoàn thành</option>
                      <option value="C">C - Cần cố gắng</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 align-middle">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <UserCheck size={12} />
                      <span>Cá nhân</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <div className="flex flex-col">
                      <input 
                        type="text"
                        autoFocus
                        className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-hidden bg-white placeholder-gray-400 font-medium transition-colors shadow-2xs ${
                          addError ? 'border-red-500 ring-1 ring-red-500' : 'border-blue-400'
                        }`}
                        placeholder={`Ví dụ: Em thực hiện tốt nội dung bài học môn ${selectedSubject} (${selectedGrade})...`}
                        value={newContent}
                        onChange={(e) => {
                          setNewContent(e.target.value);
                          if (addError) setAddError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNew();
                          if (e.key === 'Escape') setIsAddingNew(false);
                        }}
                      />
                      {addError && (
                        <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center gap-1">
                          <AlertTriangle size={13} />
                          <span>{addError}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500 mt-1">
                        * Nhận xét này chỉ lưu trong kho cá nhân của bạn, không ảnh hưởng đến giáo viên khác.
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center align-top">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={handleSaveNew} 
                        className="flex items-center gap-1 px-3 py-1.5 text-white bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                      >
                        <Check size={15} />
                        <span>Lưu</span>
                      </button>
                      <button 
                        onClick={() => setIsAddingNew(false)} 
                        className="p-1.5 text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors shadow-2xs"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* LIST OF ACCESSIBLE COMMENTS */}
              {processedComments.length > 0 ? (
                processedComments.map((comment, index) => {
                  const isEditing = comment.id === editingId;
                  const isBgh = comment.source === 'bgh';

                  if (isEditing) {
                    return (
                      <tr key={comment.id} className="bg-amber-50/50 border-b border-amber-200 animate-in fade-in">
                        <td className="px-5 py-3 text-center text-sm text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-5 py-3 align-top">
                          <select 
                            className="w-full p-2 border border-blue-400 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-hidden bg-white text-gray-800 shadow-2xs"
                            value={editLevel}
                            onChange={(e) => setEditLevel(e.target.value as any)}
                          >
                            <option value="T">T - Hoàn thành tốt</option>
                            <option value="H">H - Hoàn thành</option>
                            <option value="C">C - Cần cố gắng</option>
                          </select>
                        </td>
                        <td className="px-5 py-3 align-middle">
                          <span className="text-xs text-gray-500 font-semibold">Cá nhân</span>
                        </td>
                        <td className="px-5 py-3 align-top">
                          <div className="flex flex-col">
                            <input 
                              type="text"
                              autoFocus
                              className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-medium text-gray-900 transition-colors shadow-2xs ${
                                editError ? 'border-red-500 ring-1 ring-red-500' : 'border-blue-400'
                              }`}
                              value={editContent}
                              onChange={(e) => {
                                setEditContent(e.target.value);
                                if (editError) setEditError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateComment();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                            {editError && (
                              <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center gap-1">
                                <AlertTriangle size={13} />
                                <span>{editError}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center align-top">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={handleUpdateComment} 
                              className="flex items-center gap-1 px-3 py-1.5 text-white bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                            >
                              <Save size={15} />
                              <span>Lưu</span>
                            </button>
                            <button 
                              onClick={handleCancelEdit} 
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={comment.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-5 py-3.5 text-center text-xs text-gray-500 font-semibold">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          comment.level === 'T' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : comment.level === 'H' 
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <span>Mức {comment.level}</span>
                        </span>
                      </td>

                      {/* Source Origin Badge */}
                      <td className="px-5 py-3.5">
                        {isBgh ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            title="Nhận xét do Ban Giám Hiệu áp dụng cho toàn bộ giáo viên giảng dạy môn này"
                          >
                            <ShieldCheck size={13} className="text-indigo-600" />
                            <span>Từ BGH</span>
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title="Lời phê do bạn tự tạo trong kho cá nhân"
                          >
                            <UserCheck size={13} className="text-emerald-600" />
                            <span>Cá nhân</span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-sm text-gray-800 leading-relaxed font-medium">
                        {comment.content}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          

                          {isBgh ? (
                            <span className="text-gray-300 select-none text-base font-semibold" title="Nhận xét dùng chung từ BGH (chỉ xem)">—</span>
                          ) : (
                            <>
                              {/* Edit */}
                              <button 
                                onClick={() => handleEditClick(comment)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Chỉnh sửa nhận xét cá nhân"
                              >
                                <Edit size={16} />
                              </button>

                              {/* Delete (Only personal comments) */}
                              <button 
                                onClick={() => handleDeleteClick(comment)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa nhận xét cá nhân"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                !isAddingNew && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400 max-w-md mx-auto">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                          <Info size={30} />
                        </div>
                        <h3 className="text-base font-bold text-gray-700">Chưa có nhận xét phù hợp</h3>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          Chưa có nhận xét nào trong môn <span className="font-semibold text-gray-800">{selectedSubject}</span> ({selectedGrade}). Thêm vào kho cá nhân hoặc tải file Excel lên.
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={handleAddNewClick}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
                          >
                            <Plus size={14} />
                            <span>Thêm vào kho cá nhân</span>
                          </button>
                          <button
                            onClick={handleTriggerUpload}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
                          >
                            <Upload size={14} />
                            <span>Tải từ Excel</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      <CommentBankImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        importData={importData}
        onConfirm={handleConfirmImport}
        isLoading={isImporting}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa nhận xét cá nhân</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Bạn có chắc chắn muốn xóa nhận xét này khỏi kho cá nhân của bạn không?
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, id: null })}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold shadow-xs"
                >
                  Xóa nhận xét
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CommentBank;