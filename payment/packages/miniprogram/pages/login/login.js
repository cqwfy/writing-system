import { api } from "../../utils/api";

const app = getApp();

Page({
  data: {
    isLoading: false,
    showBind: false,
    tempToken: "",
    bindType: "student_no",
    bindValue: "",
  },

  onLoad() {
    if (app.checkLogin()) {
      wx.switchTab({ url: "/pages/index/index" });
    }
  },

  /** 微信一键登录 */
  handleWechatLogin() {
    this.setData({ isLoading: true });

    wx.login({
      success: async (res) => {
        if (!res.code) {
          wx.showToast({ title: "获取微信授权失败", icon: "none" });
          this.setData({ isLoading: false });
          return;
        }

        try {
          const result = await api.post("/auth/wechat-login", { code: res.code });

          if (result.isNewUser) {
            this.setData({ showBind: true, tempToken: result.tempToken, isLoading: false });
          } else {
            app.setAuth(result.tokens.accessToken, result.tokens.refreshToken, result.user);
            wx.switchTab({ url: "/pages/index/index" });
          }
        } catch (err) {
          wx.showToast({ title: err.message || "登录失败", icon: "none" });
          this.setData({ isLoading: false });
        }
      },
      fail: () => {
        wx.showToast({ title: "微信登录失败", icon: "none" });
        this.setData({ isLoading: false });
      },
    });
  },

  /** 选择绑定类型 */
  onBindTypeChange(e) {
    this.setData({ bindType: e.currentTarget.dataset.value, bindValue: "" });
  },

  /** 输入绑定值 */
  onBindValueInput(e) {
    this.setData({ bindValue: e.detail.value });
  },

  /** 提交绑定 */
  async handleBind() {
    const { tempToken, bindType, bindValue } = this.data;

    if (!bindValue.trim()) {
      wx.showToast({ title: bindType === "student_no" ? "请输入学号" : "请输入手机号", icon: "none" });
      return;
    }

    this.setData({ isLoading: true });

    try {
      const result = await api.post("/auth/bind", {
        tempToken,
        bindType,
        bindValue: bindValue.trim(),
      });

      app.setAuth(result.tokens.accessToken, result.tokens.refreshToken, result.user);
      wx.switchTab({ url: "/pages/index/index" });
    } catch (err) {
      wx.showToast({ title: err.message || "绑定失败", icon: "none" });
      this.setData({ isLoading: false });
    }
  },

  /** 跳过绑定 */
  handleSkip() {
    app.logout();
    wx.switchTab({ url: "/pages/index/index" });
  },
});
