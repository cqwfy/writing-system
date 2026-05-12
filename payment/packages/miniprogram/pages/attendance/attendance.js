import { api } from "../../utils/api";

Page({
  data: {
    records: [],
    loading: false,
    tab: "records",
    // 请假表单
    leaveType: "sick",
    startDate: "",
    endDate: "",
    reason: "",
    submitting: false,
    leaveList: [],
  },

  onShow() {
    if (this.data.tab === "records") {
      this.loadAttendance();
    } else {
      this.loadLeaveRequests();
    }
  },

  async loadAttendance() {
    this.setData({ loading: true });
    try {
      var data = await api.get("/attendance/my", { pageSize: 100 });
      this.setData({ records: (data && data.data) || [] });
    } catch {
      // ignore
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadLeaveRequests() {
    this.setData({ loading: true });
    try {
      var data = await api.get("/attendance/leave-requests/my");
      this.setData({ leaveList: data || [] });
    } catch {
      // ignore
    } finally {
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ tab: tab });
    if (tab === "records") this.loadAttendance();
    else this.loadLeaveRequests();
  },

  onLeaveTypeChange(e) {
    this.setData({ leaveType: e.detail.value === 0 ? "sick" : "personal" });
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  onReasonInput(e) {
    this.setData({ reason: e.detail.value });
  },

  async submitLeave() {
    var leaveType = this.data.leaveType;
    var startDate = this.data.startDate;
    var endDate = this.data.endDate;
    var reason = this.data.reason;

    if (!startDate) {
      wx.showToast({ title: "请选择开始日期", icon: "none" });
      return;
    }
    if (!endDate) {
      wx.showToast({ title: "请选择结束日期", icon: "none" });
      return;
    }
    if (!reason.trim()) {
      wx.showToast({ title: "请填写请假原因", icon: "none" });
      return;
    }

    var app = getApp();
    var userInfo = app.globalData.userInfo;
    var studentId = (userInfo && userInfo.student && userInfo.student.id)
      || (userInfo && userInfo.parent && userInfo.parent.studentId);
    if (!studentId) {
      wx.showToast({ title: "未绑定学生信息", icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    try {
      await api.post("/attendance/leave-requests", {
        studentId: studentId,
        leaveType: leaveType,
        startDate: startDate,
        endDate: endDate,
        reason: reason.trim(),
      });
      wx.showToast({ title: "提交成功", icon: "success" });
      this.setData({ startDate: "", endDate: "", reason: "", submitting: false });
      this.loadLeaveRequests();
    } catch (err) {
      wx.showToast({ title: err.message || "提交失败", icon: "none" });
      this.setData({ submitting: false });
    }
  },
});
