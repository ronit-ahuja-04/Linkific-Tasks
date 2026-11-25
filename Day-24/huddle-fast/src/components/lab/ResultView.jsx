/** Shows what an example returned: a status line, a table for rows, the raw JSON, and the error (code + message) when there is one */
function cell(value) {
  if (value === null || value === undefined) return 'null';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export default function ResultView({ outcome, expect }) {
  if (!outcome) return null;
  const { status, data, count, error, message } = outcome;
  const rows = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : [];
  const columns = rows.length > 0 ? [...new Set(rows.flatMap((row) => Object.keys(row)))].slice(0, 8) : [];

  let summary;
  if (status === 'skipped') summary = message;
  else if (status === 'error') summary = `Error${error.code ? ` ${error.code}` : ''}: ${error.message}${expect === 'error' ? ' (this is the expected result: the database said no)' : ''}`;
  else if (status === 'empty') summary = `0 rows, and no error${count !== null && count !== undefined ? `, count: ${count}` : ''}${expect === 'empty' ? ' (this is the expected result: RLS filtered everything out)' : ''}`;
  else if (data === null && count !== null && count !== undefined) summary = `count: ${count} (no rows were sent: head: true)`;
  else summary = `${rows.length} row${rows.length === 1 ? '' : 's'}${count !== null && count !== undefined ? `, count: ${count}` : ''}`;

  return (
    <div className="lab-result">
      <p className={`lab-result-status lab-result-${status === 'error' && expect !== 'error' ? 'bad' : status}`} role={status === 'error' ? 'alert' : 'status'}>{summary}</p>
      {rows.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead><tr>{columns.map((name) => <th key={name} scope="col">{name}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, index) => <tr key={index}>{columns.map((name) => <td key={name}>{cell(row[name])}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      )}
      {(rows.length > 0 || error) && (
        <details className="lab-json">
          <summary>Raw JSON</summary>
          <pre>{JSON.stringify(error ?? data, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
