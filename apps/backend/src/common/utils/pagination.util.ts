export function getPaginationMeta(total: number, page: string | number, limit: string | number) {
  const take = typeof limit === 'string' ? parseInt(limit, 10) || 10 : limit;
  const pageNum = typeof page === 'string' ? parseInt(page, 10) || 1 : page;
  const skip = (pageNum - 1) * take;

  return {
    skip,
    take,
    pageNum,
    meta: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take),
    }
  };
}
