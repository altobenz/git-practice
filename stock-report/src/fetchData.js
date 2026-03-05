const fs = require('fs');
const path = require('path');

// ============================================================
// 定数定義
// ============================================================

const YAHOO_FINANCE_QUOTE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';

const SYMBOLS = {
  markets: [
    { symbol: '^N225', name: '日経平均' },
    { symbol: '^TOPX', name: 'TOPIX' },
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^DJI', name: 'NYダウ' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^FTSE', name: 'FTSE 100' },
    { symbol: '^GDAXI', name: 'DAX' },
    { symbol: '000001.SS', name: '上海総合' },
    { symbol: '^HSI', name: 'ハンセン指数' },
  ],
  forex: [
    { symbol: 'JPY=X', pair: 'USD/JPY' },
    { symbol: 'EURJPY=X', pair: 'EUR/JPY' },
    { symbol: 'EURUSD=X', pair: 'EUR/USD' },
    { symbol: 'GBPJPY=X', pair: 'GBP/JPY' },
    { symbol: 'CNY=X', pair: 'USD/CNY' },
  ],
  commodities: [
    { symbol: 'GC=F', name: '金 (Gold)', unit: 'USD/oz' },
    { symbol: 'CL=F', name: 'WTI原油', unit: 'USD/bbl' },
    { symbol: 'SI=F', name: '銀 (Silver)', unit: 'USD/oz' },
    { symbol: 'BZ=F', name: 'Brent原油', unit: 'USD/bbl' },
    { symbol: 'NG=F', name: '天然ガス', unit: 'USD/MMBtu' },
  ],
};

const SECTOR_ETFS = [
  { symbol: 'XLK', name: 'テクノロジー' },
  { symbol: 'XLV', name: 'ヘルスケア' },
  { symbol: 'XLF', name: '金融' },
  { symbol: 'XLE', name: 'エネルギー' },
  { symbol: 'XLY', name: '一般消費財' },
  { symbol: 'XLC', name: '通信' },
  { symbol: 'XLB', name: '素材' },
  { symbol: 'XLRE', name: '不動産' },
  { symbol: 'XLU', name: '公益' },
  { symbol: 'XLI', name: '資本財' },
  { symbol: 'XLP', name: '生活必需品' },
];

const NEWS_FEEDS = [
  {
    name: 'Wall Street Journal',
    url: 'https://feeds.a]wsj.com/rss/markets/main',
    category: 'Markets',
  },
  {
    name: 'Bloomberg',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    category: 'Markets',
  },
  {
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/?best-topics=business-finance',
    category: 'Markets',
  },
  {
    name: 'CNBC',
    url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html',
    category: 'Markets',
  },
  {
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com/news/rssindex',
    category: 'Markets',
  },
  {
    name: 'Google News - マーケット',
    url: 'https://news.google.com/rss/search?q=stock+market+OR+%E6%A0%AA%E5%BC%8F%E5%B8%82%E5%A0%B4&hl=ja&gl=JP&ceid=JP:ja',
    category: 'General',
  },
  {
    name: 'Google News - Economy',
    url: 'https://news.google.com/rss/search?q=economy+OR+%E7%B5%8C%E6%B8%88&hl=ja&gl=JP&ceid=JP:ja',
    category: 'Economy',
  },
  {
    name: 'Financial Times',
    url: 'https://www.ft.com/?format=rss',
    category: 'Markets',
  },
  {
    name: '日経新聞',
    url: 'https://assets.wor.jp/rss/rdf/nikkei/news.rdf',
    category: 'General',
  },
];

const CNN_FEAR_GREED_URL = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';

const FETCH_TIMEOUT = 10000;

// ============================================================
// HTTPユーティリティ
// ============================================================

async function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        ...options.headers,
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// RSSパーサー（外部依存なし）
// ============================================================

function decodeHtmlEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripHtmlTags(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = xml.match(re);
  return m ? decodeHtmlEntities(m[1].trim()) : '';
}

function parseRssItems(xml) {
  if (!xml || typeof xml !== 'string') return [];
  const items = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = stripHtmlTags(extractTag(block, 'title'));
    const url = stripHtmlTags(extractTag(block, 'link'));
    const rawDesc = extractTag(block, 'description');
    const summary = stripHtmlTags(decodeHtmlEntities(rawDesc)).slice(0, 300);
    const pubDate = extractTag(block, 'pubDate');
    if (title) {
      items.push({ title, url, summary, pubDate });
    }
  }
  return items;
}

