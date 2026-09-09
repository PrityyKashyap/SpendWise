import * as budgetService from '../services/budgetService.js';
import * as insightsService from '../services/insightsService.js';

export async function progress(req, res) {
  const data = await budgetService.getBudgetProgress(req.user._id, req.validated?.month);
  res.status(200).json({ success: true, data });
}

export async function create(req, res) {
  const budget = await budgetService.createBudget(req.user._id, req.body);
  res.status(201).json({ success: true, data: budget });
}

export async function update(req, res) {
  const budget = await budgetService.updateBudget(req.user._id, req.params.budgetId, req.body);
  res.status(200).json({ success: true, data: budget });
}

export async function remove(req, res) {
  await budgetService.deleteBudget(req.user._id, req.params.budgetId);
  res.status(204).send();
}

export async function insights(req, res) {
  const data = await insightsService.getInsights(req.user._id, req.validated?.month);
  res.status(200).json({ success: true, data });
}
