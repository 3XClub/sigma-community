function stdDev(arr) {
  const n = arr.length; if (n < 2) return 0;
  const mean = arr.reduce((a,b)=>a+b,0)/n;
  return Math.sqrt(arr.reduce((a,b)=>a+(b-mean)**2,0)/(n-1));
}

async function fetchHistory(symbol) {
  // 1년 + σ 계산용 6개월 여유분 = 18개월 fetch
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=18mo&interval=1d`;
  const res = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  return result.timestamp
    .map((t,i) => ({ date:new Date(t*1000).toISOString().split('T')[0], close:result.indicators.quote[0].close[i] }))
    .filter(d=>d.close!=null);
}

// 익절 없이 — 기간 말에 전량 평가 (미실현 포함)
function runBasic(history, sw, seed) {
  let cash=seed, shares=0, invested=0, peak=seed, mdd=0, buyCount=0;
  const equity=[];

  for (let i=sw+1; i<history.length; i++) {
    const w=history.slice(i-sw,i);
    const rets=w.slice(1).map((d,j)=>(d.close-w[j].close)/w[j].close);
    const sigma=stdDev(rets);
    const prev=history[i-1].close, today=history[i].close;
    const unit=seed*0.05;

    // 1σ 이상 하락 시 매수 (익절 없음)
    if (today<=prev*(1-sigma) && cash>=unit) {
      const qty=unit/today;
      shares+=qty; cash-=unit; invested+=unit; buyCount++;
    }

    const eq=cash+shares*today;
    if(eq>peak) peak=eq;
    const dd=(peak-eq)/peak*100; if(dd>mdd) mdd=dd;
    equity.push({date:history[i].date, equity:+eq.toFixed(2)});
  }

  // 마지막 날 종가로 평가
  const lastClose = history[history.length-1].close;
  const finalEquity = cash + shares*lastClose;
  const unrealizedPnl = shares*lastClose - invested;

  return {
    finalEquity: +finalEquity.toFixed(2),
    totalReturn: +((finalEquity-seed)/seed*100).toFixed(2),
    maxDrawdown: +mdd.toFixed(2),
    buyCount,
    unrealizedPnl: +unrealizedPnl.toFixed(2),
    remainingShares: +shares.toFixed(4),
    equityCurve: equity,
  };
}

function runDynamic(history, sw, seed, base, stepAmt, capAmt) {
  let cash=seed, shares=0, invested=0, peak=seed, mdd=0;
  let streak=0, maxStreak=0, prevBuy=false, buyCount=0;
  const equity=[];

  for (let i=sw+1; i<history.length; i++) {
    const w=history.slice(i-sw,i);
    const rets=w.slice(1).map((d,j)=>(d.close-w[j].close)/w[j].close);
    const sigma=stdDev(rets);
    const prev=history[i-1].close, today=history[i].close;
    const isSigma=((today-prev)/prev)<=-sigma;

    if(isSigma) {
      streak = prevBuy ? streak+1 : 1;
      if(streak>maxStreak) maxStreak=streak;
      prevBuy=true;
      const amt=Math.min(base+(streak-1)*stepAmt, capAmt);
      const buy=Math.min(amt, cash);
      if(buy>=10) {
        const qty=buy/today;
        shares+=qty; cash-=buy; invested+=buy; buyCount++;
      }
    } else {
      streak=0; prevBuy=false;
    }

    const eq=cash+shares*today;
    if(eq>peak) peak=eq;
    const dd=(peak-eq)/peak*100; if(dd>mdd) mdd=dd;
    equity.push({date:history[i].date, equity:+eq.toFixed(2)});
  }

  // 마지막 날 종가로 평가
  const lastClose = history[history.length-1].close;
  const finalEquity = cash + shares*lastClose;
  const unrealizedPnl = shares*lastClose - invested;

  return {
    finalEquity: +finalEquity.toFixed(2),
    totalReturn: +((finalEquity-seed)/seed*100).toFixed(2),
    maxDrawdown: +mdd.toFixed(2),
    buyCount,
    annualTrades: buyCount, // 1년이므로 = 연간 횟수
    maxStreak,
    unrealizedPnl: +unrealizedPnl.toFixed(2),
    remainingShares: +shares.toFixed(4),
    equityCurve: equity,
  };
}

export default async function handler(req, res) {
  const {symbol='TQQQ', seed=20000, base=700, step=100, cap=1200} = req.query;
  try {
    const allHistory = await fetchHistory(symbol);

    // 1년치 데이터만 백테스트 구간으로 사용 (앞 6개월은 σ 계산용)
    const sw = 126; // 6개월 롤링 σ 윈도우
    const seedNum = +seed;

    // 1년 전 날짜 계산
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearStr = oneYearAgo.toISOString().split('T')[0];

    // σ 계산용 버퍼 포함한 시작 인덱스 찾기
    const startIdx = allHistory.findIndex(d => d.date >= oneYearStr);
    const bufferStart = Math.max(0, startIdx - sw);
    const history = allHistory.slice(bufferStart);

    // 바이앤홀드: 정확히 1년 전 가격 → 현재 가격
    const bhStartClose = history.find(d => d.date >= oneYearStr)?.close || history[sw+1]?.close;
    const bhEndClose = history[history.length-1].close;
    const buyHoldReturn = +((bhEndClose - bhStartClose) / bhStartClose * 100).toFixed(2);

    const basic = runBasic(history, sw, seedNum);
    const dynamic = runDynamic(history, sw, seedNum, +base, +step, +cap);

    // 1년 구간만 차트 데이터로
    const combined = basic.equityCurve
      .filter(b => b.date >= oneYearStr)
      .map((b,i) => {
        const dEq = dynamic.equityCurve.find(d => d.date === b.date);
        return { date: b.date, basic: b.equity, dynamic: dEq?.equity ?? b.equity };
      });

    res.status(200).json({ symbol, buyHoldReturn, basic, dynamic, combined, period: '1년' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
