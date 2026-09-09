import * as groupExpenseService from '../services/groupExpenseService.js';

export async function list(req, res) {
  const { items, meta } = await groupExpenseService.listExpenses(req.group, req.validated);
  res.status(200).json({ success: true, data: items, meta });
}

export async function create(req, res) {
  const expense = await groupExpenseService.createExpense(req.user, req.group, req.body);
  res.status(201).json({ success: true, data: expense });
}

/** Resolve a split without saving — powers the live preview in the form. */
export async function preview(req, res) {
  const participants = groupExpenseService.previewSplit(req.group, req.body);
  res.status(200).json({
    success: true,
    data: { participants, totalAmount: req.body.totalAmount, splitType: req.body.splitType },
  });
}

export async function getOne(req, res) {
  const expense = await groupExpenseService.getExpense(req.group, req.params.expenseId);
  res.status(200).json({ success: true, data: expense });
}

export async function update(req, res) {
  const expense = await groupExpenseService.updateExpense(
    req.group,
    req.params.expenseId,
    req.body
  );
  res.status(200).json({ success: true, data: expense });
}

export async function remove(req, res) {
  await groupExpenseService.deleteExpense(req.group, req.params.expenseId);
  res.status(204).send();
}
