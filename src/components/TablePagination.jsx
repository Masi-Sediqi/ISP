function TablePagination({ page, totalPages, setPage, totalItems, pageSize = 20 }) {
  if (totalItems <= pageSize) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <div className="table-pagination">
      <span>نمایش {first} تا {last} از {totalItems} ریکارد</span>
      <div>
        <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1}>قبلی</button>
        <strong>صفحه {page} از {totalPages}</strong>
        <button type="button" onClick={() => setPage(page + 1)} disabled={page === totalPages}>بعدی</button>
      </div>
    </div>
  );
}

export default TablePagination;
