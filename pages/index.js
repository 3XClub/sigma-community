import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MEDAL = ['🥇','🥈','🥉'];

function StatCard({ label, value, sub, color = '#0f172a', bg = 'white' }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: '16px 18px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function Leaderboard() {
  const [participants, setParticipants] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('participants').select('*').order('joined_at');
      const { data: t } = await supabase.from('trades').select('*').order('trade_date');
      setParticipants(p || []);
      setTrades(t || []);
      setLoading(false);
    }
    load();
  }, []);

  // 참가자별 수익률 계산
  const leaderboard = participants.map(p => {
    const myTrades = trades.filter(t => t.participant_id === p.id);
    const totalPnl = myTrades.filter(t => t.type === 'SELL').reduce((s, t) => s + (t.pnl || 0), 0);
    const totalBuy = myTrades.filter(t => t.type === 'BUY').reduce((s, t) => s + (t.amount_usd || 0), 0);
    const returnPct = p.seed_usd > 0 ? ((totalPnl / p.seed_usd) * 100) : 0;
    const wins = myTrades.filter(t => t.type === 'SELL' && t.pnl > 0).length;
    const losses = myTrades.filter(t => t.type === 'SELL' && t.pnl <= 0).length;
    return { ...p, totalPnl, totalBuy, returnPct, wins, losses, tradeCount: myTrades.length };
  }).sort((a, b) => b.returnPct - a.returnPct);

  // 전체 통계
  const totalParticipants = participants.length;
  const totalSeed = participants.reduce((s, p) => s + p.seed_usd, 0);
  const totalPnl = leaderboard.reduce((s, p) => s + p.totalPnl, 0);
  const avgReturn = leaderboard.length > 0 ? leaderboard.reduce((s, p) => s + p.returnPct, 0) / leaderboard.length : 0;

  // 월별 수익 추이 (커뮤니티 전체)
  const monthlyData = {};
  trades.filter(t => t.type === 'SELL').forEach(t => {
    const month = t.trade_date?.slice(0, 7);
    if (!month) return;
    monthlyData[month] = (monthlyData[month] || 0) + (t.pnl || 0);
  });
  const chartData = Object.entries(monthlyData).sort().map(([m, pnl]) => ({ month: m, pnl: +pnl.toFixed(0) }));

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>⟳ 로딩 중...</div>;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: 16, padding: '32px', marginBottom: 20, color: 'white' }}>
        <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 8 }}>
          1σ Community · 1기
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>1시그마 매수법 커뮤니티</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, maxWidth: 500 }}>
          QLD · TQQQ · SOXL를 통계로 매수하는 투자자들의 공동 실전 기록.<br/>
          하락장은 같이 버티고, 상승장은 같이 즐깁니다.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <a href="/join" style={{ background: '#6366f1', color: 'white', padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
            🙋 1기 참가 신청
          </a>
          <a href="/sigma" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 22px', borderRadius: 8, fontSize: 14, border: '1px solid rgba(255,255,255,0.2)' }}>
            📡 오늘의 매수가 확인
          </a>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="참가자" value={`${totalParticipants}명`} sub="1기 현재" />
        <StatCard label="총 운용 씨드" value={`$${totalSeed.toLocaleString()}`} sub="합산" />
        <StatCard
          label="커뮤니티 총 손익"
          value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}`}
          sub="실현 손익 합산"
          color={totalPnl >= 0 ? '#16a34a' : '#dc2626'}
          bg={totalPnl >= 0 ? '#f0fdf4' : '#fef2f2'}
        />
        <StatCard
          label="평균 수익률"
          value={`${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(1)}%`}
          sub="참가자 평균"
          color={avgReturn >= 0 ? '#16a34a' : '#dc2626'}
          bg={avgReturn >= 0 ? '#f0fdf4' : '#fef2f2'}
        />
      </div>

      {/* Monthly PnL chart */}
      {chartData.length > 0 && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>💰 커뮤니티 월별 실현 손익</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>전체 참가자 익절 합산</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => '$' + v} />
              <Tooltip formatter={v => ['$' + v.toLocaleString(), '손익']} />
              <Line type="monotone" dataKey="pnl" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} name="월 손익" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Leaderboard */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>🏆 수익률 리더보드</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>실현 손익 기준 · 실시간 업데이트</div>
        </div>
        {leaderboard.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            아직 참가자가 없습니다. <a href="/join" style={{ color: '#6366f1' }}>첫 번째로 참가하세요!</a>
          </div>
        ) : leaderboard.map((p, i) => (
          <div key={p.id} style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 110px 100px 80px 80px',
            alignItems: 'center', padding: '14px 20px',
            borderBottom: i < leaderboard.length - 1 ? '1px solid #f8fafc' : 'none',
            background: i === 0 ? '#fffbeb' : 'white',
          }}>
            <div style={{ fontSize: i < 3 ? 20 : 14, textAlign: 'center', color: '#94a3b8', fontWeight: 700, fontFamily: 'monospace' }}>
              {i < 3 ? MEDAL[i] : i + 1}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nickname}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>씨드 ${p.seed_usd.toLocaleString()} · {p.tradeCount}회 거래</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: p.returnPct >= 0 ? '#16a34a' : '#dc2626' }}>
                {p.returnPct >= 0 ? '+' : ''}{p.returnPct.toFixed(2)}%
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>누적 수익률</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', color: p.totalPnl >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {p.totalPnl >= 0 ? '+' : ''}${p.totalPnl.toFixed(0)}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>실현 손익</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>{p.wins}승</div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>{p.losses}패</div>
          </div>
        ))}
      </div>

      {/* Recent trades feed */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>📋 최근 매매 피드</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>참가자 전체 거래 타임라인</div>
          </div>
          <a href="/trades" style={{ fontSize: 13, color: '#6366f1', fontWeight: 500 }}>전체 보기 →</a>
        </div>
        {trades.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            아직 기록된 거래가 없습니다.
          </div>
        ) : trades.slice(-20).reverse().map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 20px', borderBottom: i < 19 ? '1px solid #f8fafc' : 'none',
          }}>
            <span style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 12, fontWeight: 700, whiteSpace: 'nowrap',
              background: t.type === 'SELL' ? '#f0fdf4' : '#eff6ff',
              color: t.type === 'SELL' ? '#16a34a' : '#1d4ed8',
            }}>
              {t.type === 'SELL' ? '익절' : '매수'}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t.nickname}</span>
              <span style={{ color: '#64748b', fontSize: 13 }}> · {t.symbol} </span>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>${t.price?.toFixed(2)}</span>
              {t.streak > 1 && <span style={{ marginLeft: 6, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{t.streak}연속↓</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: t.type === 'SELL' ? (t.pnl >= 0 ? '#16a34a' : '#dc2626') : '#64748b', fontWeight: 600 }}>
                {t.type === 'SELL' ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl?.toFixed(0)}` : `$${t.amount_usd?.toFixed(0)}`}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.trade_date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
