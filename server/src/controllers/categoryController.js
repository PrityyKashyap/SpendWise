import * as categoryService from '../services/categoryService.js';

export async function list(req, res) {
  const categories = await categoryService.listCategories(req.user._id, req.validated ?? {});
  res.status(200).json({ success: true, data: categories });
}

export async function create(req, res) {
  const category = await categoryService.createCategory(req.user._id, req.body);
  res.status(201).json({ success: true, data: category });
}

export async function update(req, res) {
  const category = await categoryService.updateCategory(req.user._id, req.params.id, req.body);
  res.status(200).json({ success: true, data: category });
}

export async function remove(req, res) {
  await categoryService.deleteCategory(req.user._id, req.params.id);
  res.status(204).send();
}
