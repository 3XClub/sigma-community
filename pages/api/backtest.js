function stdDev(arr) {
  const n = arr.length; if (n < 2) return 0;
  const mean = arr.reduce((a,b)=>a+b,0)/n;
  return Math.sqrt(arr.reduce((a,b)=>a+(b-mean)**2,0)/(n-1));
}

async function fetchHistory(symbol) {
  // 2021년 초 ~ 현재까지 (폭락+회복 전체 사이클)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=4y&interval=1d`;
  const res = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  return result.timestamp
    .map((t,i) => ({
      date: new Date(t*1000).toISOString().split('T')[0],
      close: result.indicators.quote[0].close[i]
    }))
    .filter(d => d.close != null);
}

function run1Sigma(history, sw, seed, buyAmtPerTrade) {
  let cash = seed, shares = 0, invested = 0;
  let peak = seed, mdd = 0, buyCount = 0;
  const equityCurve = [];
  const recoveryDate = { date: null, found: false };

  for (let i = sw + 1; i < history.length; i++) {
    const w = history.slice(i - sw, i);
    const rets = w.slice(1).map((d,j) => (d.close - w[j].close) / w[j].close);
    const sigma = stdDev(rets);
    const prev = history[i-1].close;
    const today = history[i].close;
    const dayRet = (today - prev) / prev;

    // 1σ 이상 하락 시 매수
    if (dayRet <= -sigma && cash >= buyAmtPerTrade) {
      const qty = buyAmtPerTrade / today;
      shares += qty; cash -= buyAmtPerTrade;
      invested += buyAmtPerTrade; buyCount++;
    }

    const eq = cash + shares * today;
    const returnPct = (eq - seed) / seed * 100;

    // 원금 회복 시점
    if (!recoveryDate.found && returnPct >= 0 && equityCurve.length > 20) {
      recoveryDate.date = history[i].date;
      recoveryDate.found = true;
    }

    if (eq > peak) peak = eq;
    const dd = (peak - eq) / peak * 100;
    if (dd > mdd) mdd = dd;

    equityCurve.push({
      date: history[i].date,
      equity: +eq.toFixed(2),
      returnPct: +returnPct.toFixed(2),
    });
  }

  const lastClose = history[history.length-1].close;
  const finalEquity = cash + shares * lastClose;

  return {
    finalEquity: +finalEquity.toFixed(2),
    totalReturn: +((finalEquity - seed) / seed * 100).toFixed(2),
    maxDrawdown: +mdd.toFixed(2),
    buyCount,
    recoveryDate: recoveryDate.date,
    equityCurve,
  };
}

function runBuyHold(history, sw, seed) {
  // 시작 시점에 전액 매수
  const startIdx = sw + 1;
  const startPrice = history[startIdx].close;
  const shares = seed / startPrice;
  const peak = seed;
  let mdd = 0;
  let recoveryDate = { date: null, found: false };
  const equityCurve = [];

  for (let i = startIdx; i < history.length; i++) {
    const eq = shares * history[i].close;
    const returnPct = (eq - seed) / seed * 100;

    if (!recoveryDate.found && returnPct >= 0 && i > startIdx + 20) {
      recoveryDate.date = history[i].date;
      recoveryDate.found = true;
    }

    const currentPeak = Math.max(...history.slice(startIdx, i+1).map(d => shares * d.close));
    const dd = (currentPeak - eq) / currentPeak * 100;
    if (dd > mdd) mdd = dd;

    equityCurve.push({
      date: history[i].date,
      equity: +eq.toFixed(2),
      returnPct: +returnPct.toFixed(2),
    });
  }

  const finalEquity = shares * history[history.length-1].close;

  return {
    finalEquity: +finalEquity.toFixed(2),
    totalReturn: +((finalEquity - seed) / seed * 100).toFixed(2),
    maxDrawdown: +mdd.toFixed(2),
    recoveryDate: recoveryDate.date,
    equityCurve,
  };
}

export default async function handler(req, res) {
  const { symbol = 'TQQQ', seed = 20000, buyAmt = 700 } = req.query;

  const REF = {
    TQQQ: { annualTouches: 24, maxStreakRef: 5 },
    QLD:  { annualTouches: 18, maxStreakRef: 3 },
    SOXL: { annualTouches: 30, maxStreakRef: 6 },
  };

  try {
    const history = await fetchHistory(symbol);
    const sw = 126;
    const seedNum = +seed;
    const buyAmtNum = +buyAmt;

    const sigma1 = run1Sigma(history, sw, seedNum, buyAmtNum);
    const buyHold = runBuyHold(history, sw, seedNum);

    // 원금 회복 기간 계산 (영업일 기준)
    const startDate = history[sw + 1].date;
    const calcDays = (from, to) => {
      if (!from || !to) return null;
      const d1 = new Date(from), d2 = new Date(to);
      return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    };

    const sigma1RecoveryDays = calcDays(startDate, sigma1.recoveryDate);
    const buyHoldRecoveryDays = calcDays(startDate, buyHold.recoveryDate);

    // MDD 발생 시점 찾기
    let sigma1MddDate = null, buyHoldMddDate = null;
    let minSigma = Infinity, minBuyHold = Infinity;
    sigma1.equityCurve.forEach(d => { if (d.equity < minSigma) { minSigma = d.equity; sigma1MddDate = d.date; } });
    buyHold.equityCurve.forEach(d => { if (d.equity < minBuyHold) { minBuyHold = d.equity; buyHoldMddDate = d.date; } });

    // 차트 데이터 — 수익률(%)로 통일
    const combined = sigma1.equityCurve.map((d, i) => ({
      date: d.date,
      sigma1: d.returnPct,
      buyHold: buyHold.equityCurve[i]?.returnPct ?? null,
    }));

    res.status(200).json({
      symbol,
      seed: seedNum,
      buyAmt: buyAmtNum,
      startDate,
      sigma1: {
        ...sigma1,
        recoveryDays: sigma1RecoveryDays,
        mddDate: sigma1MddDate,
      },
      buyHold: {
        ...buyHold,
        recoveryDays: buyHoldRecoveryDays,
        mddDate: buyHoldMddDate,
      },
      ref: REF[symbol] || REF.TQQQ,
      combined,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
