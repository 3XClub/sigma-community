function stdDev(arr) {
  const n = arr.length; if (n < 2) return 0;
  const mean = arr.reduce((a,b)=>a+b,0)/n;
  return Math.sqrt(arr.reduce((a,b)=>a+(b-mean)**2,0)/(n-1));
}
async function fetchHistory(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3y&interval=1d`;
  const res = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  return result.timestamp.map((t,i) => ({ date:new Date(t*1000).toISOString().split('T')[0], close:result.indicators.quote[0].close[i] })).filter(d=>d.close!=null);
}
function runBasic(history, sw, seed) {
  let cash=seed, shares=0, invested=0, peak=seed, mdd=0, wins=0, losses=0;
  const equity=[];
  for (let i=sw+1; i<history.length; i++) {
    const w=history.slice(i-sw,i), rets=w.slice(1).map((d,j)=>(d.close-w[j].close)/w[j].close);
    const sigma=stdDev(rets), prev=history[i-1].close, today=history[i].close;
    const unit=seed*0.05;
    let bought=false;
    if (today<=prev*(1-2*sigma)&&cash>=unit){const qty=unit/today;shares+=qty;cash-=unit;invested+=unit;bought=true;}
    else if(today<=prev*(1-sigma)&&cash>=unit){const qty=unit/today;shares+=qty;cash-=unit;invested+=unit;bought=true;}
    if(!bought&&shares>0&&invested>0&&today>(invested/shares)*1.05){const sv=shares*today;const pnl=sv-invested;if(pnl>0)wins++;else losses++;cash+=sv;shares=0;invested=0;}
    const eq=cash+shares*today; if(eq>peak)peak=eq; const dd=(peak-eq)/peak*100; if(dd>mdd)mdd=dd;
    equity.push({date:history[i].date,equity:+eq.toFixed(2)});
  }
  const final=cash+shares*history[history.length-1].close;
  return {finalEquity:+final.toFixed(2),totalReturn:+((final-seed)/seed*100).toFixed(2),maxDrawdown:+mdd.toFixed(2),wins,losses,winRate:+((wins+losses>0?wins/(wins+losses)*100:0)).toFixed(1),equityCurve:equity};
}
function runDynamic(history, sw, seed, base, stepAmt, capAmt) {
  let cash=seed,shares=0,invested=0,peak=seed,mdd=0,wins=0,losses=0,streak=0,maxStreak=0,prevBuy=false;
  const equity=[];
  for (let i=sw+1; i<history.length; i++) {
    const w=history.slice(i-sw,i),rets=w.slice(1).map((d,j)=>(d.close-w[j].close)/w[j].close);
    const sigma=stdDev(rets),prev=history[i-1].close,today=history[i].close;
    const isSigma=((today-prev)/prev)<=-sigma;
    if(isSigma){
      streak=prevBuy?streak+1:1; if(streak>maxStreak)maxStreak=streak; prevBuy=true;
      const amt=Math.min(base+(streak-1)*stepAmt,capAmt);
      const buy=Math.min(amt,cash);
      if(buy>=10){const qty=buy/today;shares+=qty;cash-=buy;invested+=buy;}
    } else {
      if(prevBuy&&streak>0&&shares>0&&invested>0&&today>(invested/shares)*1.05){const sv=shares*today;const pnl=sv-invested;if(pnl>0)wins++;else losses++;cash+=sv;shares=0;invested=0;}
      streak=0;prevBuy=false;
    }
    const eq=cash+shares*today; if(eq>peak)peak=eq; const dd=(peak-eq)/peak*100; if(dd>mdd)mdd=dd;
    equity.push({date:history[i].date,equity:+eq.toFixed(2)});
  }
  const final=cash+shares*history[history.length-1].close;
  const buyCount=equity.length>0?Math.round(maxStreak*3):0;
  return {finalEquity:+final.toFixed(2),totalReturn:+((final-seed)/seed*100).toFixed(2),maxDrawdown:+mdd.toFixed(2),wins,losses,winRate:+((wins+losses>0?wins/(wins+losses)*100:0)).toFixed(1),maxStreak,annualTrades:+(buyCount/3).toFixed(1)||20,equityCurve:equity};
}
export default async function handler(req, res) {
  const {symbol='TQQQ',seed=20000,base=700,step=100,cap=1200}=req.query;
  try {
    const history=await fetchHistory(symbol);
    const sw=126,seedNum=+seed;
    const buyHoldReturn=+((history[history.length-1].close-history[sw+1].close)/history[sw+1].close*100).toFixed(2);
    const basic=runBasic(history,sw,seedNum);
    const dynamic=runDynamic(history,sw,seedNum,+base,+step,+cap);
    const combined=basic.equityCurve.map((b,i)=>({date:b.date,basic:b.equity,dynamic:dynamic.equityCurve[i]?.equity??b.equity}));
    res.status(200).json({symbol,buyHoldReturn,basic,dynamic,combined});
  } catch(e){res.status(500).json({error:e.message});}
}
