import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SYMBOLS = [
  { symbol:'TQQQ', name:'TQQQ (나스닥 3배)', color:'#6366f1' },
  { symbol:'QLD',  name:'QLD (나스닥 2배)',  color:'#3b82f6' },
  { symbol:'SOXL', name:'SOXL (반도체 3배)', color:'#f59e0b' },
];

function Stat({ label, value, sub, color='#e2e8f0' }) {
  return (
    <div style={{ background:'#0f172a', borderRadius:10, padding:'14px 16px', border:'1px solid #1e2d3d' }}>
      <div style={{ fontSize:11, color:'#475569', marginBottom:5, fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:19, fontWeight:700, color, fontFamily:'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#475569', marginTop:3 }}>{sub}</div>}
    </div>
  );
}

export default function Backtest() {
  const [symbol, setSymbol] = useState('TQQQ');
  const [seed, setSeed] = useState(20000);
  const [base, setBase] = useState(700);
  const [step, setStep] = useState(100);
  const [cap, setCap] = useState(1200);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ran, setRan] = useState(false);

  const run = useCallback(async () => {
    setLoading(true); setError(null); setRan(true);
    try {
      const res = await fetch(`/api/backtest?symbol=${symbol}&seed=${seed}&base=${base}&step=${step}&cap=${cap}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }, [symbol, seed, base, step, cap]);

  const sym = SYMBOLS.find(s => s.symbol === symbol);
  const d = result?.dynamic;
  const b = result?.basic;
  const preview = Array.from({length:7},(_,i) => ({ streak:`${i+1}회`, amount:Math.min(+base+i*+step,+cap) }));

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>1σ Strategy Backtester</div>
        <h1 style={{ fontSize:24, fontWeight:700 }}>📊 1σ 전략 백테스터</h1>
        <p style={{ fontSize:13, color:'#475569', marginTop:5 }}>3년 실제 데이터 · 연속 하락 동적 사이징 vs 고정 사이징 비교</p>
      </div>

      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'22px', marginBottom:18 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>⚙️ 전략 설정</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, alignItems:'end', marginBottom:16 }}>
          {[
            { label:'종목', type:'select', key:'symbol', opts:SYMBOLS, value:symbol, onChange:setSymbol },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>{f.label}</label>
              <select value={f.value} onChange={e=>f.onChange(e.target.value)}>
                {f.opts.map(o => <option key={o.symbol} value={o.symbol}>{o.name}</option>)}
              </select>
            </div>
          ))}
          {[
            {label:'씨드 ($)', val:seed, set:setSeed, step:1000, min:1000},
            {label:'기본 매수금 ($)', val:base, set:setBase, step:50, min:100},
            {label:'연속 증가폭 ($)', val:step, set:setStep, step:50, min:0},
            {label:'최대 캡 ($)', val:cap, set:setCap, step:100, min:base},
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>{f.label}</label>
              <input type="number" value={f.val} onChange={e=>f.set(+e.target.value)} step={f.step} min={f.min} />
            </div>
          ))}
        </div>

        {/* 사이징 미리보기 */}
        <div style={{ padding:'12px 16px', background:'#0a1628', borderRadius:10, border:'1px solid #1e2d3d', marginBottom:14 }}>
          <div style={{ fontSize:12, color:'#64748b', fontWeight:500, marginBottom:8 }}>📐 연속 하락 시 매수금 미리보기</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {preview.map((s,i) => (
              <div key={i} style={{ padding:'5px 12px', borderRadius:8, fontSize:12, fontFamily:'monospace', fontWeight:600, background:s.amount>=cap?'rgba(248,113,113,0.1)':i===0?'rgba(99,102,241,0.1)':'rgba(74,222,128,0.1)', color:s.amount>=cap?'#f87171':i===0?'#a5b4fc':'#4ade80', border:`1px solid ${s.amount>=cap?'rgba(248,113,113,0.2)':i===0?'rgba(99,102,241,0.2)':'rgba(74,222,128,0.2)'}` }}>
                {s.streak} ${s.amount}{s.amount>=cap?' 🔴':''}
              </div>
            ))}
          </div>
        </div>

        <button onClick={run} disabled={loading} style={{ width:'100%', padding:12, borderRadius:10, background:loading?'#1e2d3d':(sym?.color||'#6366f1'), color:'white', fontSize:15, fontWeight:700, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <span style={{ display:'inline-block', animation:loading?'spin 1s linear infinite':'none', fontSize:18 }}>⟳</span>
          {loading?'Yahoo Finance 3년 데이터 분석 중...':'백테스트 실행'}
        </button>
      </div>

      {error && <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, padding:'14px 18px', color:'#f87171', marginBottom:18, fontSize:13 }}>⚠️ {error}</div>}

      {!ran && !loading && (
        <div style={{ textAlign:'center', padding:'70px 0', color:'#475569' }}>
          <div style={{ fontSize:44, marginBottom:14 }}>📊</div>
          <div style={{ fontSize:15, fontWeight:500, color:'#64748b', marginBottom:6 }}>설정 후 백테스트를 실행하세요</div>
          <div style={{ fontSize:13 }}>3년 실제 데이터로 동적 사이징 전략의 효과를 검증합니다</div>
        </div>
      )}

      {loading && <div style={{ textAlign:'center', padding:'70px 0', color:'#475569' }}><div style={{ fontSize:36, display:'inline-block', animation:'spin 1s linear infinite', marginBottom:14 }}>⟳</div><div style={{ fontSize:14 }}>Yahoo Finance에서 3년치 데이터 수집 중...</div></div>}

      {result && !loading && (
        <div style={{ animation:'fadeUp 0.4s ease' }}>
          <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'22px', marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>🏆 전략 성과 비교</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { label:'🎯 동적 사이징', val:`${d?.totalReturn>=0?'+':''}${d?.totalReturn}%`, sub:`최종 $${d?.finalEquity.toLocaleString()}`, color:d?.totalReturn>=0?'#4ade80':'#f87171', hi:true },
                { label:'📌 고정 사이징', val:`${b?.totalReturn>=0?'+':''}${b?.totalReturn}%`, sub:`최종 $${b?.finalEquity.toLocaleString()}`, color:b?.totalReturn>=0?'#4ade80':'#f87171' },
                { label:'📈 바이앤홀드', val:`${result.buyHoldReturn>=0?'+':''}${result.buyHoldReturn}%`, sub:'3년 단순 보유', color:result.buyHoldReturn>=0?'#4ade80':'#f87171' },
              ].map((item,i) => (
                <div key={i} style={{ background:'#0a1628', borderRadius:12, padding:18, border:`${i===0?'2px':'1px'} solid ${i===0?'#6366f1':'#1e2d3d'}` }}>
                  <div style={{ fontSize:11, color:'#475569', marginBottom:10, fontWeight:600 }}>{item.label}</div>
                  <div style={{ fontSize:26, fontWeight:700, color:item.color, fontFamily:'monospace' }}>{item.val}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:5 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {result.combined?.length > 0 && (
            <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:20, marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>💰 자산 추이 비교</div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:14 }}>동적 vs 고정 사이징 3년간 비교</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={result.combined}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:'#475569' }} tickFormatter={v=>v.slice(0,7)} interval={Math.floor((result.combined.length||1)/8)} />
                  <YAxis tick={{ fontSize:10, fill:'#475569' }} tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'} />
                  <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #1e2d3d', borderRadius:8, color:'#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize:12, color:'#94a3b8' }} />
                  <Line type="monotone" dataKey="dynamic" stroke="#6366f1" strokeWidth={2.5} dot={false} name="동적 사이징" />
                  <Line type="monotone" dataKey="basic" stroke="#475569" strokeWidth={1.5} dot={false} name="고정 사이징" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            <Stat label="연간 평균 매수" value={`${d?.annualTrades}회`} sub="3년 평균" />
            <Stat label="최대 연속 하락" value={`${d?.maxStreak}회`} sub="최장 연속" color="#f87171" />
            <Stat label="승률" value={`${d?.winRate}%`} sub={`${d?.wins}승 ${d?.losses}패`} color="#4ade80" />
            <Stat label="최대 낙폭" value={`-${d?.maxDrawdown}%`} sub="MDD" color="#f87171" />
          </div>
        </div>
      )}
    </div>
  );
}
