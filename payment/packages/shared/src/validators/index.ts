import { z } from "zod";
import { Gender, GradeLevel, Semester, StudentStatus, AttendanceStatus, AttendancePeriod, LeaveType, FeeType, NoticeCategory, NoticeTargetType, RewardPunishmentType, ParentRelation, DormitoryType, Role } from "../constants";

// ============ 认证 ============
export const loginSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(100),
});

export const wechatLoginSchema = z.object({
  code: z.string().min(1),
});

export const bindUserSchema = z.object({
  tempToken: z.string().min(1),
  bindType: z.enum(["student_no", "parent_phone"]),
  bindValue: z.string().min(1),
});

// ============ 学生 ============
export const createStudentSchema = z.object({
  studentNo: z.string().min(1).max(20),
  name: z.string().min(1).max(50),
  gender: z.nativeEnum(Gender),
  birthDate: z.string().optional(),
  idCard: z.string().max(18).optional(),
  address: z.string().max(255).optional(),
  nativePlace: z.string().max(100).optional(),
  hobbies: z.string().max(255).optional(),
  classId: z.number().int().positive().optional(),
  enrollmentDate: z.string().optional(),
  fatherName: z.string().max(50).optional(),
  fatherPhone: z.string().max(20).optional(),
  motherName: z.string().max(50).optional(),
  motherPhone: z.string().max(20).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

// ============ 班级 ============
export const createClassSchema = z.object({
  name: z.string().min(1).max(50),
  gradeLevel: z.nativeEnum(GradeLevel),
  homeroomTeacherId: z.number().int().positive().optional(),
  academicYear: z.string().length(9),
});

export const updateClassSchema = createClassSchema.partial();

// ============ 课程 ============
export const createCourseSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  gradeLevel: z.nativeEnum(GradeLevel),
  teacherId: z.number().int().positive().optional(),
  weeklyHours: z.number().int().min(1).max(10).default(1),
  semester: z.nativeEnum(Semester),
  academicYear: z.string().length(9),
});

// ============ 课表 ============
export const createTimetableSchema = z.object({
  classId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(1).max(7),
  period: z.number().int().min(1).max(10),
  classroom: z.string().max(100).optional(),
  semester: z.nativeEnum(Semester),
  academicYear: z.string().length(9),
});

// ============ 考试 ============
export const createExamSchema = z.object({
  name: z.string().min(1).max(50),
  semester: z.nativeEnum(Semester).optional(),
  academicYear: z.string().length(9),
  examDate: z.string().optional(),
  weight: z.number().min(0).max(10).optional(),
  month: z.number().int().min(1).max(12).optional(),
});

// ============ 成绩 ============
export const createGradeSchema = z.object({
  studentId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  examTypeId: z.number().int().positive(),
  score: z.number().min(0).max(999),
});

export const batchGradeSchema = z.object({
  examTypeId: z.number().int().positive(),
  grades: z.array(z.object({
    studentId: z.number().int().positive(),
    courseId: z.number().int().positive(),
    score: z.number().min(0).max(999),
  })),
});

// ============ 考勤 ============
export const createAttendanceSchema = z.object({
  studentId: z.number().int().positive(),
  recordDate: z.string(),
  period: z.nativeEnum(AttendancePeriod),
  status: z.nativeEnum(AttendanceStatus),
  remark: z.string().max(255).optional(),
});

export const batchAttendanceSchema = z.object({
  recordDate: z.string(),
  period: z.nativeEnum(AttendancePeriod),
  records: z.array(z.object({
    studentId: z.number().int().positive(),
    status: z.nativeEnum(AttendanceStatus),
    remark: z.string().max(255).optional(),
  })),
});

// ============ 请假 ============
export const createLeaveRequestSchema = z.object({
  studentId: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  leaveType: z.nativeEnum(LeaveType),
  reason: z.string().min(1),
});

// ============ 费用 ============
export const createFeeItemSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  feeType: z.nativeEnum(FeeType),
  gradeLevel: z.nativeEnum(GradeLevel).optional(),
  semester: z.nativeEnum(Semester),
  academicYear: z.string().length(9),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

// ============ 通知 ============
export const createNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.nativeEnum(NoticeCategory),
  targetType: z.nativeEnum(NoticeTargetType),
  targetId: z.number().int().positive().optional(),
});

// ============ 奖惩 ============
export const createRewardPunishmentSchema = z.object({
  studentId: z.number().int().positive(),
  type: z.nativeEnum(RewardPunishmentType),
  category: z.string().min(1).max(50),
  description: z.string().min(1),
  recordDate: z.string(),
});

// ============ 宿舍 ============
export const createBuildingSchema = z.object({
  name: z.string().min(1).max(50),
  buildingType: z.nativeEnum(DormitoryType),
  floorCount: z.number().int().min(1).max(20),
  description: z.string().max(255).optional(),
});

export const createRoomSchema = z.object({
  buildingId: z.number().int().positive(),
  roomNumber: z.string().min(1).max(20),
  capacity: z.number().int().min(1).max(10).default(4),
});
