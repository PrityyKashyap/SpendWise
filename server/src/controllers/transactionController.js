import * as transactionService from '../services/transactionService.js';

export async function list(req, res) {
  const { items, meta } = await transactionService.listTransactions(req.user._id, req.validated);
  res.status(200).json({ success: true, data: items, meta });
}

export async function getOne(req, res) {
  const transaction = await transactionService.getTransaction(req.user._id, req.params.id);
  res.status(200).json({ success: true, data: transaction });
}

export async function create(req, res) {
  const transaction = await transactionService.createTransaction(req.user._id, req.body);
  res.status(201).json({ success: true, data: transaction });
}

export async function update(req, res) {
  const transaction = await transactionService.updateTransaction(
    req.user._id,
    req.params.id,
    req.body
  );
  res.status(200).json({ success: true, data: transaction });
}

export async function remove(req, res) {
  await transactionService.deleteTransaction(req.user._id, req.params.id);
  res.status(204).send();
}
