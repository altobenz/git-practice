const {
  formatPrice, formatChange, formatDate, getDirection,
  formatVolume, formatPercent, formatTime, getImportanceLabel, getFearGreedLabel,
} = require('./formatData');

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function colorForDirection(dir) {
  if (dir === 'up') return 'var(--green)';
  if (dir === 'down') return 'var(--red)';
  return 'var(--text)';
}

const countryFlags = {
  JP: '\u{1F1EF}\u{1F1F5}', US: '\u{1F1FA}\u{1F1F8}', EU: '\u{1F1EA}\u{1F1FA}',
  GB: '\u{1F1EC}\u{1F1E7}', CN: '\u{1F1E8}\u{1F1F3}', DE: '\u{1F1E9}\u{1F1EA}',
};

function getFlag(country) {
  return countryFlags[country] || country;
}

function renderMarketTable(markets) {
  if (!markets || markets.length === 0) {
    return '<p class="no-data">データがありません</p>';
  }
  const rows = markets.map(m => {
    const dir = getDirection(m.change);
    const color = colorForDirection(dir);
    const arrow = dir === 'up' ? '&#9650;' : dir === 'down' ? '&#9660;' : '';
    const vol = m.volume ? `<td class="num">${formatVolume(m.volume)}</td>` : '<td class="num">-</td>';
    return `<tr>
      <td class="name">${escapeHtml(m.name)}</td>
      <td class="num">${formatPrice(m.close)}</td>
      <td class="num" style="color:${color}">${arrow} ${formatChange(m.change, m.changePercent)}</td>
      ${vol}
    </tr>`;
  }).join('\n');

  return `<table class="data-table">
    <thead><tr><th>市場</th><th class="num">終値</th><th class="num">前日比</th><th class="num">出来高</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderForexTable(forex) {
  if (!forex || forex.length === 0) return '<p class="no-data">データなし</p>';
  const rows = forex.map(f => {
    const dir = getDirection(f.change);
    const color = colorForDirection(dir);
    const rateStr = f.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return `<tr>
      <td class="name">${escapeHtml(f.pair)}</td>
      <td class="num">${rateStr}</td>
      <td class="num" style="color:${color}">${formatPercent(f.changePercent)}</td>
    </tr>`;
  }).join('\n');

  return `<table class="data-table">
    <thead><tr><th>通貨ペア</th><th class="num">レート</th><th class="num">前日比</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderCommoditiesTable(commodities) {
  if (!commodities || commodities.length === 0) return '<p class="no-data">データなし</p>';
  const rows = commodities.map(c => {
    const dir = getDirection(c.change);
    const color = colorForDirection(dir);
    return `<tr>
      <td class="name">${escapeHtml(c.name)}</td>
      <td class="num">${formatPrice(c.price)}</td>
      <td class="num muted">${escapeHtml(c.unit)}</td>
      <td class="num" style="color:${color}">${formatPercent(c.changePercent)}</td>
    </tr>`;
  }).join('\n');

  return `<table class="data-table">
    <thead><tr><th>商品</th><th class="num">価格</th><th class="num">単位</th><th class="num">前日比</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderSectors(sectors) {
  if (!sectors || sectors.length === 0) return '<p class="no-data">データなし</p>';
  const sorted = [...sectors].sort((a, b) => b.changePercent - a.changePercent);
  const bars = sorted.map(s => {
    const dir = getDirection(s.changePercent);
    const color = colorForDirection(dir);
    const width = Math.min(Math.abs(s.changePercent) * 30, 100);
    const align = s.changePercent >= 0 ? 'right' : 'left';
    return `<div class="sector-row">
      <span class="sector-name">${escapeHtml(s.name)}</span>
      <span class="sector-bar-container">
        <span class="sector-bar" style="width:${width}%;background:${color};float:${align}"></span>
      </span>
      <span class="sector-value" style="color:${color}">${formatPercent(s.changePercent)}</span>
    </div>`;
  }).join('\n');
  return `<div class="sector-chart">${bars}</div>`;
}

function renderNews(news) {
  if (!news || news.length === 0) return '<p class="no-data">ニュースデータなし</p>';
  const items = news.map(n => {
    const cat = n.category ? `<span class="news-category">${escapeHtml(n.category)}</span>` : '';
    const src = n.source ? `<span class="news-source">${escapeHtml(n.source)}</span>` : '';
    const summary = n.summary ? `<p class="news-summary">${escapeHtml(n.summary)}</p>` : '';
    const link = n.url ? ` href="${escapeHtml(n.url)}" target="_blank" rel="noopener"` : '';
    return `<article class="news-item">
      <div class="news-meta">${cat}${src}</div>
      <h3 class="news-title"><a${link}>${escapeHtml(n.title)}</a></h3>
      ${summary}
    </article>`;
  }).join('\n');
  return `<div class="news-list">${items}</div>`;
}

function renderCalendar(calendar) {
  if (!calendar || calendar.length === 0) return '<p class="no-data">本日の予定なし</p>';
  const rows = calendar.map(e => {
    const flag = getFlag(e.country);
    const stars = getImportanceLabel(e.importance);
    return `<tr>
      <td class="cal-time">${formatTime(e.time)}</td>
      <td class="cal-country">${flag}</td>
      <td>${escapeHtml(e.event)}</td>
      <td class="cal-importance">${stars}</td>
    </tr>`;
  }).join('\n');

  return `<table class="data-table calendar-table">
    <thead><tr><th>時刻</th><th>国</th><th>イベント</th><th>重要度</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderFearGreed(fg) {
  if (!fg) return '';
  const info = getFearGreedLabel(fg.value);
  const pct = fg.value;
  return `<div class="fear-greed">
    <div class="fg-header">Fear &amp; Greed Index</div>
    <div class="fg-value" style="color:${info.color}">${fg.value}</div>
    <div class="fg-label" style="color:${info.color}">${info.label}</div>
    <div class="fg-gauge">
      <div class="fg-gauge-bg">
        <div class="fg-gauge-fill" style="width:${pct}%;background:${info.color}"></div>
        <div class="fg-gauge-marker" style="left:${pct}%"></div>
      </div>
      <div class="fg-gauge-labels"><span>Extreme Fear</span><span>Extreme Greed</span></div>
    </div>
  </div>`;
}

function generateHtml(data) {
  const dateStr = formatDate(data.date);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const d = new Date(data.date + 'T00:00:00+09:00');
  const dayOfWeek = days[d.getDay()];

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>株式市場デイリーレポート | ${dateStr}</title>
  <style>
    :root {
      --bg: #f4f1eb;
      --card: #fff;
      --text: #1a1a2e;
      --muted: #6b7280;
      --green: #16a34a;
      --red: #dc2626;
      --border: #d1c7b7;
      --accent: #1a1a2e;
      --header-bg: #1a1a2e;
      --header-text: #f4f1eb;
      --link: #1d4ed8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.8;
      padding: 0;
    }

    /* ヘッダー */
    .header {
      background: var(--header-bg);
      color: var(--header-text);
      text-align: center;
      padding: 1.5rem 1rem 1rem;
      border-bottom: 4px double var(--border);
    }
    .header h1 {
      font-size: 2rem;
      letter-spacing: 0.3em;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .header .date-line {
      font-size: 1rem;
      opacity: 0.85;
      font-family: sans-serif;
    }
    .header .edition {
      font-size: 0.75rem;
      opacity: 0.6;
      margin-top: 0.25rem;
      font-family: sans-serif;
    }

    /* メインコンテナ */
    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }

    /* セクション */
    .section {
      margin-bottom: 1.5rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 4px;
      overflow: hidden;
    }
    .section-title {
      font-size: 1rem;
      font-weight: 700;
      padding: 0.6rem 1rem;
      background: var(--accent);
      color: var(--header-text);
      letter-spacing: 0.15em;
      font-family: sans-serif;
    }
    .section-body {
      padding: 1rem;
    }

    /* サマリー */
    .summary-text {
      font-size: 1.05rem;
      line-height: 2;
      border-left: 4px solid var(--accent);
      padding-left: 1rem;
    }

    /* 2カラムグリッド */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 700px) {
      .grid-2 { grid-template-columns: 1fr; }
    }

    /* テーブル */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .data-table th, .data-table td {
      padding: 0.5rem 0.6rem;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    .data-table th {
      font-weight: 600;
      font-size: 0.8rem;
      color: var(--muted);
      background: rgba(0,0,0,0.02);
    }
    .data-table .num { text-align: right; font-variant-numeric: tabular-nums; }
    .data-table .name { font-weight: 600; }
    .data-table .muted { color: var(--muted); font-size: 0.8rem; }

    /* セクターチャート */
    .sector-chart { font-family: sans-serif; }
    .sector-row {
      display: flex;
      align-items: center;
      padding: 0.35rem 0;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      font-size: 0.9rem;
    }
    .sector-name { width: 120px; font-weight: 600; flex-shrink: 0; }
    .sector-bar-container {
      flex: 1;
      height: 18px;
      background: rgba(0,0,0,0.04);
      border-radius: 3px;
      margin: 0 0.5rem;
      overflow: hidden;
    }
    .sector-bar { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .sector-value { width: 70px; text-align: right; font-weight: 600; flex-shrink: 0; font-variant-numeric: tabular-nums; }

    /* ニュース */
    .news-list { font-family: sans-serif; }
    .news-item {
      padding: 0.8rem 0;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .news-item:last-child { border-bottom: none; }
    .news-meta { font-size: 0.75rem; margin-bottom: 0.2rem; }
    .news-category {
      display: inline-block;
      background: var(--accent);
      color: #fff;
      padding: 0.1rem 0.5rem;
      border-radius: 3px;
      font-size: 0.7rem;
      margin-right: 0.5rem;
      font-weight: 600;
    }
    .news-source { color: var(--muted); }
    .news-title { font-size: 1rem; font-weight: 700; line-height: 1.5; }
    .news-title a { color: var(--text); text-decoration: none; }
    .news-title a:hover { color: var(--link); }
    .news-summary { font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem; line-height: 1.6; }

    /* カレンダー */
    .calendar-table .cal-time { font-weight: 600; white-space: nowrap; width: 60px; }
    .calendar-table .cal-country { text-align: center; width: 40px; }
    .calendar-table .cal-importance { text-align: center; width: 60px; color: #ca8a04; }

    /* Fear & Greed */
    .fear-greed {
      text-align: center;
      padding: 0.5rem;
      font-family: sans-serif;
    }
    .fg-header { font-size: 0.85rem; font-weight: 600; color: var(--muted); margin-bottom: 0.3rem; }
    .fg-value { font-size: 2.5rem; font-weight: 800; line-height: 1.2; }
    .fg-label { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .fg-gauge-bg {
      width: 100%;
      height: 12px;
      background: linear-gradient(to right, #7b2d8e, #dc2626, #ca8a04, #ea580c, #16a34a);
      border-radius: 6px;
      position: relative;
    }
    .fg-gauge-fill { display: none; }
    .fg-gauge-marker {
      position: absolute;
      top: -4px;
      width: 4px;
      height: 20px;
      background: var(--text);
      border-radius: 2px;
      transform: translateX(-50%);
    }
    .fg-gauge-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--muted);
      margin-top: 0.2rem;
    }

    /* データなし */
    .no-data { color: var(--muted); text-align: center; padding: 1.5rem; font-family: sans-serif; }

    /* フッター */
    .footer {
      text-align: center;
      padding: 1rem;
      font-size: 0.75rem;
      color: var(--muted);
      border-top: 2px solid var(--border);
      margin-top: 1rem;
      font-family: sans-serif;
    }

    /* 印刷対応 */
    @media print {
      body { background: #fff; padding: 0; font-size: 10pt; }
      .header { background: #fff; color: #000; border-bottom: 3px double #000; }
      .section { border: 1px solid #ccc; break-inside: avoid; }
      .section-title { background: #eee; color: #000; }
      .grid-2 { grid-template-columns: 1fr 1fr; }
      .fg-gauge-bg { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .news-category { background: #333; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>株式市場デイリーレポート</h1>
    <div class="date-line">${dateStr}（${dayOfWeek}）</div>
    <div class="edition">${data.generatedAt ? 'Generated: ' + data.generatedAt : ''}</div>
  </div>

  <div class="container">
    ${data.summary ? `
    <div class="section">
      <div class="section-title">&#128202; マーケットサマリー</div>
      <div class="section-body">
        <p class="summary-text">${escapeHtml(data.summary)}</p>
      </div>
    </div>` : ''}

    <div class="grid-2">
      <div class="section">
        <div class="section-title">&#128200; 主要株価指数</div>
        <div class="section-body">${renderMarketTable(data.markets)}</div>
      </div>
      <div class="section">
        <div class="section-title">&#128177; 為替レート</div>
        <div class="section-body">${renderForexTable(data.forex)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="section">
        <div class="section-title">&#127760; コモディティ</div>
        <div class="section-body">${renderCommoditiesTable(data.commodities)}</div>
      </div>
      <div class="section">
        <div class="section-title">&#128203; セクター別騰落</div>
        <div class="section-body">${renderSectors(data.sectors)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">&#128240; 主要ニュース</div>
      <div class="section-body">${renderNews(data.news)}</div>
    </div>

    <div class="grid-2">
      <div class="section">
        <div class="section-title">&#128197; 本日の経済カレンダー</div>
        <div class="section-body">${renderCalendar(data.calendar)}</div>
      </div>
      <div class="section">
        <div class="section-title">&#128168; 市場心理</div>
        <div class="section-body">${renderFearGreed(data.fearGreedIndex)}</div>
      </div>
    </div>

    <div class="footer">
      &copy; ${new Date(data.date).getFullYear()} Stock Market Daily Report &#8212; \u516c\u958b\u60c5\u5831\u3092\u57fa\u306b\u81ea\u52d5\u751f\u6210\u3055\u308c\u305f\u30ec\u30dd\u30fc\u30c8\u3067\u3059\u3002\u6295\u8cc7\u52a9\u8a00\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002
    </div>
  </div>
</body>
</html>`;
}

module.exports = { generateHtml };
