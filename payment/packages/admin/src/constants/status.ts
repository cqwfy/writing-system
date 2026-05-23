/**
 * 学校管理系统 - 统一状态颜色映射
 * 所有页面引用此文件，确保颜色语义一致
 */

/** 性别 */
export const GENDER_MAP: Record<string, { text: string; color: string }> = {
  male: { text: "男", color: "blue" },
  female: { text: "女", color: "pink" },
};

/** 学生状态 */
export const STUDENT_STATUS_MAP: Record<string, { text: string; color: string }> = {
  active: { text: "在读", color: "green" },
  graduated: { text: "毕业", color: "blue" },
  transferred: { text: "转学", color: "orange" },
  withdrawn: { text: "休学", color: "red" },
};

/** 考勤状态 */
export const ATTENDANCE_STATUS_MAP: Record<string, { text: string; color: string }> = {
  present: { text: "出勤", color: "green" },
  absent: { text: "缺勤", color: "red" },
  late: { text: "迟到", color: "orange" },
  early_leave: { text: "早退", color: "gold" },
  sick_leave: { text: "病假", color: "blue" },
  personal_leave: { text: "事假", color: "purple" },
};

/** 请假审批状态 */
export const LEAVE_STATUS_MAP: Record<string, { text: string; color: string }> = {
  pending: { text: "待审批", color: "orange" },
  approved: { text: "已批准", color: "green" },
  rejected: { text: "已拒绝", color: "red" },
};

/** 缴费状态 */
export const PAYMENT_STATUS_MAP: Record<string, { text: string; color: string }> = {
  unpaid: { text: "未缴", color: "red" },
  partial: { text: "部分", color: "orange" },
  paid: { text: "已缴", color: "green" },
  waived: { text: "免除", color: "default" },
};

/** 宿舍楼类型 */
export const BUILDING_TYPE_MAP: Record<string, { text: string; color: string }> = {
  male: { text: "男", color: "blue" },
  female: { text: "女", color: "pink" },
};
