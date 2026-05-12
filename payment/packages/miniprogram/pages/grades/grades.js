import { api } from "../../utils/api";

Page({
  data: {
    allGrades: [],
    examNames: [],
    examIndex: 0,
    currentGrades: [],
    loading: false,
  },

  onShow() {
    this.loadGrades();
  },

  goBack() {
    wx.switchTab({ url: "/pages/index/index" });
  },

  async loadGrades() {
    this.setData({ loading: true });
    try {
      const data = await api.get("/grades/my");
      const grades = (data || []).map(function (g) {
        return {
          id: g.id,
          score: g.score,
          classRank: g.classRank,
          gradeRank: g.gradeRank,
          courseName: g.course ? g.course.name : "-",
          examName: g.examType ? g.examType.name : "未知考试",
        };
      });

      // 提取所有考试名称（去重）
      var examSet = {};
      var examNames = [];
      for (var i = 0; i < grades.length; i++) {
        var name = grades[i].examName;
        if (!examSet[name]) {
          examSet[name] = true;
          examNames.push(name);
        }
      }

      if (examNames.length > 0) {
        // 默认选中最近一次考试（最后一个）
        var examIndex = examNames.length - 1;
        var currentGrades = grades.filter(function (g) {
          return g.examName === examNames[examIndex];
        });
        this.setData({
          allGrades: grades,
          examNames: examNames,
          examIndex: examIndex,
          currentGrades: currentGrades,
        });
      } else {
        this.setData({ allGrades: [], examNames: [], currentGrades: [] });
      }
    } catch {
      // ignore
    } finally {
      this.setData({ loading: false });
    }
  },

  onExamChange(e) {
    var index = e.detail.value;
    var examName = this.data.examNames[index];
    var currentGrades = this.data.allGrades.filter(function (g) {
      return g.examName === examName;
    });
    this.setData({ examIndex: index, currentGrades: currentGrades });
  },
});
