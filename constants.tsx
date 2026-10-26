import { UserConfig, CommentItem } from './types';

// MOCK DATA FOR USERS & TEACHERS
export const MOCK_USERS_DB: Record<string, UserConfig> = {
  'bgh': {
    id: 'bgh',
    name: 'Thầy Lê Hoàng Long (Ban Giám Hiệu)',
    role: 'bgh',
    title: 'Phó Hiệu trưởng phụ trách chuyên môn',
    avatarColor: 'from-indigo-600 to-purple-700',
    assignments: {
      'Khối 01': ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Đạo đức', 'Tự nhiên và Xã hội'],
      'Khối 02': ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên và Xã hội'],
      'Khối 03': ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tin học'],
      'Khối 04': ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Lịch sử và Địa lý'],
      'Khối 05': ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Lịch sử và Địa lý']
    }
  },
  'user_a': {
    id: 'user_a',
    name: 'Cô Nguyễn Thị Anh (GV Khối 1 & 2)',
    role: 'subject_teacher',
    title: 'Giáo viên bộ môn Toán & Tiếng Việt',
    avatarColor: 'from-pink-500 to-rose-600',
    assignments: {
      'Khối 01': ['Toán', 'Tiếng Việt'],
      'Khối 02': ['Toán', 'Tiếng Việt']
    }
  },
  'user_b': {
    id: 'user_b',
    name: 'Thầy Trần Văn Toán (GV Chủ nhiệm 1A2)',
    role: 'homeroom_teacher',
    title: 'Giáo viên Chủ nhiệm lớp 1A2',
    avatarColor: 'from-emerald-500 to-teal-600',
    assignments: {
      'Khối 01': ['Toán', 'Tiếng Việt', 'Đạo đức'],
      'Khối 03': ['Toán']
    }
  },
  'user_c': {
    id: 'user_c',
    name: 'Cô Lê Thanh Mai (GV Ngoại ngữ)',
    role: 'subject_teacher',
    title: 'Giáo viên Tiếng Anh toàn trường',
    avatarColor: 'from-amber-500 to-orange-600',
    assignments: {
      'Khối 01': ['Tiếng Anh'],
      'Khối 03': ['Tiếng Anh'],
      'Khối 04': ['Tiếng Anh'],
      'Khối 05': ['Tiếng Anh']
    }
  }
};

// HELPER: Find all teachers (excluding BGH) who teach this grade and subject
export const getTeachersAssignedTo = (
  grade: string, 
  subject: string, 
  users: Record<string, UserConfig> = MOCK_USERS_DB
): UserConfig[] => {
  return Object.values(users).filter(u => 
    u.role !== 'bgh' && 
    u.assignments[grade] && 
    u.assignments[grade].includes(subject)
  );
};

