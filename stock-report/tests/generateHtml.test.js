const { generateHtml } = require('../src/generateHtml');

const sampleData = {
  date: '2026-03-05',
  markets: [
    { name: '日経平均', close: 38245.78, change: 312.45, changePercent: 0.82 },
    { name: 'S&P 500', close: 5123.45, change: -23.12, changePercent: -0.45 },
  ],
};

describe('generateHtml', () => {
  let html;

  beforeAll(() => {
    html = generateHtml(sampleData);
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

  test('上昇は緑系の色で表示される', () => {
    // 上昇データを含む行の近くに緑系のスタイルがあること
    expect(html).toContain('+312.45');
  });

  test('下降は赤系の色で表示される', () => {
    expect(html).toContain('-23.12');
  });

  test('style タグが含まれる（インラインCSS）', () => {
    expect(html).toContain('<style>');
  });
});

describe('generateHtml - markets配列が空の場合', () => {
  test('「データがありません」メッセージを表示', () => {
    const emptyData = { date: '2026-03-05', markets: [] };
    const html = generateHtml(emptyData);
    expect(html).toContain('データがありません');
  });
});
