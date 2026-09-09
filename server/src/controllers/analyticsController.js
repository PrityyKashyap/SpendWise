import * as analyticsService from '../services/analyticsService.js';

export async function trends(req, res) {
  const { months, month } = req.validated;
  const data = await analyticsService.getMonthlyTrends(req.user._id, {
    months,
    ...(month ? { endMonth: month } : {}),
  });
  res.status(200).json({ success: true, data });
}

export async function daily(req, res) {
  const data = await analyticsService.getDailyFlow(req.user._id, req.validated.month);
  res.status(200).json({ success: true, data });
}

export async function report(req, res) {
  const data = await analyticsService.getMonthlyReport(req.user._id, req.validated.month);
  res.status(200).json({ success: true, data });
}
