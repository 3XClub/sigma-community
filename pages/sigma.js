import { useState, useEffect } from 'react';

const STOCKS = [
  { symbol: 'TQQQ', name: 'TQQQ (나스닥 3배)', color: '#6366f1' },
  { symbol: 'QLD',  name: 'QLD (나스닥 2배)',  color: '#3b82f6' },
  { symbol: 'SOXL', name: 'SOXL (반도체 3배)', color: '#f59e0b' },
];

function Badge({ distPct }) {
  if (distPct < 3) return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>🔥 매수 근접</span>;
  if (distPct < 8) return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 700, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>👀 관심 구간</span>;
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 600, background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0' }}>⏳ 대기</span>;
}

export default function Sigma() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/sigma');
      const json = await res.json();
      setData(json.stocks || []);
      setUpdatedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const fmt = n => n >= 100 ? '$' + n.toFixed(1) : n >= 10 ? '$' + n.toFixed(2) : '$' + n.toFixed(3);

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6 }}>Daily Signal</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>오늘의 1σ 매수가</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>전일 종가 기준 · 6개월 롤링 표준편차 · Yahoo Finance</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {updatedAt && <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>업데이트 {updatedAt}</span>}
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
            <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>⟳</span>
            {loading ? '조회 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {!loading && data.filter(s => !s.error && s.distPct1 < 3).length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '14px 18px', marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 24 }}>🔥</span>
          <div>
            <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>매수 근접 종목 있음!</div>
            <div style={{ fontSize: 13, color: '#166534' }}>
              {data.filter(s => !s.error && s.distPct1 < 3).map(s => s.symbol).join(', ')}이(가) 1σ 매수가에 근접했습니다.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STOCKS.map(stock => {
          const s = data.find(d => d.symbol === stock.symbol);
          return (
            <div key={stock.symbol} style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: stock.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: stock.color, fontFamily: 'monospace' }}>
                    {stock.symbol[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{stock.symbol}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{stock.name}</div>
                  </div>
                </div>
                {s && !s.error && <Badge distPct={s.distPct1} />}
              </div>

              {loading && <div style={{ height: 60, background: '#f8fafc', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />}
              {!loading && s?.error && <div style={{ color: '#94a3b8', fontSize: 13 }}>조회 실패 — 잠시 후 다시 시도해주세요</div>}
              {!loading && s && !s.error && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {[
                      { label: '전일 종가', val: fmt(s.lastClose), sub: `${s.dailyChange >= 0 ? '+' : ''}${s.dailyChange?.toFixed(2)}%`, color: s.dailyChange >= 0 ? '#16a34a' : '#dc2626' },
                      { label: '1σ 매수가', val: fmt(s.buy1), sub: `-${s.distPct1?.toFixed(1)}% 하락 시`, color: '#16a34a' },
                      { label: '2σ 매수가', val: fmt(s.buy2), sub: `-${(s.distPct1 * 2)?.toFixed(1)}% 하락 시`, color: '#1d4ed8' },
                      { label: '3σ 매수가', val: fmt(s.buy3), sub: `-${(s.distPct1 * 3)?.toFixed(1)}% 하락 시`, color: '#7c3aed' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5 }}>{item.label}</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 17, color: item.color }}>{item.val}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{item.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sizing guide */}
                  <div style={{ marginTop: 14, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>💡 동적 사이징 가이드 (씨드 $20,000 기준)</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[700,800,900,1000,1100,1200].map((amt, i) => (
                        <div key={i} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, fontFamily: 'monospace', fontWeight: 600, background: amt >= 1200 ? '#fef2f2' : i === 0 ? '#eff6ff' : '#f0fdf4', color: amt >= 1200 ? '#dc2626' : i === 0 ? '#1d4ed8' : '#16a34a' }}>
                          {i + 1}연속: ${amt}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
        투자 권유 아님 · 개인 참고용 · 실제 거래 시 본인 판단으로 진행하세요
      </div>
    </div>
  );
}
