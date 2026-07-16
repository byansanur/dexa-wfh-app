export default function Pagination({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
      <button 
        className="btn" 
        style={{ width: 'auto', padding: '0.5rem 1rem', background: page <= 1 ? '#cbd5e1' : 'var(--primary)' }}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      <span style={{ fontWeight: 500 }}>Page {page} of {totalPages}</span>
      <button 
        className="btn" 
        style={{ width: 'auto', padding: '0.5rem 1rem', background: page >= totalPages ? '#cbd5e1' : 'var(--primary)' }}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
