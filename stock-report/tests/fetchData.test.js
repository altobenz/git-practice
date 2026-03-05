const {
  loadSampleData, SYMBOLS, SECTOR_ETFS, NEWS_FEEDS,
  parseRssItems, categorizeFeed, buildSummary,
} = require('../src/fetchData');

describe('SYMBOLS', () => {
  test('marketsに主要指数が定義されている', () => {
    const names = SYMBOLS.markets.map(m => m.name);
    expect(names).toContain('日経平均');
    expect(names).toContain('S&P 500');
    expect(names).toContain('NYダウ');
  });

  test('forexに主要通貨ペアが定義されている', () => {
    const pairs = SYMBOLS.forex.map(f => f.pair);
    expect(pairs).toContain('USD/JPY');
    expect(pairs).toContain('EUR/USD');
  });

  test('commoditiesに主要商品が定義されている', () => {
    const names = SYMBOLS.commodities.map(c => c.name);
    expect(names).toContain('金 (Gold)');
    expect(names).toContain('WTI原油');
  });
});

describe('SECTOR_ETFS', () => {
  test('主要セクターETFが定義されている', () => {
    const names = SECTOR_ETFS.map(s => s.name);
    expect(names).toContain('テクノロジー');
    expect(names).toContain('金融');
    expect(names).toContain('エネルギー');
    expect(names).toContain('ヘルスケア');
  });

  test('各ETFにsymbolとnameがある', () => {
    SECTOR_ETFS.forEach(s => {
      expect(s).toHaveProperty('symbol');
      expect(s).toHaveProperty('name');
      expect(s.symbol.length).toBeGreaterThan(0);
    });
  });
});

describe('NEWS_FEEDS', () => {
  test('WSJ, Bloomberg, Reutersのフィードが含まれている', () => {
    const names = NEWS_FEEDS.map(f => f.name);
    expect(names).toContain('Wall Street Journal');
    expect(names).toContain('Bloomberg');
    expect(names).toContain('Reuters');
  });

  test('各フィードにurl, name, categoryがある', () => {
    NEWS_FEEDS.forEach(f => {
      expect(f).toHaveProperty('url');
      expect(f).toHaveProperty('name');
      expect(f).toHaveProperty('category');
    });
  });

  test('5つ以上のフィードが定義されている', () => {
    expect(NEWS_FEEDS.length).toBeGreaterThanOrEqual(5);
  });
});

describe('parseRssItems', () => {
  const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Fed Signals Rate Cut</title>
      <link>https://example.com/1</link>
      <description>The Federal Reserve signaled potential rate cuts.</description>
      <pubDate>Wed, 05 Mar 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Apple Earnings Beat</title>
      <link>https://example.com/2</link>
      <description>Apple reported record earnings.</description>
      <pubDate>Wed, 05 Mar 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

  test('RSSからアイテムを正しくパースする', () => {
    const items = parseRssItems(sampleRss);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Fed Signals Rate Cut');
    expect(items[0].url).toBe('https://example.com/1');
    expect(items[0].summary).toBe('The Federal Reserve signaled potential rate cuts.');
  });

  test('空のRSSは空配列を返す', () => {
    const items = parseRssItems('<rss><channel></channel></rss>');
    expect(items).toHaveLength(0);
  });

  test('不正なXMLは空配列を返す', () => {
    const items = parseRssItems('not xml at all');
    expect(items).toHaveLength(0);
  });

  test('HTMLタグがdescriptionから除去される', () => {
    const rss = `<rss><channel><item>
      <title>Test</title>
      <link>https://example.com</link>
      <description>&lt;p&gt;Hello &lt;b&gt;world&lt;/b&gt;&lt;/p&gt;</description>
    </item></channel></rss>`;
    const items = parseRssItems(rss);
    expect(items[0].summary).not.toContain('<p>');
    expect(items[0].summary).not.toContain('<b>');
  });
});

describe('categorizeFeed', () => {
  test('金融政策関連のカテゴリを正しく分類する', () => {
    expect(categorizeFeed('Fed announces rate decision', 'Markets')).toBe('金融政策');
    expect(categorizeFeed('BOJ keeps rates unchanged', 'Economy')).toBe('金融政策');
  });

  test('企業決算関連を正しく分類する', () => {
    expect(categorizeFeed('Apple earnings beat estimates', 'Earnings')).toBe('企業決算');
    expect(categorizeFeed('Revenue growth accelerates at Google', 'Tech')).toBe('企業決算');
  });

  test('テクノロジー関連を正しく分類する', () => {
    expect(categorizeFeed('AI chip demand surges', 'Tech')).toBe('テクノロジー');
    expect(categorizeFeed('Semiconductor shortage eases', 'Markets')).toBe('テクノロジー');
  });

  test('分類できないものはデフォルトカテゴリを使う', () => {
    const result = categorizeFeed('Random headline', 'Markets');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('buildSummary', () => {
  test('市場データからサマリー文を生成する', () => {
    const markets = [
      { name: '日経平均', change: 312.45, changePercent: 0.82 },
      { name: 'S&P 500', change: -23.12, changePercent: -0.45 },
    ];
    const summary = buildSummary(markets, [], []);
    expect(summary).toContain('日経平均');
    expect(summary).toContain('上昇');
    expect(summary.length).toBeGreaterThan(20);
  });

  test('空の市場データでもエラーにならない', () => {
    const summary = buildSummary([], [], []);
    expect(typeof summary).toBe('string');
  });

  test('為替・コモディティの動きも含める', () => {
    const markets = [{ name: '日経平均', change: 100, changePercent: 0.5 }];
    const forex = [{ pair: 'USD/JPY', rate: 150, change: 1.5, changePercent: 1.0 }];
    const commodities = [{ name: 'WTI原油', price: 80, change: 2, changePercent: 2.5 }];
    const summary = buildSummary(markets, forex, commodities);
    expect(summary.length).toBeGreaterThan(20);
  });
});

describe('loadSampleData', () => {
  test('サンプルデータを正常に読み込める', () => {
    const data = loadSampleData();
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('markets');
    expect(Array.isArray(data.markets)).toBe(true);
    expect(data.markets.length).toBeGreaterThan(0);
  });

  test('サンプルデータに必要なフィールドが含まれている', () => {
    const data = loadSampleData();
    expect(data).toHaveProperty('forex');
    expect(data).toHaveProperty('commodities');
    expect(data).toHaveProperty('news');
    expect(data).toHaveProperty('calendar');
  });
});
