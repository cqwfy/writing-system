var app = getApp();
import { api } from "../../utils/api";

var roleTextMap = {
  student: "学生",
  parent: "家长",
  teacher: "教师",
  admin: "管理员",
};

Page({
  data: {
    userInfo: null,
    profile: null,
    displayName: "--",
    displayRole: "--",
    loading: false,
  },

  onShow() {
    if (!app.checkLogin()) {
      wx.redirectTo({ url: "/pages/login/login" });
      return;
    }
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadProfile();
  },

  goBack() {
    wx.switchTab({ url: "/pages/index/index" });
  },

  async loadProfile() {
    this.setData({ loading: true });
    try {
      var data = await api.get("/auth/me");
      this.setData({
        profile: data,
        displayName: (data && data.name) || (app.globalData.userInfo && app.globalData.userInfo.name) || "--",
        displayRole: data ? (roleTextMap[data.role] || data.role || "--") : "--",
      });
      app.globalData.userInfo = data;
      wx.setStorageSync("userInfo", data);
    } catch {
      // ignore
    } finally {
      this.setData({ loading: false });
    }
  },

  handleLogout() {
    wx.showModal({
      title: "退出登录",
      content: "确定要退出登录吗？",
      success: function (res) {
        if (res.confirm) {
          app.logout();
          wx.reLaunch({ url: "/pages/login/login" });
        }
      },
    });
  },
});
