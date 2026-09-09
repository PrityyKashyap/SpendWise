import api from './api.js';

/** GET /categories?type= → system defaults + this user's custom categories. */
export function listCategories(params = {}) {
  return api.get('/categories', { params });
}

export function createCategory(data) {
  return api.post('/categories', data);
}

export function updateCategory(id, data) {
  return api.patch(`/categories/${id}`, data);
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`);
}
