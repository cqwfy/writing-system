const BASE_URL = "http://8.160.165.176/api/v1";

function request(options) {
  const { url, method = "GET", data, needAuth = true } = options;

  const header = { "Content-Type": "application/json" };
  if (needAuth) {
    const app = getApp();
    if (app.globalData.token) {
      header["Authorization"] = `Bearer ${app.globalData.token}`;
    }
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success(res) {
        if (res.statusCode === 401) {
          const app = getApp();
          app.logout();
          wx.reLaunch({ url: "/pages/login/login" });
          reject(new Error("登录已过期"));
          return;
        }
        if (res.data && res.data.success) {
          resolve(res.data.data);
        } else {
          reject(new Error((res.data && res.data.error) || "请求失败"));
        }
      },
      fail(err) {
        wx.showToast({ title: "网络错误", icon: "none" });
        reject(err);
      },
    });
  });
}

export const api = {
  get(url, params) {
    const query = params ? "?" + Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&") : "";
    return request({ url: url + query, method: "GET" });
  },
  post(url, data) {
    return request({ url, method: "POST", data });
  },
  put(url, data) {
    return request({ url, method: "PUT", data });
  },
  del(url) {
    return request({ url, method: "DELETE" });
  },
};
