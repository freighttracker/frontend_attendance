import { titleCase } from '@/lib/utils/format';
import EmptyState from './EmptyState';

function formatCell(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.length;
    return value.name || value.firstName ? `${value.firstName || ''} ${value.lastName || value.name || ''}`.trim() : JSON.stringify(value);
  }
  return String(value);
}

function DynamicTable({ rows }) {
  const columns = Object.keys(rows[0] || {}).filter((key) => !key.startsWith('_'));
  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{titleCase(col)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row._id || row.id || idx}>
              {columns.map((col) => (
                <td key={col}>{formatCell(row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DynamicResult({ data }) {
  if (!data) return <EmptyState>Select filters and click Generate</EmptyState>;

  const listKey = Object.keys(data).find((key) => Array.isArray(data[key]));
  const rows = Array.isArray(data) ? data : listKey ? data[listKey] : null;

  if (rows) {
    return rows.length ? <DynamicTable rows={rows} /> : <EmptyState>No data for this period</EmptyState>;
  }

  const entries = Object.entries(data).filter(([, v]) => typeof v !== 'object');
  if (!entries.length) return <EmptyState>No data for this period</EmptyState>;

  return (
    <div className="card" style={{ padding: '0 16px' }}>
      {entries.map(([key, value]) => (
        <div className="prow" key={key}>
          <span className="pl">{titleCase(key)}</span>
          <span className="pv">{formatCell(value)}</span>
        </div>
      ))}
    </div>
  );
}
