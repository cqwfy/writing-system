import { api } from "../../utils/api";

var statusTextMap = {
  unpaid: "未缴",
  partial: "部分已缴",
  paid: "已缴",
  waived: "免缴",
};

Page({
  data: {
    payments: [],
    loading: false,
    totalUnpaid: 0,
  },

  onShow() {
    this.loadPayments();
  },

  async loadPayments() {
    this.setData({ loading: true });
    try {
      var data = await api.get("/fees/payments/my");
      var rawList = data || [];
      var payments = rawList.map(function (p) {
        var feeItem = p.feeItem || {};
        return {
          id: p.id,
          status: p.status,
          statusText: statusTextMap[p.status] || p.status,
          paidAmount: p.paidAmount || 0,
          itemName: feeItem.name || "-",
          itemAmount: feeItem.amount || 0,
          dueDate: feeItem.dueDate ? feeItem.dueDate.slice(0, 10) : "",
        };
      });
      var totalUnpaid = payments.reduce(function (sum, p) {
        if (p.status !== "paid" && p.status !== "waived") {
          return sum + (p.itemAmount - p.paidAmount);
        }
        return sum;
      }, 0);
      this.setData({ payments: payments, totalUnpaid: totalUnpaid });
    } catch {
      // ignore
    } finally {
      this.setData({ loading: false });
    }
  },
});
