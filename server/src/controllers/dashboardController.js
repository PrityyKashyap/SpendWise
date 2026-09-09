import * as dashboardService from '../services/dashboardService.js';

export async function summary(req, res) {
  const data = await dashboardService.getSummary(req.user._id, req.validated?.month);
  res.status(200).json({ success: true, data });
}

export async function spending(req, res) {
  const data = await dashboardService.getSpendingByCategory(req.user._id, req.validated?.month);
  res.status(200).json({ success: true, data });
}

export async function recent(req, res) {
  const data = await dashboardService.getRecentTransactions(req.user._id, req.validated?.limit);
  res.status(200).json({ success: true, data });
}
