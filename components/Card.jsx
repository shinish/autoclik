export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-xl p-4 shadow-sm ${className}`}
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, className = '' }) {
  return (
    <Card className={className}>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{title}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
    </Card>
  );
}
