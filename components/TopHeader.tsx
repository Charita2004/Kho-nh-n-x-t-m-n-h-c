import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ShieldCheck, UserCheck, Sparkles, School } from 'lucide-react';
import { UserConfig } from '../types';
import { MOCK_USERS_DB } from '../constants';

interface TopHeaderProps {
  currentUser: UserConfig;
  setCurrentUser: (user: UserConfig) => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ 
  currentUser, 
  setCurrentUser
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isBgh = currentUser.role === 'bgh';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserSwitch = (userId: string) => {
    setCurrentUser(MOCK_USERS_DB[userId]);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 shadow-xs sticky top-0 z-30 shrink-0">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Title & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs text-white ${
              isBgh ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
            }`}>
              {isBgh ? <School size={17} /> : <Sparkles size={16} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base leading-tight">
                  VN EDU • Quản lý Nhận xét
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                  isBgh 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isBgh ? 'BAN GIÁM HIỆU' : 'GIÁO VIÊN BỘ MÔN'}
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                {isBgh 
                  ? 'Kho chuẩn cấp trường • Phân bổ lời phê mẫu theo Thông tư 27' 
                  : 'Kho lời phê mẫu cá nhân • Tự do biên soạn và sử dụng'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile with Switcher */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all border shadow-2xs ${
                isBgh 
                  ? 'bg-purple-50/60 border-purple-200 hover:bg-purple-100/60' 
                  : 'bg-white border-gray-200/80 hover:bg-gray-100'
              }`}
            >
              <div className={`w-8 h-8 bg-gradient-to-br ${currentUser.avatarColor} rounded-full flex items-center justify-center shadow-xs text-white font-bold text-xs`}>
                {isBgh ? <School size={15} /> : currentUser.name.charAt(currentUser.name.indexOf(' ') > 0 ? currentUser.name.indexOf(' ') + 1 : 0)}
              </div>
              
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-xs font-bold text-gray-800 leading-tight max-w-[170px] truncate">
                  {currentUser.name}
                </span>
                <span className={`text-[10px] font-bold ${isBgh ? 'text-purple-700' : 'text-gray-500'}`}>
                  {currentUser.title}
                </span>
              </div>
              
              <ChevronDown size={14} className="text-gray-500 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-84 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50">
                <div className="bg-slate-50 px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">Chuyển đổi vai trò / tài khoản</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Thử nghiệm tính năng Ban Giám Hiệu áp dụng nhận xét và sự độc lập của kho cá nhân từng GV
                  </p>
                </div>
                
                <div className="p-2 space-y-1">
                  {Object.values(MOCK_USERS_DB).map((user) => {
                    const isSelected = currentUser.id === user.id;
                    const isUserBgh = user.role === 'bgh';
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleUserSwitch(user.id)}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-sm transition-colors text-left ${
                          isSelected 
                            ? isUserBgh 
                              ? 'bg-purple-50 text-purple-900 font-medium border border-purple-200' 
                              : 'bg-blue-50 text-blue-900 font-medium border border-blue-200' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs mt-0.5`}>
                          {isUserBgh ? <School size={15} /> : user.name.charAt(user.name.indexOf(' ') > 0 ? user.name.indexOf(' ') + 1 : 0)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-gray-900 truncate">{user.name}</span>
                            {isUserBgh && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">
                                BGH
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {user.title}
                          </div>
                          <div className="text-[10px] text-indigo-600 mt-0.5 truncate font-medium">
                            {isUserBgh ? 'Phụ trách toàn bộ khối & môn' : Object.keys(user.assignments).join(', ')}
                          </div>
                        </div>

                        {isSelected && <Check size={16} className={`${isUserBgh ? 'text-purple-600' : 'text-blue-600'} shrink-0 mt-1`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;