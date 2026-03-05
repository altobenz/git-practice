const { loadSampleData, SYMBOLS } = require('../src/fetchData');

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
