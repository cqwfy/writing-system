const app = getApp();

Page({
  data: {
    userInfo: null,
  },

  onShow() {
    if (!app.checkLogin()) {
      wx.redirectTo({ url: "/pages/login/login" });
      return;
    }
    this.setData({ userInfo: app.globalData.userInfo });
  },

  goToGrades() {
    wx.switchTab({ url: "/pages/grades/grades" });
  },

  goToAttendance() {
    wx.navigateTo({ url: "/pages/attendance/attendance" });
  },

  goToFees() {
    wx.navigateTo({ url: "/pages/fees/fees" });
  },

  goToNotices() {
    wx.switchTab({ url: "/pages/notices/notices" });
  },

  goToProfile() {
    wx.switchTab({ url: "/pages/profile/profile" });
  },
});
