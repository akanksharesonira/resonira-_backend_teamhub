const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const parseSort = (query, allowedFields = ['created_at']) => {
  const sortField = allowedFields.includes(query.sortBy) ? query.sortBy : 'created_at';
  const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  return [[sortField, sortOrder]];
};

module.exports = { parsePagination, parseSort };
