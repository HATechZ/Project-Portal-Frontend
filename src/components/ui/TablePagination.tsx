type Props = {
  page: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/** Renders controls from the API's pagination metadata. */
export function TablePagination({ page, total, totalPages, onPageChange }: Props) {
  if (totalPages < 2) return null;

  return <nav aria-label="Table pagination" className="settings-pagination"><span>Page {page} of {totalPages} · {total} records</span><div><button disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">Previous</button><button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button">Next</button></div></nav>;
}
