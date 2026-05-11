import { Role, UserStatus, Gender, GradeLevel, Semester, StudentStatus, AttendanceStatus, AttendancePeriod, LeaveType, LeaveStatus, FeeType, PaymentStatus, NoticeCategory, NoticeTargetType, RewardPunishmentType, ParentRelation, DormitoryType } from "../constants";

// ============ 用户相关 ============
export interface UserDTO {
  id: number;
  username: string | null;
  role: Role;
  wechatOpenid: string | null;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  tokens: TokenPair;
  user: UserDTO;
}

// ============ 学生相关 ============
export interface StudentDTO {
  id: number;
  userId: number | null;
  studentNo: string;
  name: string;
  gender: Gender;
  birthDate: string | null;
  idCard: string | null;
  address: string | null;
  nativePlace: string | null;
  hobbies: string | null;
  photoUrl: string | null;
  classId: number | null;
  className: string | null;
  dormitoryId: number | null;
  enrollmentDate: string | null;
  status: StudentStatus;
  parents: ParentDTO[];
  user: UserDTO | null;
}

// ============ 家长相关 ============
export interface ParentDTO {
  id: number;
  userId: number | null;
  studentId: number;
  relation: ParentRelation;
  name: string;
  phone: string;
  occupation: string | null;
  isPrimary: boolean;
}

// ============ 教师相关 ============
export interface TeacherDTO {
  id: number;
  userId: number;
  teacherNo: string;
  name: string;
  title: string | null;
  subject: string | null;
  phone: string;
}

// ============ 班级相关 ============
export interface ClassDTO {
  id: number;
  name: string;
  gradeLevel: GradeLevel;
  homeroomTeacherId: number | null;
  homeroomTeacherName: string | null;
  academicYear: string;
  studentCount: number;
  status: string;
}

// ============ 课程相关 ============
export interface CourseDTO {
  id: number;
  name: string;
  code: string;
  gradeLevel: GradeLevel;
  teacherId: number | null;
  teacherName: string | null;
  weeklyHours: number;
  semester: Semester;
  academicYear: string;
  status: string;
}

// ============ 课表相关 ============
export interface TimetableDTO {
  id: number;
  classId: number;
  className: string;
  courseId: number;
  courseName: string;
  dayOfWeek: number;
  period: number;
  classroom: string | null;
  semester: Semester;
  academicYear: string;
}

// ============ 考试相关 ============
export interface ExamDTO {
  id: number;
  name: string;
  semester: Semester;
  academicYear: string;
  examDate: string | null;
  weight: number | null;
}

// ============ 成绩相关 ============
export interface GradeDTO {
  id: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  courseId: number;
  courseName: string;
  examTypeId: number;
  examName: string;
  score: number;
  classRank: number | null;
  gradeRank: number | null;
  totalScore: number | null;
  isPublished: boolean;
}

export interface GradeStatsDTO {
  examId: number;
  examName: string;
  courseName: string;
  studentCount: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  medianScore: number;
  passRate: number;
  excellenceRate: number;
  distribution: { range: string; count: number }[];
}

// ============ 考勤相关 ============
export interface AttendanceDTO {
  id: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  recordDate: string;
  period: AttendancePeriod;
  status: AttendanceStatus;
  remark: string | null;
  recordedBy: number | null;
}

export interface AttendanceStatsDTO {
  total: number;
  present: number;
  absent: number;
  late: number;
  earlyLeave: number;
  sickLeave: number;
  personalLeave: number;
  attendanceRate: number;
}

// ============ 请假相关 ============
export interface LeaveRequestDTO {
  id: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  attachmentUrl: string | null;
  status: LeaveStatus;
  approvedBy: number | null;
  approvalRemark: string | null;
  createdAt: string;
}

// ============ 费用相关 ============
export interface FeeItemDTO {
  id: number;
  name: string;
  amount: number;
  feeType: FeeType;
  gradeLevel: GradeLevel | null;
  semester: Semester;
  academicYear: string;
  dueDate: string | null;
  description: string | null;
}

export interface PaymentDTO {
  id: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  feeItemId: number;
  feeItemName: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  transactionId: string | null;
  paidAt: string | null;
}

// ============ 通知相关 ============
export interface NoticeDTO {
  id: number;
  title: string;
  content: string;
  category: NoticeCategory;
  targetType: NoticeTargetType;
  targetId: number | null;
  publisherId: number;
  publisherName: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

// ============ 奖惩相关 ============
export interface RewardPunishmentDTO {
  id: number;
  studentId: number;
  studentName: string;
  studentNo: string;
  type: RewardPunishmentType;
  category: string;
  description: string;
  recordDate: string;
  recordedBy: number | null;
}

// ============ 宿舍相关 ============
export interface DormitoryBuildingDTO {
  id: number;
  name: string;
  buildingType: DormitoryType;
  floorCount: number;
  description: string | null;
}

export interface DormitoryRoomDTO {
  id: number;
  buildingId: number;
  buildingName: string;
  roomNumber: string;
  capacity: number;
  occupied: number;
  status: string;
  occupants: { studentId: number; studentName: string; studentNo: string }[];
}

// ============ 通用分页 ============
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============ Excel 导入结果 ============
export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; reason: string }[];
}
