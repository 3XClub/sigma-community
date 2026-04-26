import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

const SYMBOLS = [
  { symbol:'TQQQ', name:'TQQQ (나스닥 3배)', color:'#6366f1', touches:24, maxStreak:5 },
  { symbol:'QLD',  name:'QLD (나스닥 2배)',  color:'#3b82f6', touches:18, maxStreak:3 },
  { symbol:'SOXL', name:'SOXL (반도체 3배)', color:'#f59e0b', touches:30, maxStreak:6 },
];

function Stat({ label, value, sub, color='#e2e8f0', accent='#1e2d3d', big=false }) {
  return (
    <div style={{ background:'#0f172a', borderRadius:12, padding:'16px 18px', border:`1px solid ${accent}` }}>
      <div style={{ fontSize:11, color:'#475569', marginBottom:6, fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:big?26:20, fontWeight:700, color, fontFamily:'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0f172a', border:'1px solid #1e2d3d', borderRadius:10, padding:'12px 16px', fontSize:12 }}>
      <div style={{ color:'#475569', marginBottom:8, fontFamily:'monospace' }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontFamily:'monospace', marginBottom:3 }}>
          {p.name}: <strong>{p.value >= 0 ? '+' : ''}{p.value?.toFixed(1)}%</strong>
        </div>
      ))}
    </div>
  );
};

