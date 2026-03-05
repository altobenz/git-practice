const { formatPrice, formatChange, formatDate, getDirection } = require('../src/formatData');

describe('formatPrice', () => {
  test('整数部をカンマ区切りにする', () => {
    expect(formatPrice(38245.78)).toBe('38,245.78');
  });

  test('小数がない場合は.00を付ける', () => {
    expect(formatPrice(5000)).toBe('5,000.00');
  });

  test('小さい数値はカンマなし', () => {
    expect(formatPrice(123.45)).toBe('123.45');
  });

  test('小数第1位のみの場合は第2位まで表示', () => {
    expect(formatPrice(3156.2)).toBe('3,156.20');
  });
});

describe('formatChange', () => {
  test('正の変化は+記号付き', () => {
    expect(formatChange(312.45, 0.82)).toBe('+312.45 (+0.82%)');
  });

  test('負の変化は-記号付き', () => {
    expect(formatChange(-23.12, -0.45)).toBe('-23.12 (-0.45%)');
  });

  test('変化なしは±0表示', () => {
    expect(formatChange(0, 0)).toBe('0.00 (0.00%)');
  });
});

describe('formatDate', () => {
  test('YYYY-MM-DDを日本語表記に変換', () => {
    expect(formatDate('2026-03-05')).toBe('2026年3月5日');
  });

  test('ゼロ埋めなしで表示（1月, 9日など）', () => {
    expect(formatDate('2026-01-09')).toBe('2026年1月9日');
  });
});

describe('getDirection', () => {
  test('正の値はup', () => {
    expect(getDirection(312.45)).toBe('up');
  });

  test('負の値はdown', () => {
    expect(getDirection(-23.12)).toBe('down');
  });

  test('ゼロはunchanged', () => {
    expect(getDirection(0)).toBe('unchanged');
  });
});