// INITIAL MOCK COMMENTS
export const INITIAL_COMMENTS: CommentItem[] = [
  // --- KHO CHUẨN BAN GIÁM HIỆU BAN HÀNH (Áp dụng cho các GV giảng dạy) ---
  
  // KHỐI 1 - TOÁN (Áp dụng cho Cô Anh & Thầy Toán)
  { 
    id: 101, 
    grade: 'Khối 01', 
    subject: 'Toán', 
    term: 'Giữa kỳ 1', 
    level: 'T', 
    content: 'Em thực hiện thành thạo phép cộng, trừ trong phạm vi 10. Tiếp thu bài nhanh.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 111, 
    grade: 'Khối 01', 
    subject: 'Toán', 
    term: 'Cuối kỳ 1', 
    level: 'T', 
    content: 'Em có tư duy logic tốt, nhận biết và phân biệt hình học chính xác, nhanh nhẹn.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 102, 
    grade: 'Khối 01', 
    subject: 'Toán', 
    term: 'Giữa kỳ 1', 
    level: 'H', 
    content: 'Em biết cách đặt tính nhưng đôi khi còn nhầm lẫn khi tính nhẩm nhanh.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 112, 
    grade: 'Khối 01', 
    subject: 'Toán', 
    term: 'Cuối kỳ 1', 
    level: 'H', 
    content: 'Em hoàn thành các bài tập trên lớp đầy đủ, cần rèn thêm kỹ năng tính nhẩm.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 103, 
    grade: 'Khối 01', 
    subject: 'Toán', 
    term: 'Giữa kỳ 1', 
    level: 'C', 
    content: 'Em cần rèn luyện thêm về kỹ năng viết chữ số và thực hiện phép trừ.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 113, 
    grade: 'Khối 01', 
    subject: 'Toán', 
    term: 'Cuối kỳ 1', 
    level: 'C', 
    content: 'Em còn lúng túng khi giải bài toán có lời văn, cần giáo viên hướng dẫn thêm.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },

  // KHỐI 1 - TIẾNG VIỆT (Áp dụng cho Cô Anh & Thầy Toán)
  { 
    id: 104, 
    grade: 'Khối 01', 
    subject: 'Tiếng Việt', 
    term: 'Giữa kỳ 1', 
    level: 'T', 
    content: 'Em đọc to, rõ ràng, tốc độ đọc nhanh. Nét chữ đều và đẹp, giữ vở sạch sẽ.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 114, 
    grade: 'Khối 01', 
    subject: 'Tiếng Việt', 
    term: 'Cuối kỳ 1', 
    level: 'T', 
    content: 'Em kể chuyện diễn cảm, nhớ nội dung câu chuyện tốt, tự tin phát biểu xây dựng bài.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 105, 
    grade: 'Khối 01', 
    subject: 'Tiếng Việt', 
    term: 'Giữa kỳ 1', 
    level: 'H', 
    content: 'Em đọc đúng mặt chữ nhưng còn ngập ngừng khi gặp từ có vần khó.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 106, 
    grade: 'Khối 01', 
    subject: 'Tiếng Việt', 
    term: 'Giữa kỳ 1', 
    level: 'C', 
    content: 'Em cần luyện đọc thêm ở nhà để cải thiện tốc độ và phát âm chuẩn các âm đầu.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a', 'user_b'],
    appliedAt: '2026-09-05'
  },

  // KHỐI 1 - TIẾNG ANH (Áp dụng cho Cô Mai)
  { 
    id: 107, 
    grade: 'Khối 01', 
    subject: 'Tiếng Anh', 
    term: 'Cuối kỳ 1', 
    level: 'T', 
    content: 'Em nhớ từ vựng tốt, phát âm chuẩn các âm cơ bản, tích cực tham gia trò chơi ngôn ngữ.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_c'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 108, 
    grade: 'Khối 01', 
    subject: 'Tiếng Anh', 
    term: 'Cuối kỳ 1', 
    level: 'H', 
    content: 'Em nắm được các từ vựng bài học, cần mạnh dạn hơn khi giao tiếp với giáo viên.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_c'],
    appliedAt: '2026-09-05'
  },

  // KHỐI 2 - TOÁN
  { 
    id: 201, 
    grade: 'Khối 02', 
    subject: 'Toán', 
    term: 'Cuối kỳ 1', 
    level: 'T', 
    content: 'Em nắm vững bảng nhân chia, giải toán có lời văn tốt, tính toán cẩn thận.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a'],
    appliedAt: '2026-09-05'
  },
  { 
    id: 202, 
    grade: 'Khối 02', 
    subject: 'Toán', 
    term: 'Cuối kỳ 1', 
    level: 'H', 
    content: 'Em thuộc bảng cửu chương nhưng vận dụng vào bài toán có lời văn còn chậm.',
    ownerId: 'bgh',
    source: 'bgh',
    isAppliedToAllTeachers: true,
    appliedTeacherIds: ['user_a'],
    appliedAt: '2026-09-05'
  },

  // --- KHO CÁ NHÂN DO TỪNG GIÁO VIÊN TỰ SOẠN THÊM (CHỈ GV ĐÓ THẤY, KHÔNG NHẢY SANG GV KHÁC) ---
  
  // Nhận xét riêng của Cô Nguyễn Thị Anh (user_a):
  {
    id: 801,
    grade: 'Khối 01',
    subject: 'Toán',
    term: 'Giữa kỳ 1',
    level: 'T',
    content: 'Em rất thích học toán, làm bài tập trong vở bài tập rất nắn nót và đúng hạn.',
    ownerId: 'user_a',
    source: 'personal'
  },
  {
    id: 802,
    grade: 'Khối 01',
    subject: 'Tiếng Việt',
    term: 'Cuối kỳ 1',
    level: 'H',
    content: 'Em viết chữ có tiến bộ, cần chú ý khoảng cách giữa các con chữ.',
    ownerId: 'user_a',
    source: 'personal'
  },

  // Nhận xét riêng của Thầy Trần Văn Toán (user_b):
  {
    id: 901,
    grade: 'Khối 01',
    subject: 'Toán',
    term: 'Giữa kỳ 1',
    level: 'T',
    content: 'Em có năng khiếu toán học, làm toán đố nhanh nhất lớp và biết giúp đỡ bạn bè.',
    ownerId: 'user_b',
    source: 'personal'
  },
  {
    id: 902,
    grade: 'Khối 01',
    subject: 'Toán',
    term: 'Cuối kỳ 1',
    level: 'C',
    content: 'Em còn hay quên đồ dùng học tập và nhầm lẫn dấu cộng trừ, cần phụ huynh nhắc nhở thêm.',
    ownerId: 'user_b',
    source: 'personal'
  }
];