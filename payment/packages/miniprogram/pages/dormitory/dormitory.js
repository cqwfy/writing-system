import { api } from "../../utils/api";

Page({
  data: {
    info: null,
    loading: false,
    buildingName: "-",
    buildingType: "-",
  },

  onShow() {
    this.loadDormitory();
  },

  async loadDormitory() {
    this.setData({ loading: true });
    try {
      const data = await api.get("/dormitories/my");
      const building = data && data.building;
      this.setData({
        info: data,
        buildingName: (building && building.name) || "-",
        buildingType: building ? (building.buildingType === "male" ? "男生楼" : "女生楼") : "-",
      });
    } catch {
      // ignore
    } finally {
      this.setData({ loading: false });
    }
  },
});