export default function Backtest() {
  const [symbol, setSymbol] = useState('TQQQ');
  const [seed, setSeed] = useState(20000);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ran, setRan] = useState(false);

  const sym = SYMBOLS.find(s => s.symbol === symbol);

  // 씨드 기반 1회 매수금 자동 계산
  const calcBuyAmt = () => {
    if (!sym) return 700;
    const normalTimes = sym.touches - sym.maxStreak;
    const streakSum = Array.from({length: sym.maxStreak}, (_,i) => 1 + i*0.4).reduce((a,b)=>a+b, 0);
    return Math.round(seed / (normalTimes + streakSum));
  };
  const buyAmt = calcBuyAmt();

  const run = useCallback(async () => {
    setLoading(true); setError(null); setRan(true);
    try {
      const res = await fetch(`/api/backtest?symbol=${symbol}&seed=${seed}&buyAmt=${buyAmt}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }, [symbol, seed, buyAmt]);

  const s = result?.sigma1;
  const b = result?.buyHold;

  // 원금 회복 빠른 일수
  const recoveryDiff = s && b && s.recoveryDays && b.recoveryDays
    ? b.recoveryDays - s.recoveryDays : null;

  // 차트 — 일부 포인트만 (성능)
  const chartData = result?.combined
    ? result.combined.filter((_,i) => i % 3 === 0)
    : [];

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>1σ Strategy Backtester</div>
        <h1 style={{ fontSize:24, fontWeight:700 }}>📊 폭락장 시뮬레이션</h1>
        <p style={{ fontSize:13, color:'#475569', marginTop:5 }}>2022년 대폭락 → 회복까지 · 1σ 전략 vs 바이앤홀드 비교</p>
      </div>

      {/* 설정 */}
      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'22px', marginBottom:18 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>⚙️ 시뮬레이션 설정</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
          <div>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>종목</label>
            <select value={symbol} onChange={e => setSymbol(e.target.value)}>
              {SYMBOLS.map(s => <option key={s.symbol} value={s.symbol}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>씨드 ($)</label>
            <input type="number" value={seed} onChange={e => setSeed(+e.target.value)} step={1000} min={1000} />
          </div>
        </div>

        {/* 참고 정보 */}
        {sym && (
          <div style={{ background:'#0a1628', borderRadius:10, padding:'14px 16px', marginBottom:18, border:`1px solid ${sym.color}25` }}>
            <div style={{ fontSize:12, color:'#64748b', fontWeight:600, marginBottom:10 }}>📌 {sym.symbol} 매수 방식 참고</div>
            <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.8 }}>
              {sym.symbol}은 연평균 <span style={{ color:sym.color, fontWeight:700 }}>{sym.touches}회</span> 1σ 하락 발생
              → 씨드 <span style={{ color:'#e2e8f0', fontFamily:'monospace' }}>${seed.toLocaleString()}</span>을
              <span style={{ color:sym.color, fontWeight:700 }}> {sym.touches}회</span>에 나눠 매수
              → 1회당 <span style={{ color:'#4ade80', fontFamily:'monospace', fontWeight:700 }}>${buyAmt.toLocaleString()}</span>
              <span style={{ color:'#64748b', fontSize:12 }}> (최대 연속 {sym.maxStreak}회 반영)</span>
            </div>
          </div>
        )}

        <button onClick={run} disabled={loading} style={{ width:'100%', padding:13, borderRadius:10, background:loading?'#1e2d3d':(sym?.color||'#6366f1'), color:'white', fontSize:15, fontWeight:700, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <span style={{ display:'inline-block', animation:loading?'spin 1s linear infinite':'none', fontSize:18 }}>⟳</span>
          {loading ? 'Yahoo Finance 4년 데이터 분석 중...' : '시뮬레이션 실행'}
        </button>
      </div>

      {error && (
        <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, padding:'14px 18px', color:'#f87171', marginBottom:18, fontSize:13 }}>
          ⚠️ {error}
        </div>
      )}

      {!ran && !loading && (
        <div style={{ textAlign:'center', padding:'70px 0', color:'#475569' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📉📈</div>
          <div style={{ fontSize:16, fontWeight:600, color:'#64748b', marginBottom:8 }}>2022 폭락장 → 회복까지</div>
          <div style={{ fontSize:13, color:'#475569', lineHeight:1.8 }}>
            1σ 전략이 폭락장에서 얼마나 덜 빠지고<br/>
            얼마나 더 빨리 원금을 회복하는지 확인하세요
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'70px 0', color:'#475569' }}>
          <div style={{ fontSize:36, display:'inline-block', animation:'spin 1s linear infinite', marginBottom:14 }}>⟳</div>
          <div style={{ fontSize:14 }}>4년치 실제 데이터로 시뮬레이션 중...</div>
        </div>
      )}

      {result && !loading && (
        <div style={{ animation:'fadeUp 0.4s ease' }}>

          {/* 핵심 메시지 */}
          <div style={{ background:'linear-gradient(135deg,#0f172a,#1e1b4b)', borderRadius:14, border:'1px solid rgba(99,102,241,0.3)', padding:'24px 28px', marginBottom:16 }}>
            <div style={{ fontSize:13, color:'#6366f1', fontWeight:600, marginBottom:12, letterSpacing:'0.06em' }}>🔑 핵심 비교</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:20, alignItems:'center' }}>
              {/* 1σ */}
              <div>
                <div style={{ fontSize:12, color:'#a5b4fc', fontWeight:600, marginBottom:8 }}>📡 1σ 전략</div>
                <div style={{ fontSize:13, color:'#94a3b8', lineHeight:2, display:'flex', flexDirection:'column', gap:2 }}>
                  <span>최대 낙폭 <span style={{ fontFamily:'monospace', fontWeight:700, color:'#fbbf24' }}>-{s?.maxDrawdown}%</span></span>
                  <span>최종 수익률 <span style={{ fontFamily:'monospace', fontWeight:700, color:s?.totalReturn>=0?'#4ade80':'#f87171' }}>{s?.totalReturn>=0?'+':''}{s?.totalReturn}%</span></span>
                  <span>원금 회복 <span style={{ fontFamily:'monospace', fontWeight:700, color:'#4ade80' }}>{s?.recoveryDate ? s.recoveryDate : '미회복'}</span></span>
                  <span>총 매수 <span style={{ fontFamily:'monospace', fontWeight:700, color:'#a5b4fc' }}>{s?.buyCount}회</span></span>
                </div>
              </div>

              {/* VS */}
              <div style={{ textAlign:'center' }}>
                {recoveryDiff !== null && recoveryDiff > 0 && (
                  <div style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:12, padding:'14px 18px' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:'#4ade80', fontFamily:'monospace', lineHeight:1 }}>
                      {Math.abs(recoveryDiff)}일
                    </div>
                    <div style={{ fontSize:11, color:'#4ade80', marginTop:6, fontWeight:600 }}>더 빨리 회복! 🚀</div>
                  </div>
                )}
                {recoveryDiff === null && (
                  <div style={{ fontSize:20, color:'#475569' }}>VS</div>
                )}
              </div>

              {/* 바이앤홀드 */}
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12, color:'#64748b', fontWeight:600, marginBottom:8 }}>📈 바이앤홀드</div>
                <div style={{ fontSize:13, color:'#64748b', lineHeight:2, display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
                  <span>최대 낙폭 <span style={{ fontFamily:'monospace', fontWeight:700, color:'#f87171' }}>-{b?.maxDrawdown}%</span></span>
                  <span>최종 수익률 <span style={{ fontFamily:'monospace', fontWeight:700, color:b?.totalReturn>=0?'#4ade80':'#f87171' }}>{b?.totalReturn>=0?'+':''}{b?.totalReturn}%</span></span>
                  <span>원금 회복 <span style={{ fontFamily:'monospace', fontWeight:700, color:'#94a3b8' }}>{b?.recoveryDate ? b.recoveryDate : '미회복'}</span></span>
                  <span>매수 <span style={{ fontFamily:'monospace', fontWeight:700, color:'#64748b' }}>1회 (전액)</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* 수익률 추이 차트 */}
          <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:20, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>📉 수익률 추이 비교 (원금 대비 %)</div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:16 }}>0% 기준선 = 원금 · 먼저 0%로 돌아오는 전략이 더 빨리 회복</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="date" tick={{ fontSize:10, fill:'#475569' }} tickFormatter={v=>v.slice(0,7)} interval={Math.floor(chartData.length/8)} />
                <YAxis tick={{ fontSize:10, fill:'#475569' }} tickFormatter={v=>v+'%'} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:12, color:'#94a3b8' }} />
                {/* 원금선 */}
                <ReferenceLine y={0} stroke="#4ade80" strokeWidth={1.5} strokeDasharray="6 3" label={{ value:'원금 0%', position:'insideTopRight', fontSize:11, fill:'#4ade80' }} />
                <Line type="monotone" dataKey="sigma1" stroke={sym?.color||'#6366f1'} strokeWidth={2.5} dot={false} name="1σ 전략" />
                <Line type="monotone" dataKey="buyHold" stroke="#f87171" strokeWidth={2} dot={false} name="바이앤홀드" strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 상세 비교 카드 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }}>
            {/* MDD 비교 */}
            <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'20px 22px' }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:14, color:'#e2e8f0' }}>📉 최대 낙폭 (MDD) 비교</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                    <span style={{ color:'#a5b4fc' }}>1σ 전략</span>
                    <span style={{ fontFamily:'monospace', fontWeight:700, color:'#fbbf24' }}>-{s?.maxDrawdown}%</span>
                  </div>
                  <div style={{ height:10, background:'#1e2d3d', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(s?.maxDrawdown||0, 100)}%`, background:'#fbbf24', borderRadius:99 }} />
                  </div>
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                    <span style={{ color:'#64748b' }}>바이앤홀드</span>
                    <span style={{ fontFamily:'monospace', fontWeight:700, color:'#f87171' }}>-{b?.maxDrawdown}%</span>
                  </div>
                  <div style={{ height:10, background:'#1e2d3d', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(b?.maxDrawdown||0, 100)}%`, background:'#f87171', borderRadius:99 }} />
                  </div>
                </div>
                {s && b && (
                  <div style={{ fontSize:12, color:'#4ade80', background:'rgba(74,222,128,0.08)', borderRadius:8, padding:'8px 12px', border:'1px solid rgba(74,222,128,0.15)', marginTop:4 }}>
                    ✅ 1σ 전략이 <strong>{(b.maxDrawdown - s.maxDrawdown).toFixed(1)}%p 덜 빠졌어요</strong>
                  </div>
                )}
              </div>
            </div>

            {/* 원금 회복 비교 */}
            <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'20px 22px' }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:14, color:'#e2e8f0' }}>🚀 원금 회복 시점 비교</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:11, color:'#a5b4fc', marginBottom:3 }}>1σ 전략</div>
                    <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:16, color:'#4ade80' }}>{s?.recoveryDate || '미회복'}</div>
                    {s?.recoveryDays && <div style={{ fontSize:11, color:'#475569' }}>시작 후 {s.recoveryDays}일</div>}
                  </div>
                  <div style={{ fontSize:28 }}>🏆</div>
                </div>
                <div style={{ height:'1px', background:'#1e2d3d' }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:11, color:'#64748b', marginBottom:3 }}>바이앤홀드</div>
                    <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:16, color:'#94a3b8' }}>{b?.recoveryDate || '미회복'}</div>
                    {b?.recoveryDays && <div style={{ fontSize:11, color:'#475569' }}>시작 후 {b.recoveryDays}일</div>}
                  </div>
                  <div style={{ fontSize:28 }}>🐢</div>
                </div>
                {recoveryDiff !== null && recoveryDiff > 0 && (
                  <div style={{ fontSize:12, color:'#4ade80', background:'rgba(74,222,128,0.08)', borderRadius:8, padding:'8px 12px', border:'1px solid rgba(74,222,128,0.15)' }}>
                    ✅ 1σ 전략이 <strong>{recoveryDiff}일 더 빨리</strong> 원금 회복!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 최종 수익률 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            <Stat label="1σ 최종 수익률" value={`${s?.totalReturn>=0?'+':''}${s?.totalReturn}%`} color={s?.totalReturn>=0?'#4ade80':'#f87171'} sub={`최종 $${s?.finalEquity.toLocaleString()}`} accent={s?.totalReturn>=0?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'} />
            <Stat label="바이앤홀드 수익률" value={`${b?.totalReturn>=0?'+':''}${b?.totalReturn}%`} color={b?.totalReturn>=0?'#4ade80':'#f87171'} sub={`최종 $${b?.finalEquity.toLocaleString()}`} />
            <Stat label="MDD 차이" value={`${(b?.maxDrawdown - s?.maxDrawdown).toFixed(1)}%p`} sub="1σ가 덜 빠짐" color="#fbbf24" accent="rgba(251,191,36,0.2)" />
            <Stat label="회복 빠른 일수" value={recoveryDiff > 0 ? `${recoveryDiff}일` : '-'} sub="1σ가 더 빨리 회복" color="#4ade80" accent="rgba(74,222,128,0.2)" />
          </div>

          {/* 결론 */}
          <div style={{ marginTop:14, background:'rgba(99,102,241,0.08)', borderRadius:14, border:'1px solid rgba(99,102,241,0.2)', padding:'20px 24px' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#a5b4fc', marginBottom:10 }}>💡 1σ 전략이 유효한 이유</div>
            <div style={{ fontSize:13, color:'#64748b', lineHeight:1.9 }}>
              바이앤홀드는 폭락장에서 <strong style={{ color:'#f87171' }}>-{b?.maxDrawdown}%</strong>까지 빠지며 대부분의 투자자가 패닉셀 합니다.<br/>
              1σ 전략은 폭락 시 오히려 더 많이 매수해 평균단가를 낮추고, <strong style={{ color:'#4ade80' }}>-{s?.maxDrawdown}%</strong>로 방어하며<br/>
              원금 회복도 <strong style={{ color:'#4ade80' }}>{recoveryDiff > 0 ? `${recoveryDiff}일 더 빠릅니다` : '비슷한 시점에 이뤄집니다'}</strong>.<br/>
              <span style={{ color:'#6366f1', fontWeight:600 }}>통계로 사고, 함께 버틴다. — 폭락장이 오히려 기회입니다.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
