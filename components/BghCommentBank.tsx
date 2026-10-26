import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserConfig, CommentItem, ImportRow } from '../types';
import { 
  Download, Upload, Search, Trash2, Edit, Plus, Info, Check, X, Save, 
  AlertTriangle, Users, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import CommentBankImportModal from './CommentBankImportModal';
import * as XLSX from 'xlsx';

interface BghCommentBankProps {
  currentUser: UserConfig;
  comments: CommentItem[];
  setComments: React.Dispatch<React.SetStateAction<CommentItem[]>>;
  selectedGrade?: string;
  setSelectedGrade?: (grade: string) => void;
  selectedLevelFilter?: string;
  setSelectedLevelFilter?: (level: string) => void;
}

const BghCommentBank: React.FC<BghCommentBankProps> = ({
  currentUser,
  comments,
  setComments,
  selectedGrade: propSelectedGrade,
  setSelectedGrade: propSetSelectedGrade,
  selectedLevelFilter: propSelectedLevelFilter,
  setSelectedLevelFilter: propSetSelectedLevelFilter
}) => {
  // State
  const [internalGrade, setInternalGrade] = useState<string>('Khối 01');
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
  const [term, setTerm] = useState('Giữa kỳ 1');
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [searchTerm, setSearchTerm] = useState('');
  const [internalLevelFilter, setInternalLevelFilter] = useState('ALL');

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

  // All Grades
  const availableGrades = useMemo(() => {
    return Object.keys(currentUser.assignments).sort();
  }, [currentUser]);

  // Subjects for the current grade
  const availableSubjects = useMemo(() => {
    if (!selectedGrade) return [];
    return currentUser.assignments[selectedGrade] || [];
  }, [selectedGrade, currentUser]);

  // Auto-select grade & subject if needed
  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.includes(selectedGrade)) {
      setSelectedGrade(availableGrades[0]);
    }
  }, [availableGrades, selectedGrade, setSelectedGrade]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

  // Comments owned by BGH for this Grade and Subject
  const bghComments = useMemo(() => {
    return comments.filter(c => c.ownerId === 'bgh');
  }, [comments]);

  // Context Comments (Matching selected Grade & Subject)
  const contextComments = useMemo(() => {
    return bghComments.filter(c => {
      const matchGrade = !selectedGrade || c.grade === selectedGrade;
      const matchSubject = !selectedSubject || c.subject === selectedSubject;
      return matchGrade && matchSubject;
    });
  }, [bghComments, selectedGrade, selectedSubject]);

  // Counts by level
  const contextLevelCounts = useMemo(() => {
    return {
      all: contextComments.length,
      T: contextComments.filter(c => c.level === 'T').length,
      H: contextComments.filter(c => c.level === 'H').length,
      C: contextComments.filter(c => c.level === 'C').length
    };
  }, [contextComments]);

  // Filter & Sort
  const processedComments = useMemo(() => {
    const filtered = contextComments.filter(c => {
      const matchTerm = !term || term === 'Tất cả học kỳ' || c.term === term;
      const matchLevel = !selectedLevelFilter || selectedLevelFilter === 'ALL' || c.level === selectedLevelFilter;
      const contentStr = String(c.content || '');
      const matchSearch = contentStr.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTerm && matchLevel && matchSearch;
    });

    return filtered.sort((a, b) => {
      const levelPriority: Record<string, number> = { 'T': 1, 'H': 2, 'C': 3 };
      const priorityA = levelPriority[a.level] || 4;
      const priorityB = levelPriority[b.level] || 4;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return b.id - a.id;
    });
  }, [contextComments, term, selectedLevelFilter, searchTerm]);

  // Check duplicate in BGH bank
  const handleCheckDuplicate = (content: string, rating: string, currentId?: number): boolean => {
    const normalize = (str: string) => String(str || '').trim().toLowerCase();
    const inputContent = normalize(content);
    const activeTerm = term === 'Tất cả học kỳ' ? 'Cuối kỳ 1' : term;

    return bghComments.some(item => {
      const matchContext = 
        item.grade === selectedGrade && 
        item.subject === selectedSubject && 
        (term === 'Tất cả học kỳ' ? true : item.term === activeTerm);
      if (!matchContext) return false;
      if (currentId && item.id === currentId) return false;
      return normalize(item.content) === inputContent && item.level === rating;
    });
  };


  // Download Template
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
        error: 'Vui lòng chọn T, H hoặc C.',
      }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mau_Nhan_Xet_BGH");

    const cleanGrade = selectedGrade.replace(/\s+/g, '_');
    const cleanSubject = selectedSubject.replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Mau_Nhan_Xet_BGH_${cleanGrade}_${cleanSubject}.xlsx`);
  };

  // File Upload
  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

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
          bghComments.map(c => generateSig(c.grade, c.subject, c.term, c.level, c.content))
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
            if (content) { isValid = false; error = 'Thiếu mức độ'; } else { return; }
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
          alert("Không tìm thấy dữ liệu mới. Tất cả các câu trong file đều đã tồn tại trên kho BGH hoặc file rỗng.");
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

      // When BGH imports, comments are automatically in BGH bank and automatically available to teachers
      const newComments: CommentItem[] = validRows.map((r, idx) => ({
        id: Date.now() + idx,
        grade: r.grade,
        subject: r.subject,
        term: r.term,
        level: r.level as 'T' | 'H' | 'C',
        content: r.content,
        ownerId: 'bgh',
        source: 'bgh'
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

      alert(`Đã nhập thành công ${newComments.length} nhận xét vào kho Ban Giám Hiệu (Tất cả giáo viên có phân công giảng dạy của khối và môn học này đều được dùng chung). Bỏ qua ${invalidCount} dòng lỗi.`);
    }, 600);
  };

  // Inline Add Handlers - Automatically available to teachers
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

    if (handleCheckDuplicate(newContent, newLevel)) {
      setAddError("Nhận xét với mức độ này đã tồn tại trong kho BGH.");
      return;
    }

    const activeTerm = term === 'Tất cả học kỳ' ? 'Cuối kỳ 1' : term;
    
    // Automatically saved under BGH, and thus automatically appears for all assigned teachers!
    const newComment: CommentItem = {
      id: Date.now(),
      grade: selectedGrade,
      subject: selectedSubject,
      term: activeTerm,
      level: newLevel,
      content: newContent.trim(),
      ownerId: 'bgh',
      source: 'bgh'
    };

    setComments(prev => [newComment, ...prev]);
    setIsAddingNew(false);
    setAddError(null);
  };

  // Inline Edit Handlers
  const handleEditClick = (comment: CommentItem) => {
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

    if (handleCheckDuplicate(editContent, editLevel, editingId!)) {
      setEditError("Nhận xét với mức độ này đã tồn tại trong kho BGH.");
      return;
    }

    setComments(prev => prev.map(c => {
      if (c.id === editingId) {
        return {
          ...c,
          level: editLevel,
          content: editContent.trim()
        };
      }
      return c;
    }));

    setEditingId(null);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  // Delete Handlers
  const handleDeleteClick = (id: number) => {
    setDeleteModal({ isOpen: true, id });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.id !== null) {
      setComments(prev => prev.filter(c => c.id !== deleteModal.id));
      if (editingId === deleteModal.id) setEditingId(null);
    }
    setDeleteModal({ isOpen: false, id: null });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-hidden">
      
      {/* 1. Header & Configuration Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-xs shrink-0">
        
        {/* Title Line */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
              <ShieldCheck size={20} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
              NGÂN HÀNG NHẬN XÉT THEO MÔN HỌC
            </h1>

          </div>
        </div>



        {/* Assigned Teachers Banner */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 bg-indigo-50/90 border border-indigo-200/90 px-3.5 py-2.5 rounded-xl text-xs text-indigo-950">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-600 shrink-0" />
            <span className="font-medium text-indigo-900">
              Tất cả giáo viên có phân công giảng dạy của khối và môn học này đều được dùng chung kho nhận xét này
            </span>
          </div>
          
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle2 size={12} />
            <span>Tự động đồng bộ</span>
          </span>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Năm học</label>
            <select 
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-hidden shadow-2xs"
            >
              <option value="2026-2027">2026 - 2027</option>
              <option value="2025-2026">2025 - 2026</option>
              <option value="2024-2025">2024 - 2025</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Khối lớp</label>
            <select 
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-hidden shadow-2xs"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Môn học</label>
            <select 
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-hidden shadow-2xs"
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
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-hidden shadow-2xs"
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

      {/* 2. Toolbar & Level Tabs - Responsive & Clean */}
      <div className="px-6 py-3 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: Search & Level Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="relative w-56 sm:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nội dung..."
              className="w-full pl-9 pr-7 py-1.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden text-sm shadow-2xs"
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
              Tất cả ({contextLevelCounts.all})
            </button>
            <button
              onClick={() => setSelectedLevelFilter('T')}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md font-semibold transition-all inline-flex items-center gap-1.5 ${
                selectedLevelFilter === 'T' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <span>Mức T</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">{contextLevelCounts.T}</span>
            </button>
            <button
              onClick={() => setSelectedLevelFilter('H')}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md font-semibold transition-all inline-flex items-center gap-1.5 ${
                selectedLevelFilter === 'H' ? 'bg-cyan-600 text-white shadow-xs' : 'text-cyan-700 hover:bg-cyan-50'
              }`}
            >
              <span>Mức H</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">{contextLevelCounts.H}</span>
            </button>
            <button
              onClick={() => setSelectedLevelFilter('C')}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md font-semibold transition-all inline-flex items-center gap-1.5 ${
                selectedLevelFilter === 'C' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span>Mức C</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-bold">{contextLevelCounts.C}</span>
            </button>
          </div>
        </div>

        {/* Right: Actions (No more extra apply buttons!) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={handleDownloadTemplate}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
            title="Tải file mẫu Excel kèm dữ liệu hiện tại để nhập liệu"
          >
            <Download size={14} className="text-gray-500" />
            <span>Tải file mẫu</span>
          </button>
          
          <button 
            onClick={handleTriggerUpload}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            title="Nhập dữ liệu nhận xét từ file Excel vào kho BGH (Tự động đổ vào giáo viên)"
          >
            <Upload size={14} />
            <span>Tải lên Excel</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          
          <button 
            onClick={handleAddNewClick}
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus size={15} />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {/* 3. Data Table (Standard 4 columns, matches teacher table) */}
      <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
        <div className="flex-1 overflow-auto custom-scrollbar bg-white border border-gray-200 rounded-xl shadow-xs relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-gray-600 uppercase text-xs font-bold sticky top-0 z-10 shadow-xs border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center bg-slate-50">STT</th>
                <th className="px-5 py-3.5 w-32 bg-slate-50">Mức độ</th>
                <th className="px-5 py-3.5 bg-slate-50">Nội dung nhận xét BGH</th>
                <th className="px-5 py-3.5 w-36 text-center bg-slate-50">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {/* INLINE ADD ROW */}
              {isAddingNew && (
                <tr className="bg-indigo-50/70 border-b-2 border-indigo-200 animate-in fade-in duration-200">
                  <td className="px-5 py-3 text-center text-sm text-indigo-600 font-bold">#</td>
                  <td className="px-5 py-3 align-top">
                    <select 
                      className="w-full p-2 border border-indigo-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white text-gray-800 shadow-2xs"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value as any)}
                    >
                      <option value="T">T - Hoàn thành tốt</option>
                      <option value="H">H - Hoàn thành</option>
                      <option value="C">C - Cần cố gắng</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <div className="flex flex-col">
                      <input 
                        type="text"
                        autoFocus
                        className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white placeholder-gray-400 font-medium transition-colors shadow-2xs ${
                          addError ? 'border-red-500 ring-1 ring-red-500' : 'border-indigo-400'
                        }`}
                        placeholder={`Ví dụ: Em thực hiện thành thạo phép cộng trừ môn ${selectedSubject} (${selectedGrade})...`}
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
                      
                      <p className="text-[11px] text-indigo-700 font-medium mt-1.5">
                        * Tất cả giáo viên có phân công giảng dạy của khối và môn học này đều được dùng chung nhận xét này.
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

              {/* LIST OF BGH COMMENTS */}
              {processedComments.length > 0 ? (
                processedComments.map((comment, index) => {
                  const isEditing = comment.id === editingId;

                  if (isEditing) {
                    return (
                      <tr key={comment.id} className="bg-amber-50/50 border-b border-amber-200 animate-in fade-in">
                        <td className="px-5 py-3 text-center text-sm text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-5 py-3 align-top">
                          <select 
                            className="w-full p-2 border border-indigo-400 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white text-gray-800 shadow-2xs"
                            value={editLevel}
                            onChange={(e) => setEditLevel(e.target.value as any)}
                          >
                            <option value="T">T - Hoàn thành tốt</option>
                            <option value="H">H - Hoàn thành</option>
                            <option value="C">C - Cần cố gắng</option>
                          </select>
                        </td>
                        <td className="px-5 py-3 align-top">
                          <div className="flex flex-col">
                            <input 
                              type="text"
                              autoFocus
                              className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white font-medium text-gray-900 transition-colors shadow-2xs ${
                                editError ? 'border-red-500 ring-1 ring-red-500' : 'border-indigo-400'
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
                    <tr key={comment.id} className="hover:bg-indigo-50/30 transition-colors group">
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
                      <td className="px-5 py-3.5 text-sm text-gray-800 leading-relaxed font-medium">
                        {comment.content}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          

                          {/* Edit */}
                          <button 
                            onClick={() => handleEditClick(comment)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Chỉnh sửa nhận xét BGH"
                          >
                            <Edit size={16} />
                          </button>

                          {/* Delete */}
                          <button 
                            onClick={() => handleDeleteClick(comment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa nhận xét khỏi kho BGH"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                !isAddingNew && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400 max-w-md mx-auto">
                        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center mb-3">
                          <Info size={30} />
                        </div>
                        <h3 className="text-base font-bold text-gray-700">Chưa có nhận xét mẫu của BGH</h3>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          Ban Giám Hiệu chưa tạo nhận xét nào cho môn <span className="font-semibold text-gray-800">{selectedSubject}</span> ({selectedGrade}). Thêm mới hoặc tải file Excel để tự động đổ vào trang của giáo viên.
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={handleAddNewClick}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
                          >
                            <Plus size={14} />
                            <span>Tạo nhận xét đầu tiên</span>
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa nhận xét BGH</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Bạn có chắc chắn muốn xóa nhận xét mẫu này khỏi kho của Ban Giám Hiệu không? Nhận xét này cũng sẽ không còn hiển thị ở trang của giáo viên.
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

export default BghCommentBank;
