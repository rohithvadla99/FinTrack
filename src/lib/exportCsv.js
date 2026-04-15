import { getCategoryLabel } from './categories';

export function exportTransactionsCsv(transactions) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  const rows = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(t => [
      t.date,
      t.type,
      getCategoryLabel(t.category),
      t.description || '',
      t.amount.toFixed(2),
    ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moneyflow-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}