// ============================================================
// ニュースカテゴリ分類
// ============================================================

const CATEGORY_RULES = [
  { pattern: /\b(fed|fomg|boj|ecb|rate|interest|利[上下]げ|金融政策|金利|中[央銀]行|量的)/i, category: '金融政策' },
  { pattern: /\b(earning|revenue|profit|決算|業績|増[収益]|減[収益]|最高益|赤字)/i, category: '企業決算' },
  { pattern: /\b(ai|chip|semiconductor|半導体|テック|tech|software|nvidia|apple|google|microsoft|meta|amazon)/i, category: 'テクノロジー' },
  { pattern: /\b(oil|opec|crude|gold|commodity|原油|コモディティ|天然ガス|エネルギー)/i, category: 'コモディティ' },
  { pattern: /\b(gdp|cpi|inflation|employment|job|雇用|物価|インフレ|失業|景気)/i, category: '経済指標' },
  { pattern: /\b(geopolit|war|conflict|sanction|tariff|関税|地政学|戦争|制裁)/i, category: '地政学' },
  { pattern: /\b(crypto|bitcoin|ethereum|ビットコイン|暗号資産|仮想通貨)/i, category: '暗号資産' },
  { pattern: /\b(ipo|m&a|merger|acquisition|買収|合併|上場)/i, category: 'M&A・IPO' },
];

function categorizeFeed(title, feedCategory) {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(title)) {
      return rule.category;
    }
  }
  if (feedCategory === 'Economy') return '経済';
  return 'マーケット';
}

// ============================================================
// Yahoo Finance データ取得
// ============================================================

