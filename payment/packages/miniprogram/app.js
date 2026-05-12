App({
  globalData: {
    token: "",
    refreshToken: "",
    userInfo: null,
  },

  onLaunch() {
    const token = wx.getStorageSync("token");
    const refreshToken = wx.getStorageSync("refreshToken");
    const userInfo = wx.getStorageSync("userInfo");

    if (token) {
      this.globalData.token = token;
      this.globalData.refreshToken = refreshToken;
      this.globalData.userInfo = userInfo || null;
    }
  },

  checkLogin() {
    return !!this.globalData.token;
  },

  setAuth(token, refreshToken, userInfo) {
    this.globalData.token = token;
    this.globalData.refreshToken = refreshToken;
    this.globalData.userInfo = userInfo;
    wx.setStorageSync("token", token);
    wx.setStorageSync("refreshToken", refreshToken);
    wx.setStorageSync("userInfo", userInfo);
  },

  logout() {
    this.globalData.token = "";
    this.globalData.refreshToken = "";
    this.globalData.userInfo = null;
    wx.removeStorageSync("token");
    wx.removeStorageSync("refreshToken");
    wx.removeStorageSync("userInfo");
  },
});
