import { api } from "../../utils/api";

Page({
  data: {
    notices: [],
    loading: false,
    currentId: null,
    currentNotice: null,
    showDetail: false,
  },

  onShow() {
    this.loadNotices();
  },

  goBack() {
    wx.switchTab({ url: "/pages/index/index" });
  },

  async loadNotices() {
    this.setData({ loading: true });
    try {
      var data = await api.get("/notices", { pageSize: 50 });
      this.setData({ notices: (data && data.data) || [] });
    } catch {
      // ignore
    } finally {
      this.setData({ loading: false });
    }
  },

  async viewDetail(e) {
    var id = e.currentTarget.dataset.id;
    this.setData({ loading: true });
    try {
      var data = await api.get("/notices/" + id);
      this.setData({ currentNotice: data, showDetail: true, loading: false });
    } catch {
      this.setData({ loading: false });
    }
  },

  closeDetail() {
    this.setData({ showDetail: false, currentNotice: null });
  },
});