async function fetchQuote(symbol) {
  const url = `${YAHOO_FINANCE_QUOTE_URL}${encodeURIComponent(symbol)}?range=2d&interval=1d`;
  const res = await fetchWithTimeout(url);
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

async function fetchMarkets() {
  const results = [];
  for (const m of SYMBOLS.markets) {
    try {
      const q = await fetchQuote(m.symbol);
      results.push({
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
  return results;
}

async function fetchForex() {
  const results = [];
  for (const f of SYMBOLS.forex) {
    try {
      const q = await fetchQuote(f.symbol);
      results.push({
        pair: f.pair,
        rate: Math.round(q.current * 10000) / 10000,
        change: Math.round(q.change * 10000) / 10000,
        changePercent: Math.round(q.changePercent * 100) / 100,
      });
    } catch (e) {
      console.error(`為替データ取得失敗 (${f.pair}): ${e.message}`);
    }
  }
  return results;
}

async function fetchCommodities() {
  const results = [];
  for (const c of SYMBOLS.commodities) {
    try {
      const q = await fetchQuote(c.symbol);
      results.push({
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
  return results;
}

// ============================================================
// セクター別騰落（ETF経由）
// ============================================================

async function fetchSectors() {
  const results = [];
  for (const s of SECTOR_ETFS) {
    try {
      const q = await fetchQuote(s.symbol);
      results.push({
        name: s.name,
        changePercent: Math.round(q.changePercent * 100) / 100,
      });
    } catch (e) {
      console.error(`セクターデータ取得失敗 (${s.name}): ${e.message}`);
    }
  }
  return results;
}

// ============================================================
// ニュース取得（複数RSSフィード）
// ============================================================

async function fetchNewsFromFeed(feed) {
  try {
    const res = await fetchWithTimeout(feed.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseRssItems(xml);
    return items.map(item => ({
      title: item.title,
      source: feed.name,
      url: item.url,
      category: categorizeFeed(item.title, feed.category),
      summary: item.summary,
      pubDate: item.pubDate,
    }));
  } catch (e) {
    console.error(`ニュース取得失敗 (${feed.name}): ${e.message}`);
    return [];
  }
}

async function fetchAllNews() {
  const promises = NEWS_FEEDS.map(feed => fetchNewsFromFeed(feed));
  const results = await Promise.all(promises);
  const allItems = results.flat();

  // 重複除去（タイトルの類似度で判定）
  const seen = new Set();
  const unique = [];
  for (const item of allItems) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9\u3040-\u9fff]/g, '').slice(0, 40);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  // 日付順でソートし、上位記事を選択
  unique.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  // カテゴリの多様性を保ちながら上位10件を選択
  const selected = [];
  const catCount = {};
  for (const item of unique) {
    const cat = item.category;
    if ((catCount[cat] || 0) < 3) {
      selected.push(item);
      catCount[cat] = (catCount[cat] || 0) + 1;
      if (selected.length >= 10) break;
    }
  }

  return selected;
}

// ============================================================
// Fear & Greed Index（CNN公開API）
// ============================================================

async function fetchFearGreedIndex() {
  try {
    const res = await fetchWithTimeout(CNN_FEAR_GREED_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const fg = json.fear_and_greed;
    if (fg) {
      const value = Math.round(fg.score);
      return { value, label: fg.rating || '' };
    }
    return null;
  } catch (e) {
    console.error(`Fear & Greed Index取得失敗: ${e.message}`);
    return null;
  }
}

// ============================================================
// 経済カレンダー（Investing.comの公開データ）
// ============================================================

async function fetchEconomicCalendar() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const url = `https://nfs.faireconomy.media/ff_calendar_thisweek.json`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const events = await res.json();

    const todayEvents = events.filter(e => {
      const eventDate = e.date ? e.date.split('T')[0] : '';
      return eventDate === dateStr;
    });

    const countryMap = { USD: 'US', JPY: 'JP', EUR: 'EU', GBP: 'GB', CNY: 'CN', AUD: 'AU', CAD: 'CA', CHF: 'CH' };
    const impactMap = { High: 'high', Medium: 'medium', Low: 'low' };

    return todayEvents.slice(0, 10).map(e => {
      const time = e.date ? new Date(e.date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }) : '--:--';
      return {
        time,
        country: countryMap[e.country] || e.country || '',
        event: e.title || '',
        importance: impactMap[e.impact] || 'low',
      };
    });
  } catch (e) {
    console.error(`経済カレンダー取得失敗: ${e.message}`);
    return [];
  }
}

// ============================================================
// サマリー生成
// ============================================================

function buildSummary(markets, forex, commodities) {
  const parts = [];

  if (markets.length > 0) {
    const top = markets.slice(0, 4);
    for (const m of top) {
      const dir = m.change > 0 ? '上昇' : m.change < 0 ? '下落' : '横ばい';
      const sign = m.changePercent > 0 ? '+' : '';
      parts.push(`${m.name}は前日比${sign}${m.changePercent}%の${dir}`);
    }
  }

  if (forex.length > 0) {
    const usdJpy = forex.find(f => f.pair === 'USD/JPY');
    if (usdJpy) {
      const dir = usdJpy.change > 0 ? '円安' : usdJpy.change < 0 ? '円高' : '横ばい';
      parts.push(`ドル円は${usdJpy.rate}円で${dir}方向`);
    }
  }

  if (commodities.length > 0) {
    const notable = commodities.filter(c => Math.abs(c.changePercent) >= 1.0);
    for (const c of notable.slice(0, 2)) {
      const dir = c.change > 0 ? '上昇' : '下落';
      const sign = c.changePercent > 0 ? '+' : '';
      parts.push(`${c.name}は${sign}${c.changePercent}%${dir}`);
    }
  }

  if (parts.length === 0) return '';
  return parts.join('。') + '。';
}

// ============================================================
// メインの取得関数
// ============================================================

async function fetchAllMarketData() {
  const today = new Date().toISOString().split('T')[0];

  console.log('株価指数を取得中...');
  const markets = await fetchMarkets();

  console.log('為替データを取得中...');
  const forex = await fetchForex();

  console.log('コモディティデータを取得中...');
  const commodities = await fetchCommodities();

  console.log('セクター別データを取得中...');
  const sectors = await fetchSectors();

  console.log('ニュースフィードを取得中...');
  const news = await fetchAllNews();

  console.log('Fear & Greed Indexを取得中...');
  const fearGreedIndex = await fetchFearGreedIndex();

  console.log('経済カレンダーを取得中...');
  const calendar = await fetchEconomicCalendar();

  const summary = buildSummary(markets, forex, commodities);

  return {
    date: today,
    generatedAt: new Date().toISOString(),
    summary,
    markets,
    forex,
    commodities,
    sectors,
    news,
    calendar,
    fearGreedIndex,
  };
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

module.exports = {
  fetchData, fetchQuote, fetchAllMarketData, loadSampleData,
  SYMBOLS, SECTOR_ETFS, NEWS_FEEDS,
  parseRssItems, categorizeFeed, buildSummary,
  fetchWithTimeout,
};
