const { formatPrice, formatChange, formatDate, getDirection } = require('./formatData');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateHtml(data) {
  const dateStr = formatDate(data.date);

  const marketRows = data.markets.length === 0
    ? '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:2rem;">データがありません</td></tr>'
    : data.markets.map(m => {
        const dir = getDirection(m.change);
        const color = dir === 'up' ? 'var(--green)' : dir === 'down' ? 'var(--red)' : 'var(--text)';
        return `      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td style="text-align:right">${formatPrice(m.close)}</td>
        <td style="text-align:right;color:${color}">${formatChange(m.change, m.changePercent)}</td>
      </tr>`;
      }).join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>株式市場レポート | ${dateStr}</title>
  <style>
    :root { --bg:#f5f7fa; --card:#fff; --text:#1a1a2e; --muted:#6b7280; --green:#16a34a; --red:#dc2626; --border:#e5e7eb; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans",sans-serif; background:var(--bg); color:var(--text); line-height:1.7; padding:2rem 1rem; }
    .container { max-width:640px; margin:0 auto; }
    h1 { font-size:1.5rem; margin-bottom:0.25rem; }
    .date { color:var(--muted); margin-bottom:1.5rem; }
    table { width:100%; border-collapse:collapse; background:var(--card); border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    th, td { padding:0.75rem 1rem; text-align:left; border-bottom:1px solid var(--border); }
    th { background:var(--bg); font-weight:600; font-size:0.85rem; color:var(--muted); }
  </style>
</head>
<body>
  <div class="container">
    <h1>株式市場レポート</h1>
    <p class="date">${dateStr}</p>
    <table>
      <thead>
        <tr><th>市場</th><th style="text-align:right">終値</th><th style="text-align:right">前日比</th></tr>
      </thead>
      <tbody>
${marketRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

module.exports = { generateHtml };
