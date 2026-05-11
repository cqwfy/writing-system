// ============ 用户角色 ============
export enum Role {
  ADMIN = "admin",
  TEACHER = "teacher",
  STUDENT = "student",
  PARENT = "parent",
}

// ============ 用户状态 ============
export enum UserStatus {
  ACTIVE = "active",
  DISABLED = "disabled",
}

// ============ 性别 ============
export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

// ============ 年级 ============
export enum GradeLevel {
  SEVEN = "7",
  EIGHT = "8",
  NINE = "9",
}

// ============ 学期 ============
export enum Semester {
  FIRST = "first",
  SECOND = "second",
}

// ============ 学生状态 ============
export enum StudentStatus {
  ACTIVE = "active",
  TRANSFERRED = "transferred",
  GRADUATED = "graduated",
  WITHDRAWN = "withdrawn",
}

// ============ 考勤状态 ============
export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  EARLY_LEAVE = "early_leave",
  SICK_LEAVE = "sick_leave",
  PERSONAL_LEAVE = "personal_leave",
}

// ============ 考勤时段 ============
export enum AttendancePeriod {
  MORNING = "morning",
  AFTERNOON = "afternoon",
  FULL_DAY = "full_day",
}

// ============ 请假类型 ============
export enum LeaveType {
  SICK = "sick",
  PERSONAL = "personal",
  OTHER = "other",
}

// ============ 请假状态 ============
export enum LeaveStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// ============ 费用类型 ============
export enum FeeType {
  TUITION = "tuition",
  MISCELLANEOUS = "miscellaneous",
  DORMITORY = "dormitory",
  MEAL = "meal",
  OTHER = "other",
}

// ============ 缴费状态 ============
export enum PaymentStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
  WAIVED = "waived",
}

// ============ 通知分类 ============
export enum NoticeCategory {
  NOTICE = "notice",
  ANNOUNCEMENT = "announcement",
  HOMEWORK = "homework",
  EVENT = "event",
  COMMUNICATION = "communication",
}

// ============ 通知目标类型 ============
export enum NoticeTargetType {
  ALL = "all",
  GRADE = "grade",
  CLASS = "class",
  SPECIFIC = "specific",
}

// ============ 奖惩类型 ============
export enum RewardPunishmentType {
  REWARD = "reward",
  PUNISHMENT = "punishment",
}

// ============ 家长关系 ============
export enum ParentRelation {
  FATHER = "father",
  MOTHER = "mother",
  GUARDIAN = "guardian",
}

// ============ 宿舍类型 ============
export enum DormitoryType {
  MALE = "male",
  FEMALE = "female",
}

// ============ 考试名称 ============
export enum ExamName {
  MONTHLY = "月考",
  MIDTERM = "期中",
  FINAL = "期末",
}

// ============ 角色权限映射 ============
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: ["*"],
  [Role.TEACHER]: [
    "student:read",
    "class:read",
    "course:read",
    "timetable:read",
    "attendance:write",
    "attendance:read",
    "leave:approve",
    "grade:write",
    "grade:read",
    "grade:stats",
    "fee:read",
    "payment:read",
    "notice:read",
    "dormitory:read",
    "reward:read",
  ],
  [Role.STUDENT]: [
    "student:self",
    "timetable:self",
    "attendance:self",
    "leave:self",
    "grade:self",
    "payment:self",
    "notice:self",
    "dormitory:self",
    "reward:self",
  ],
  [Role.PARENT]: [
    "student:child",
    "timetable:child",
    "attendance:child",
    "leave:child",
    "grade:child",
    "payment:child",
    "notice:child",
    "dormitory:child",
    "reward:child",
  ],
};
