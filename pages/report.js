import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function Report() {
  const [participants, setParticipants] = useState([]);
  const [trades, setTrades] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [months, setMonths] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('participants').select('*');
      const { data: t } = await supabase.from('trades').select('*').order('trade_date');
      setParticipants(p || []);
      setTrades(t || []);
      const ms = [...new Set((t || []).map(x => x.trade_date?.slice(0, 7)))].filter(Boolean).sort().reverse();
      setMonths(ms);
      if (ms.length > 0) setSelectedMonth(ms[0]);
    }
    load();
  }, []);

  const monthTrades = trades.filter(t => t.trade_date?.startsWith(selectedMonth));
  const monthSells = monthTrades.filter(t => t.type === 'SELL');
  const monthBuys = monthTrades.filter(t => t.type === 'BUY');

  const totalPnl = monthSells.reduce((s, t) => s + (t.pnl || 0), 0);
  const totalBuyAmt = monthBuys.reduce((s, t) => s + (t.amount_usd || 0), 0);
  const wins = monthSells.filter(t => t.pnl > 0).length;
  const winRate = monthSells.length > 0 ? (wins / monthSells.length * 100).toFixed(0) : 0;

  // 참가자별 월 성과
  const participantStats = participants.map(p => {
    const pSells = monthSells.filter(t => t.participant_id === p.id);
    const pBuys = monthBuys.filter(t => t.participant_id === p.id);
    const pnl = pSells.reduce((s, t) => s + (t.pnl || 0), 0);
    return { ...p, pnl, buys: pBuys.length, sells: pSells.length };
  }).sort((a, b) => b.pnl - a.pnl);

  // 종목별 매수 분포
  const symbolDist = ['TQQQ','QLD','SOXL'].map(sym => ({
    name: sym,
    count: monthBuys.filter(t => t.symbol === sym).length,
    amount: monthBuys.filter(t => t.symbol === sym).reduce((s, t) => s + t.amount_usd, 0),
  }));

  // 연속 하락 분포
  const streakDist = {};
  monthBuys.forEach(t => { streakDist[t.streak] = (streakDist[t.streak] || 0) + 1; });
  const streakData = Object.entries(streakDist).sort().map(([k, v]) => ({ name: k + '연속', count: v }));

  const COLORS = ['#6366f1','#3b82f6','#f59e0b'];

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6 }}>Monthly Report</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>월별 리포트</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>커뮤니티 전체 성과 자동 집계</p>
        </div>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: 160 }}>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {selectedMonth && (
        <>
          {/* Summary */}
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: 14, padding: '24px', marginBottom: 18, color: 'white' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>{selectedMonth} 커뮤니티 성과 요약</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: '이달 실현 손익', val: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? '#4ade80' : '#f87171' },
                { label: '총 매수 횟수', val: `${monthBuys.length}회`, color: '#93c5fd' },
                { label: '총 익절 횟수', val: `${monthSells.length}회`, color: '#86efac' },
                { label: '승률', val: `${winRate}%`, color: '#fbbf24' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {/* 참가자별 성과 */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>👤 참가자별 이달 성과</div>
              {participantStats.length === 0
                ? <div style={{ color: '#94a3b8', fontSize: 13 }}>데이터 없음</div>
                : participantStats.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < participantStats.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.nickname}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>매수 {p.buys}회 · 익절 {p.sells}회</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: p.pnl >= 0 ? '#16a34a' : p.pnl < 0 ? '#dc2626' : '#94a3b8' }}>
                      {p.pnl !== 0 ? `${p.pnl >= 0 ? '+' : ''}$${p.pnl.toFixed(0)}` : '-'}
                    </div>
                  </div>
                ))
              }
            </div>

            {/* 종목별 분포 */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📊 종목별 매수 분포</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={symbolDist} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, count }) => count > 0 ? `${name} ${count}회` : ''}>
                    {symbolDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
                {symbolDist.map((s, i) => (
                  <span key={s.name} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], display: 'inline-block' }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 연속 하락 분포 */}
          {streakData.length > 0 && (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>📉 연속 하락 매수 분포</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>이달 몇 연속 하락에서 매수가 발생했나</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={streakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip formatter={v => [v + '회', '발생']} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 이달 거래 목록 */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontSize: 14, fontWeight: 600 }}>
              📋 {selectedMonth} 전체 거래 내역
            </div>
            {monthTrades.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>이달 거래 없음</div>
              : monthTrades.slice().reverse().map((t, i) => (
                <div key={t.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '11px 20px', borderBottom: i < monthTrades.length - 1 ? '1px solid #f8fafc' : 'none', fontSize: 13 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', width: 70, flexShrink: 0 }}>{t.trade_date?.slice(5)}</span>
                  <span style={{ fontWeight: 600, width: 70, flexShrink: 0 }}>{t.nickname}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: t.symbol === 'SOXL' ? '#f59e0b' : t.symbol === 'TQQQ' ? '#6366f1' : '#3b82f6', width: 50, flexShrink: 0 }}>{t.symbol}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: t.type === 'SELL' ? '#f0fdf4' : '#eff6ff', color: t.type === 'SELL' ? '#16a34a' : '#1d4ed8', flexShrink: 0 }}>
                    {t.type === 'SELL' ? '익절' : '매수'}
                  </span>
                  <span style={{ fontFamily: 'monospace', flex: 1 }}>${t.price?.toFixed(2)} · ${t.amount_usd?.toLocaleString()}</span>
                  {t.streak > 1 && <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>{t.streak}연속</span>}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: t.pnl > 0 ? '#16a34a' : t.pnl < 0 ? '#dc2626' : '#94a3b8' }}>
                    {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl?.toFixed(0)}` : '-'}
                  </span>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
}
