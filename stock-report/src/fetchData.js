const fs = require('fs');
const path = require('path');

const YAHOO_FINANCE_QUOTE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';

const SYMBOLS = {
  markets: [
    { symbol: '^N225', name: '日経平均' },
    { symbol: '^TOPX', name: 'TOPIX' },
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'NYダウ' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^FTSE', name: 'FTSE 100' },
    { symbol: '000001.SS', name: '上海総合' },
  ],
  forex: [
    { symbol: 'JPY=X', pair: 'USD/JPY' },
    { symbol: 'EURJPY=X', pair: 'EUR/JPY' },
    { symbol: 'EURUSD=X', pair: 'EUR/USD' },
    { symbol: 'GBPJPY=X', pair: 'GBP/JPY' },
  ],
  commodities: [
    { symbol: 'GC=F', name: '金 (Gold)', unit: 'USD/oz' },
    { symbol: 'CL=F', name: 'WTI原油', unit: 'USD/bbl' },
    { symbol: 'SI=F', name: '銀 (Silver)', unit: 'USD/oz' },
  ],
};

async function fetchQuote(symbol) {
  const url = `${YAHOO_FINANCE_QUOTE_URL}${encodeURIComponent(symbol)}?range=2d&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockReport/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}`);
  const json = await res.json();
  const result = json.chart.result[0];
  const meta = result.meta;
  const closes = result.indicators.quote[0].close;
  const current = meta.regularMarketPrice;
  const prev = closes.length >= 2 ? closes[closes.length - 2] : current;
  const change = current - prev;
  const changePercent = prev ? (change / prev) * 100 : 0;
  const volume = result.indicators.quote[0].volume;
  const currentVolume = volume ? volume[volume.length - 1] : undefined;
  return { current, prev, change, changePercent, volume: currentVolume };
}

async function fetchAllMarketData() {
  const today = new Date().toISOString().split('T')[0];
  const data = {
    date: today,
    generatedAt: new Date().toISOString(),
    summary: '',
    markets: [],
    forex: [],
    commodities: [],
    sectors: [],
    news: [],
    calendar: [],
    fearGreedIndex: null,
  };

  // 株価指数
  for (const m of SYMBOLS.markets) {
    try {
      const q = await fetchQuote(m.symbol);
      data.markets.push({
        name: m.name,
        close: Math.round(q.current * 100) / 100,
        change: Math.round(q.change * 100) / 100,
        changePercent: Math.round(q.changePercent * 100) / 100,
        volume: q.volume,
      });
    } catch (e) {
      console.error(`市場データ取得失敗 (${m.name}): ${e.message}`);
    }
  }

  // 為替
  for (const f of SYMBOLS.forex) {
    try {
      const q = await fetchQuote(f.symbol);
      data.forex.push({
        pair: f.pair,
        rate: Math.round(q.current * 10000) / 10000,
        change: Math.round(q.change * 10000) / 10000,
        changePercent: Math.round(q.changePercent * 100) / 100,
      });
    } catch (e) {
      console.error(`為替データ取得失敗 (${f.pair}): ${e.message}`);
    }
  }

  // コモディティ
  for (const c of SYMBOLS.commodities) {
    try {
      const q = await fetchQuote(c.symbol);
      data.commodities.push({
        name: c.name,
        price: Math.round(q.current * 100) / 100,
        unit: c.unit,
        change: Math.round(q.change * 100) / 100,
        changePercent: Math.round(q.changePercent * 100) / 100,
      });
    } catch (e) {
      console.error(`コモディティデータ取得失敗 (${c.name}): ${e.message}`);
    }
  }

  // サマリー生成（簡易版: 主要指数の動きを文にする）
  if (data.markets.length > 0) {
    const parts = data.markets.slice(0, 3).map(m => {
      const dir = m.change > 0 ? '上昇' : m.change < 0 ? '下落' : '横ばい';
      return `${m.name}は前日比${m.change > 0 ? '+' : ''}${m.changePercent}%の${dir}`;
    });
    data.summary = parts.join('。') + '。';
  }

  return data;
}

function loadSampleData() {
  const samplePath = path.join(__dirname, '..', 'data', 'sample.json');
  return JSON.parse(fs.readFileSync(samplePath, 'utf-8'));
}

async function fetchData() {
  try {
    return await fetchAllMarketData();
  } catch (e) {
    console.error(`データ取得に失敗しました。サンプルデータを使用します: ${e.message}`);
    return loadSampleData();
  }
}

module.exports = { fetchData, fetchQuote, fetchAllMarketData, loadSampleData, SYMBOLS };
