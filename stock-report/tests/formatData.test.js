const {
  formatPrice, formatChange, formatDate, getDirection,
  formatVolume, formatPercent, formatTime, getImportanceLabel, getFearGreedLabel,
} = require('../src/formatData');

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

// === 新規追加テスト ===

describe('formatVolume', () => {
  test('10億以上は「億」単位で表示', () => {
    expect(formatVolume(1234567890)).toBe('12.3億');
  });

  test('1億以上は「億」単位で表示', () => {
    expect(formatVolume(350000000)).toBe('3.5億');
  });

  test('1万以上は「万」単位で表示', () => {
    expect(formatVolume(456789)).toBe('45.7万');
  });

  test('1万未満はそのまま表示', () => {
    expect(formatVolume(9999)).toBe('9,999');
  });

  test('undefinedの場合は「-」を返す', () => {
    expect(formatVolume(undefined)).toBe('-');
  });
});

describe('formatPercent', () => {
  test('正の値は+付き', () => {
    expect(formatPercent(1.25)).toBe('+1.25%');
  });

  test('負の値は-付き', () => {
    expect(formatPercent(-0.38)).toBe('-0.38%');
  });

  test('ゼロは符号なし', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });
});

describe('formatTime', () => {
  test('時刻をそのまま返す', () => {
    expect(formatTime('08:50')).toBe('08:50');
  });

  test('undefinedの場合は「--:--」を返す', () => {
    expect(formatTime(undefined)).toBe('--:--');
  });
});

describe('getImportanceLabel', () => {
  test('highは★★★', () => {
    expect(getImportanceLabel('high')).toBe('★★★');
  });

  test('mediumは★★', () => {
    expect(getImportanceLabel('medium')).toBe('★★');
  });

  test('lowは★', () => {
    expect(getImportanceLabel('low')).toBe('★');
  });

  test('不明な値は★', () => {
    expect(getImportanceLabel('unknown')).toBe('★');
  });
});

describe('getFearGreedLabel', () => {
  test('0-24はExtreme Fear（紫）', () => {
    const result = getFearGreedLabel(15);
    expect(result.label).toBe('Extreme Fear');
    expect(result.color).toBe('#7b2d8e');
  });

  test('25-44はFear（赤）', () => {
    const result = getFearGreedLabel(30);
    expect(result.label).toBe('Fear');
    expect(result.color).toBe('#dc2626');
  });

  test('45-55はNeutral（黄）', () => {
    const result = getFearGreedLabel(50);
    expect(result.label).toBe('Neutral');
    expect(result.color).toBe('#ca8a04');
  });

  test('56-74はGreed（オレンジ）', () => {
    const result = getFearGreedLabel(62);
    expect(result.label).toBe('Greed');
    expect(result.color).toBe('#ea580c');
  });

  test('75-100はExtreme Greed（緑）', () => {
    const result = getFearGreedLabel(85);
    expect(result.label).toBe('Extreme Greed');
    expect(result.color).toBe('#16a34a');
  });
});
