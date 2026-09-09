import * as settlementService from '../services/settlementService.js';

export async function balances(req, res) {
  const data = await settlementService.getBalances(req.group, {
    simplify: req.validated?.simplify ?? false,
    forMemberId: req.member?._id,
  });
  res.status(200).json({ success: true, data });
}

export async function list(req, res) {
  const data = await settlementService.listSettlements(req.group, req.validated ?? {});
  res.status(200).json({ success: true, data });
}

export async function create(req, res) {
  const settlement = await settlementService.createSettlement(req.user, req.group, req.body);
  res.status(201).json({ success: true, data: settlement });
}

export async function cancel(req, res) {
  const settlement = await settlementService.cancelSettlement(req.group, req.params.settlementId);
  res.status(200).json({ success: true, data: settlement });
}
