const { generateHtml } = require('../src/generateHtml');

const fullData = {
  date: '2026-03-05',
  generatedAt: '2026-03-05T06:30:00+09:00',
  summary: '米国市場はFRBの利下げ期待を背景にS&P500が小幅上昇。日経平均は円安を追い風に3日続伸。',
  markets: [
    { name: '日経平均', close: 38245.78, change: 312.45, changePercent: 0.82, volume: 1234567890 },
    { name: 'S&P 500', close: 5123.45, change: -23.12, changePercent: -0.45 },
  ],
  forex: [
    { pair: 'USD/JPY', rate: 149.85, change: -0.32, changePercent: -0.21 },
    { pair: 'EUR/USD', rate: 1.0845, change: 0.0023, changePercent: 0.21 },
  ],
  commodities: [
    { name: '金 (Gold)', price: 2145.30, unit: 'USD/oz', change: 12.50, changePercent: 0.59 },
    { name: 'WTI原油', price: 78.45, unit: 'USD/bbl', change: -1.23, changePercent: -1.54 },
  ],
  sectors: [
    { name: 'テクノロジー', changePercent: 1.25 },
    { name: 'ヘルスケア', changePercent: -0.38 },
    { name: '金融', changePercent: 0.65 },
  ],
  news: [
    {
      title: 'FRB議長、年内利下げの可能性を示唆',
      source: 'Reuters',
      url: 'https://example.com/1',
      category: '金融政策',
      summary: 'パウエル議長は議会証言で年内利下げの可能性に言及した。',
    },
    {
      title: 'Apple、過去最高益を更新',
      source: 'Bloomberg',
      url: 'https://example.com/2',
      category: '企業決算',
      summary: 'iPhone販売が好調でAppleの四半期利益が過去最高を記録。',
    },
  ],
  calendar: [
    { time: '08:50', country: 'JP', event: 'GDP速報値（10-12月期）', importance: 'high' },
    { time: '21:30', country: 'US', event: '雇用統計', importance: 'high' },
    { time: '18:00', country: 'EU', event: '消費者物価指数', importance: 'medium' },
  ],
  fearGreedIndex: { value: 62, label: 'Greed' },
};

describe('generateHtml - フル版レポート', () => {
  let html;

  beforeAll(() => {
    html = generateHtml(fullData);
  });

  test('完全なHTMLドキュメントを返す', () => {
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('</html>');
  });

  test('lang="ja" が設定されている', () => {
    expect(html).toContain('lang="ja"');
  });

  test('viewport meta タグがある（レスポンシブ対応）', () => {
    expect(html).toContain('viewport');
    expect(html).toContain('width=device-width');
  });

  test('レポート日付が日本語で表示される', () => {
    expect(html).toContain('2026年3月5日');
  });

  test('各市場名が表示される', () => {
    expect(html).toContain('日経平均');
    expect(html).toContain('S&amp;P 500');
  });

  test('終値がカンマ区切りで表示される', () => {
    expect(html).toContain('38,245.78');
    expect(html).toContain('5,123.45');
  });

  test('上昇データの前日比が表示される', () => {
    expect(html).toContain('+312.45');
  });

  test('下降データの前日比が表示される', () => {
    expect(html).toContain('-23.12');
  });

  test('style タグが含まれる（インラインCSS）', () => {
    expect(html).toContain('<style>');
  });

  // 新規セクションのテスト
  test('マーケットサマリーが表示される', () => {
    expect(html).toContain('米国市場はFRBの利下げ期待');
  });

  test('為替データが表示される', () => {
    expect(html).toContain('USD/JPY');
    expect(html).toContain('149.85');
    expect(html).toContain('EUR/USD');
  });

  test('コモディティデータが表示される', () => {
    expect(html).toContain('Gold');
    expect(html).toContain('2,145.30');
    expect(html).toContain('WTI原油');
  });

  test('セクター別騰落が表示される', () => {
    expect(html).toContain('テクノロジー');
    expect(html).toContain('ヘルスケア');
    expect(html).toContain('金融');
  });

  test('ニュースヘッドラインが表示される', () => {
    expect(html).toContain('FRB議長、年内利下げの可能性を示唆');
    expect(html).toContain('Apple、過去最高益を更新');
  });

  test('ニュースのカテゴリが表示される', () => {
    expect(html).toContain('金融政策');
    expect(html).toContain('企業決算');
  });

  test('経済カレンダーが表示される', () => {
    expect(html).toContain('GDP速報値');
    expect(html).toContain('雇用統計');
    expect(html).toContain('08:50');
    expect(html).toContain('21:30');
  });

  test('重要度が星で表示される', () => {
    expect(html).toContain('★★★');
  });

  test('Fear & Greed Indexが表示される', () => {
    expect(html).toContain('62');
    expect(html).toContain('Greed');
  });

  test('印刷用スタイルが含まれる', () => {
    expect(html).toContain('@media print');
  });
});

describe('generateHtml - markets配列が空の場合', () => {
  test('「データがありません」メッセージを表示', () => {
    const emptyData = { date: '2026-03-05', markets: [] };
    const html = generateHtml(emptyData);
    expect(html).toContain('データがありません');
  });
});

describe('generateHtml - 部分的なデータ', () => {
  test('forexが無い場合でもエラーにならない', () => {
    const partial = { date: '2026-03-05', markets: [{ name: 'Test', close: 100, change: 1, changePercent: 1 }] };
    const html = generateHtml(partial);
    expect(html).toContain('<!DOCTYPE html>');
  });

  test('newsが空配列でもエラーにならない', () => {
    const partial = { date: '2026-03-05', markets: [], news: [] };
    const html = generateHtml(partial);
    expect(html).toContain('<!DOCTYPE html>');
  });
});
