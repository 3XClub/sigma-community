import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const STRATEGY = {
  TQQQ: { total:24, streak:5, stepPct:0.5, color:'#6366f1' },
  QLD:  { total:18, streak:3, stepPct:0.4, color:'#3b82f6' },
  SOXL: { total:30, streak:6, stepPct:0.4, color:'#f59e0b' },
};

function calcBase(seed, total, streak, step) {
  let sm = 0;
  for (let i = 0; i < streak; i++) sm += (1 + i * step);
  return Math.round(seed / ((total - streak) + sm));
}

function Bar({ value, max, color, height=6 }) {
  return (
    <div style={{ height, background:'#1e2d3d', borderRadius:99, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.min((value/max)*100,100)}%`, background:color, borderRadius:99, transition:'width 0.6s ease' }} />
    </div>
  );
}

export default function My() {
  const [nick, setNick] = useState('');
  const [input, setInput] = useState('');
  const [participant, setParticipant] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prices, setPrices] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  async function lookup(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true); setError('');
    const { data: p } = await supabase.from('participants').select('*').eq('nickname', input.trim()).single();
    if (!p) { setError('닉네임을 찾을 수 없어요. 참가 신청을 먼저 해주세요!'); setLoading(false); return; }
    if (p.status !== 'approved') { setError('아직 승인 대기 중입니다. 승인 후 이용 가능해요.'); setLoading(false); return; }
    const { data: t } = await supabase.from('trades').select('*').eq('participant_id', p.id).order('trade_date');
    setParticipant(p); setTrades(t || []); setNick(input.trim()); setLoading(false);
  }

  async function refreshPrices() {
    setRefreshing(true);
    try {
      const newPrices = {};
      for (const sym of ['TQQQ', 'QLD', 'SOXL']) {
        const res = await fetch(`/api/sigma?symbol=${sym}`);
        const data = await res.json();
        if (data.stocks?.length > 0) {
          newPrices[sym] = data.stocks[0].lastClose;
        }
      }
      setPrices(newPrices);
    } catch(e) { console.error(e); }
    setRefreshing(false);
  }

  function analyzeSymbol(sym) {
    const st = STRATEGY[sym];
    const seedKey = `seed_${sym.toLowerCase()}`;
    const seed = participant?.[seedKey] || Math.round((participant?.seed_usd || 20000) / 3);
    const base = calcBase(seed, st.total, st.streak, st.stepPct);
    const buys = trades.filter(t => t.symbol === sym && t.type === 'BUY');
    const sells = trades.filter(t => t.symbol === sym && t.type === 'SELL');
    
    // 미실현 손익
    let unrealizedPnl = 0, remainingQty = 0, avgCost = 0;
    let totalBuyAmt = 0, totalSellAmt = 0;
    buys.forEach(t => { totalBuyAmt += t.amount_usd || 0; });
    sells.forEach(t => { totalSellAmt += t.amount_usd || 0; });
    
    const netInvested = totalBuyAmt - totalSellAmt;
    if (netInvested > 0 && prices[sym]) {
      // 평균 단가 (대략적)
      avgCost = netInvested / buys.length;
      const currentVal = netInvested / avgCost * prices[sym];
      unrealizedPnl = currentVal - netInvested;
    }

    const realizedPnl = sells.reduce((s, t) => s + (t.pnl || 0), 0);
    const totalPnl = realizedPnl + unrealizedPnl;
    const pnlPct = netInvested > 0 ? (totalPnl / netInvested) * 100 : 0;

    return { 
      seed, base, buys, sells, realizedPnl, unrealizedPnl, totalPnl, pnlPct,
      netInvested, st, progress: buys.length, progressPct: Math.min((buys.length / st.total) * 100, 100) 
    };
  }

  const analyses = participant ? Object.fromEntries(['TQQQ','QLD','SOXL'].map(s => [s, analyzeSymbol(s)])) : {};
  const totalPnl = Object.values(analyses).reduce((s, a) => s + (a.totalPnl || 0), 0);
  const totalBuys = trades.filter(t => t.type === 'BUY').length;
  const returnPct = participant ? (totalPnl / participant.seed_usd) * 100 : 0;

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>Private Dashboard</div>
        <h1 style={{ fontSize:24, fontWeight:700 }}>🔐 나의 매수 현황</h1>
        <p style={{ fontSize:13, color:'#475569', marginTop:5 }}>씨드 현황 · 매수 횟수 · 미실현 손익 · 개인 전용</p>
      </div>

      {!participant && (
        <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'36px', maxWidth:400, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>🔐</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>닉네임으로 조회</div>
          <div style={{ fontSize:13, color:'#475569', marginBottom:22 }}>참가 신청 시 등록한 닉네임을 입력하세요</div>
          <form onSubmit={lookup}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="예: 1st Sigma" style={{ marginBottom:10, textAlign:'center', fontSize:16 }} />
            {error && <div style={{ fontSize:12, color:'#f87171', marginBottom:10 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width:'100%', background:'#6366f1', color:'white', border:'none', padding:11, borderRadius:10, fontSize:14, fontWeight:600 }}>
              {loading ? '⟳ 조회 중...' : '조회하기'}
            </button>
          </form>
          <div style={{ marginTop:16, fontSize:12, color:'#475569' }}>아직 참가 안 하셨나요? <a href="/join" style={{ color:'#6366f1' }}>참가 신청 →</a></div>
        </div>
      )}

      {participant && (
        <div>
          {/* 헤더 카드 */}
          <div style={{ background:'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius:14, border:'1px solid rgba(99,102,241,0.2)', padding:'24px 28px', marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#a5b4fc' }}>{nick[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{nick}</div>
                  <div style={{ fontSize:11, color:'#6366f1' }}>1σ 매수단 · 1기 2026</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:26, fontWeight:700, color:returnPct>=0?'#4ade80':'#f87171', fontFamily:'monospace' }}>{returnPct>=0?'+':''}{returnPct.toFixed(2)}%</div>
                <div style={{ fontSize:12, color:'#475569' }}>누적 수익률</div>
              </div>
            </div>
            <div style={{ marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:7 }}>
                <span>전체 매수 진행률</span>
                <span style={{ color:'#a5b4fc', fontFamily:'monospace', fontWeight:600 }}>{totalBuys}회</span>
              </div>
              <Bar value={totalBuys} max={30} color="#6366f1" height={8} />
            </div>
          </div>

          {/* 새로고침 버튼 */}
          <button onClick={refreshPrices} disabled={refreshing} style={{ marginBottom:18, padding:'10px 20px', background:'rgba(99,102,241,0.1)', border:'1px solid #6366f1', borderRadius:10, color:'#a5b4fc', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ display:'inline-block', animation:refreshing?'spin 1s linear infinite':'none' }}>⟳</span>
            {refreshing ? '현재가 조회 중...' : '💹 현재가 새로고침'}
          </button>

          {/* 종목별 현황 */}
          {['TQQQ','QLD','SOXL'].map(sym => {
            const a = analyses[sym];
            const col = STRATEGY[sym].color;
            return (
              <div key={sym} style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'22px 24px', marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`${col}18`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:col, fontFamily:'monospace', fontSize:12, border:`1px solid ${col}30` }}>{sym[0]}</div>
                    <div>
                      <div style={{ fontWeight:700, color:col, fontSize:15 }}>{sym}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>씨드 ${a.seed.toLocaleString()} · 기본매수금 ${a.base.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* 핵심 4가지 */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                  {[
                    { label:'매수 횟수', value:`${a.progress}/${a.st.total}회`, sub:'진행률', color:col },
                    { label:'투입 금액', value:`$${a.netInvested.toFixed(0)}`, sub:'현재 보유분', color:'#e2e8f0' },
                    { label:'미실현 손익', value:`${a.unrealizedPnl>=0?'+':''}$${a.unrealizedPnl.toFixed(0)}`, sub:`${a.pnlPct>=0?'+':''}${a.pnlPct.toFixed(1)}%`, color:a.unrealizedPnl>=0?'#4ade80':'#f87171' },
                    { label:'실현 손익', value:`${a.realizedPnl>=0?'+':''}$${a.realizedPnl.toFixed(0)}`, sub:'익절 기준', color:a.realizedPnl>=0?'#4ade80':'#f87171' },
                  ].map((s,i) => (
                    <div key={i} style={{ background:'#0a1628', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:11, color:'#475569', marginBottom:5 }}>{s.label}</div>
                      <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:16, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:11, color:'#475569', marginTop:3 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* 진행률 바 */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:6 }}>
                    <span>매수 진행률</span>
                    <span style={{ fontFamily:'monospace', color:col }}>{a.progress} / {a.st.total}회</span>
                  </div>
                  <Bar value={a.progress} max={a.st.total} color={col} height={7} />
                </div>

                {/* 최근 매수 기록 */}
                {a.buys.length > 0 && (
                  <div style={{ marginTop:14, borderTop:'1px solid #0a1628', paddingTop:14 }}>
                    <div style={{ fontSize:12, color:'#475569', marginBottom:8 }}>최근 매수 기록 (최대 3건)</div>
                    {a.buys.slice(-3).reverse().map((t,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0', borderBottom:'1px solid #0a1628', color:'#94a3b8' }}>
                        <span style={{ fontFamily:'monospace', color:'#475569' }}>{t.trade_date}</span>
                        <span>${t.price?.toFixed(2)}</span>
                        <span style={{ fontFamily:'monospace', color:col, fontWeight:600 }}>${t.amount_usd?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ textAlign:'center', marginTop:8 }}>
            <button onClick={() => { setParticipant(null); setNick(''); setInput(''); }} style={{ fontSize:12, color:'#475569', padding:'8px 16px', background:'transparent', border:'none', cursor:'pointer' }}>다른 닉네임으로 조회</button>
          </div>
        </div>
      )}
    </div>
  );
}
