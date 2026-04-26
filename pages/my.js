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

  function analyzeSymbol(sym) {
    const st = STRATEGY[sym];
    const seedKey = `seed_${sym.toLowerCase()}`;
    const seed = participant?.[seedKey] || Math.round((participant?.seed_usd || 20000) / 3);
    const base = calcBase(seed, st.total, st.streak, st.stepPct);
    const buys = trades.filter(t => t.symbol === sym && t.type === 'BUY');
    const sells = trades.filter(t => t.symbol === sym && t.type === 'SELL');
    const pnl = sells.reduce((s, t) => s + (t.pnl || 0), 0);
    const usedSeed = buys.reduce((s, t) => s + (t.amount_usd || 0), 0) - sells.reduce((s, t) => s + (t.amount_usd || 0), 0);
    const remaining = seed - usedSeed + pnl;
    const lastBuy = buys[buys.length - 1];
    const currentStreak = lastBuy?.streak || 0;
    const nextAmt = Math.round(base * (1 + currentStreak * st.stepPct));

    return { seed, base, buys, sells, pnl, usedSeed, remaining, currentStreak, nextAmt, st, progress: buys.length, progressPct: Math.min((buys.length / st.total) * 100, 100) };
  }

  const analyses = participant ? Object.fromEntries(['TQQQ','QLD','SOXL'].map(s => [s, analyzeSymbol(s)])) : {};
  const totalPnl = Object.values(analyses).reduce((s, a) => s + (a.pnl || 0), 0);
  const totalBuys = trades.filter(t => t.type === 'BUY').length;
  const returnPct = participant ? (totalPnl / participant.seed_usd) * 100 : 0;

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>Private Dashboard</div>
        <h1 style={{ fontSize:24, fontWeight:700 }}>🔐 나의 매수 현황</h1>
        <p style={{ fontSize:13, color:'#475569', marginTop:5 }}>씨드 현황 · 매수 횟수 · 다음 추천 매수금 · 개인 전용</p>
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
                <span style={{ color:'#a5b4fc', fontFamily:'monospace', fontWeight:600 }}>{totalBuys}회 / 연간 목표</span>
              </div>
              <Bar value={totalBuys} max={30} color="#6366f1" height={8} />
            </div>
          </div>

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
                      <div style={{ fontSize:11, color:'#475569' }}>씨드 ${a.seed.toLocaleString()} · 연간 {a.st.total}회 목표</div>
                    </div>
                  </div>
                  {a.currentStreak > 0 && (
                    <div style={{ background:`${col}12`, border:`1px solid ${col}30`, borderRadius:10, padding:'8px 16px', textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:col, fontFamily:'monospace', lineHeight:1 }}>{a.currentStreak}회째</div>
                      <div style={{ fontSize:10, color:'#64748b', marginTop:3 }}>연속 1σ 하락 중</div>
                    </div>
                  )}
                </div>

                {/* 핵심 4가지 지표 */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                  {[
                    { label:`${a.st.total}회 중 현재`, value:`${a.progress}회`, sub:`남은 횟수 ${a.st.total - a.progress}회`, color:col },
                    { label:'기본 매수금', value:`$${a.base.toLocaleString()}`, sub:'씨드 기반 자동 계산', color:'#e2e8f0' },
                    { label:'다음 추천 매수금', value:`$${a.nextAmt.toLocaleString()}`, sub:`${a.currentStreak}회 연속 기준`, color:'#e2e8f0' },
                    { label:'이 종목 실현 손익', value:`${a.pnl>=0?'+':''}$${a.pnl.toFixed(0)}`, sub:`${a.sells.length}회 익절`, color:a.pnl>=0?'#4ade80':'#f87171' },
                  ].map((s,i) => (
                    <div key={i} style={{ background:'#0a1628', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:11, color:'#475569', marginBottom:5 }}>{s.label}</div>
                      <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:16, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:11, color:'#475569', marginTop:3 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* 진행률 */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:6 }}>
                    <span>매수 진행률 ({Math.round(a.progressPct)}%)</span>
                    <span style={{ fontFamily:'monospace', color:col }}>{a.progress} / {a.st.total}회</span>
                  </div>
                  <Bar value={a.progress} max={a.st.total} color={col} height={7} />
                </div>

                {/* 씨드 현황 */}
                <div style={{ background:'#0a1628', borderRadius:10, padding:'12px 16px', marginBottom:14, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {[
                    { label:'초기 씨드', val:`$${a.seed.toLocaleString()}`, color:'#64748b' },
                    { label:'투입 금액', val:`$${a.usedSeed.toFixed(0)}`, color:'#fbbf24' },
                    { label:'남은 씨드 (추정)', val:`$${Math.max(a.remaining,0).toFixed(0)}`, color:'#4ade80' },
                  ].map((s,i) => (
                    <div key={i} style={{ textAlign:i===2?'right':i===1?'center':'left' }}>
                      <div style={{ fontSize:11, color:'#475569', marginBottom:3 }}>{s.label}</div>
                      <div style={{ fontSize:14, fontWeight:600, color:s.color, fontFamily:'monospace' }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* 연속 하락별 매수금 가이드 */}
                <div style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>💡 연속 하락 시 매수금 가이드</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {Array.from({length:a.st.streak},(_,i) => {
                    const amt = Math.round(a.base * (1 + i * a.st.stepPct));
                    const isCurr = i === a.currentStreak;
                    const isPast = i < a.currentStreak;
                    return (
                      <div key={i} style={{ padding:'6px 12px', borderRadius:8, fontFamily:'monospace', fontSize:12, fontWeight:isCurr?800:600, background:isCurr?'rgba(239,68,68,0.15)':isPast?`${col}10`:'#0a1628', color:isCurr?'#ef4444':isPast?col:'#64748b', border:`1px solid ${isCurr?'rgba(239,68,68,0.4)':isPast?`${col}30`:'#1e2d3d'}`, transform:isCurr?'scale(1.06)':'none' }}>
                        {i+1}회 ${amt.toLocaleString()}{isCurr?' ←':isPast?' ✓':''}
                      </div>
                    );
                  })}
                </div>

                {/* 최근 매수 기록 */}
                {a.buys.length > 0 && (
                  <div style={{ marginTop:14, borderTop:'1px solid #0a1628', paddingTop:14 }}>
                    <div style={{ fontSize:12, color:'#475569', marginBottom:8 }}>최근 매수 기록</div>
                    {a.buys.slice(-4).reverse().map((t,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0', borderBottom:'1px solid #0a1628', color:'#94a3b8' }}>
                        <span style={{ fontFamily:'monospace', color:'#475569' }}>{t.trade_date}</span>
                        <span>${t.price?.toFixed(2)}</span>
                        <span style={{ fontFamily:'monospace', color:col, fontWeight:600 }}>${t.amount_usd?.toLocaleString()}</span>
                        <span style={{ color:'#fbbf24', fontSize:11 }}>{t.streak>1?`${t.streak}연속`:'단일'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ textAlign:'center', marginTop:8 }}>
            <button onClick={() => { setParticipant(null); setNick(''); setInput(''); }} style={{ fontSize:12, color:'#475569', padding:'8px 16px', background:'transparent', border:'none' }}>다른 닉네임으로 조회</button>
          </div>
        </div>
      )}
    </div>
  );
}
