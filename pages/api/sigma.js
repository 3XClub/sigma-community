function stdDev(arr) {
  const n = arr.length;
  if (n < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
}

async function fetchSigma(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  const closes = result.indicators.quote[0].close.filter(v => v != null);
  if (closes.length < 20) throw new Error('데이터 부족');
  const returns = [];
  for (let i = 1; i < closes.length; i++) returns.push((closes[i] - closes[i-1]) / closes[i-1]);
  const sigma = stdDev(returns);
  const lastClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  return {
    symbol, lastClose, sigma,
    buy1: lastClose * (1 - sigma),
    buy2: lastClose * (1 - 2 * sigma),
    buy3: lastClose * (1 - 3 * sigma),
    distPct1: sigma * 100,
    dailyChange: ((lastClose - prevClose) / prevClose) * 100,
  };
}

export default async function handler(req, res) {
  const SYMBOLS = ['TQQQ', 'QLD', 'SOXL'];
  const results = await Promise.allSettled(SYMBOLS.map(fetchSigma));
  const stocks = results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { symbol: SYMBOLS[i], error: true }
  );
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).json({ stocks, updatedAt: new Date().toISOString() });
}
