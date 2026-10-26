import React from 'react';
import { X, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { ImportRow } from '../types';

interface CommentBankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importData: ImportRow[];
  onConfirm: () => void;
  isLoading: boolean;
}

const CommentBankImportModal: React.FC<CommentBankImportModalProps> = ({ 
  isOpen, 
  onClose, 
  importData, 
  onConfirm,
  isLoading
}) => {
  if (!isOpen) return null;

  const validRows = importData.filter(r => r.isValid);
  const invalidRows = importData.filter(r => !r.isValid);
  const hasErrors = invalidRows.length > 0;
  const validCount = validRows.length;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <FileSpreadsheet className="text-white" size={24} />
             <div>
                <h2 className="text-white font-bold text-lg leading-none">Xem trước dữ liệu Import</h2>
                <p className="text-emerald-100 text-xs mt-1">Hệ thống đã tự động lọc bỏ các dòng trống</p>
             </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Summary Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-6">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <CheckCircle size={18} />
                <span className="font-semibold text-sm">Hợp lệ: {validRows.length} dòng</span>
            </div>
            {hasErrors && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                    <AlertTriangle size={18} />
                    <span className="font-semibold text-sm">Lỗi: {invalidRows.length} dòng</span>
                </div>
            )}
            <div className="ml-auto text-xs text-gray-500 italic">
               * Chỉ hiển thị các dòng có dữ liệu nhập
            </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-gray-100/50">
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
                     <tr>
                        <th className="px-4 py-3 font-bold border-b w-16 text-center">STT</th>
                        <th className="px-4 py-3 font-bold border-b w-24">Khối</th>
                        <th className="px-4 py-3 font-bold border-b w-32">Môn học</th>
                        <th className="px-4 py-3 font-bold border-b w-20 text-center">Mức</th>
                        <th className="px-4 py-3 font-bold border-b">Nội dung nhận xét</th>
                        <th className="px-4 py-3 font-bold border-b w-32 text-center">Trạng thái</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {importData.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                Không có dữ liệu để hiển thị. Vui lòng kiểm tra lại file Excel.
                            </td>
                        </tr>
                     ) : (
                         importData.map((row) => (
                             <tr key={row.index} className={row.isValid ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100/80'}>
                                 <td className="px-4 py-3 text-center text-gray-500">{row.index + 1}</td>
                                 <td className="px-4 py-3 text-gray-700">{row.grade}</td>
                                 <td className="px-4 py-3 text-gray-700">{row.subject}</td>
                                 <td className="px-4 py-3 text-center">
                                     {row.level && (
                                         <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                             row.level === 'T' ? 'bg-blue-100 text-blue-700' :
                                             row.level === 'H' ? 'bg-cyan-100 text-cyan-700' :
                                             'bg-orange-100 text-orange-700'
                                         }`}>
                                             {row.level}
                                         </span>
                                     )}
                                 </td>
                                 <td className="px-4 py-3 text-gray-800">{row.content}</td>
                                 <td className="px-4 py-3 text-center">
                                     {row.isValid ? (
                                         <span className="text-green-600 text-xs font-bold flex items-center justify-center gap-1">
                                             <CheckCircle size={14} /> Hợp lệ
                                         </span>
                                     ) : (
                                        <span className="text-red-600 text-xs font-bold flex items-center justify-center gap-1" title={row.error}>
                                            <AlertTriangle size={14} /> {row.error || 'Lỗi'}
                                        </span>
                                     )}
                                 </td>
                             </tr>
                         ))
                     )}
                  </tbody>
               </table>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
             {/* Left side hint */}
             <div className="text-sm">
                {hasErrors && (
                   <span className="text-orange-600 italic font-medium flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle size={14} />
                      ⚠️ Các dòng lỗi sẽ bị bỏ qua khi nhập.
                   </span>
                )}
             </div>

             {/* Buttons */}
             <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button 
                    onClick={onClose}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    disabled={isLoading}
                >
                    Hủy bỏ
                </button>
                <button 
                    onClick={onConfirm}
                    disabled={validCount === 0 || isLoading}
                    className={`px-6 py-2.5 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-all ${
                        validCount === 0 || isLoading
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'
                    }`}
                >
                    {isLoading ? (
                        <>Đang xử lý...</>
                    ) : (
                        <>Nhập {validCount} dòng hợp lệ</>
                    )}
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default CommentBankImportModal;