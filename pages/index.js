import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MEDAL = ['🥇','🥈','🥉'];
function Card({ label, value, sub, color='#e2e8f0', accent='#1e2d3d' }) {
  return (
    <div style={{ background: '#0f172a', borderRadius: 12, padding: '16px 18px', border: `1px solid ${accent}` }}>
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function Home() {
  const [participants, setParticipants] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('participants').select('*').eq('status','approved').order('joined_at');
      const { data: t } = await supabase.from('trades').select('*').order('trade_date');
      setParticipants(p || []); setTrades(t || []); setLoading(false);
    }
    load();
  }, []);

  const board = participants.map(p => {
    const my = trades.filter(t => t.participant_id === p.id);
    const pnl = my.filter(t => t.type==='SELL').reduce((s,t) => s+(t.pnl||0), 0);
    const ret = p.seed_usd > 0 ? (pnl/p.seed_usd)*100 : 0;
    return { ...p, pnl, ret, wins: my.filter(t=>t.type==='SELL'&&t.pnl>0).length, losses: my.filter(t=>t.type==='SELL'&&t.pnl<=0).length, cnt: my.length };
  }).sort((a,b) => b.ret - a.ret);

  const totalSeed = participants.reduce((s,p) => s+p.seed_usd, 0);
  const totalPnl = board.reduce((s,p) => s+p.pnl, 0);
  const avgRet = board.length > 0 ? board.reduce((s,p) => s+p.ret, 0)/board.length : 0;
  const monthly = {}; trades.filter(t=>t.type==='SELL').forEach(t => { const m=t.trade_date?.slice(0,7); if(m) monthly[m]=(monthly[m]||0)+(t.pnl||0); });
  const chart = Object.entries(monthly).sort().map(([m,v]) => ({ m, v: +v.toFixed(0) }));

  if (loading) return <div style={{ textAlign:'center', padding: 80, color:'#475569' }}>⟳ 로딩 중...</div>;

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)', borderRadius:16, padding:'36px 32px 28px', marginBottom:18, border:'1px solid rgba(99,102,241,0.2)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <img src="/logo.jpg" alt="1σ" style={{ width:56, height:56, borderRadius:12, objectFit:'cover' }} />
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', padding:'3px 12px', borderRadius:20, marginBottom:6 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#6366f1', display:'inline-block', animation:'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize:11, color:'#a5b4fc', letterSpacing:'0.08em' }}>1기 모집 중 · 무료 · 2026</span>
            </div>
            <h1 style={{ fontSize:28, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>1σ 매수단 커뮤니티</h1>
          </div>
        </div>
        <p style={{ fontSize:15, color:'#94a3b8', marginBottom:4 }}>QLD · TQQQ · SOXL</p>
        <p style={{ fontSize:14, color:'#64748b', marginBottom:3 }}>통계로 사고, 함께 버틴다.</p>
        <p style={{ fontSize:13, color:'#4a5568', fontStyle:'italic', marginBottom:22 }}>Buy the math. Brave the dip. Together.</p>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <a href="/join" style={{ background:'#6366f1', color:'white', padding:'10px 22px', borderRadius:8, fontSize:13, fontWeight:600 }}>🙋 1기 참가 신청</a>
          <a href="/sigma" style={{ background:'rgba(255,255,255,0.06)', color:'#94a3b8', padding:'10px 22px', borderRadius:8, fontSize:13, border:'1px solid rgba(255,255,255,0.1)' }}>📡 오늘의 1σ 확인</a>
          <a href="/my" style={{ background:'rgba(255,255,255,0.06)', color:'#94a3b8', padding:'10px 22px', borderRadius:8, fontSize:13, border:'1px solid rgba(255,255,255,0.1)' }}>🔐 나의 현황</a>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        <Card label="참가자" value={`${participants.length}명`} sub="1기 현재" />
        <Card label="총 운용 씨드" value={`$${totalSeed.toLocaleString()}`} sub="합산" />
        <Card label="커뮤니티 총 손익" value={`${totalPnl>=0?'+':''}$${totalPnl.toFixed(0)}`} sub="실현 손익" color={totalPnl>=0?'#4ade80':'#f87171'} accent={totalPnl>=0?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'} />
        <Card label="평균 수익률" value={`${avgRet>=0?'+':''}${avgRet.toFixed(1)}%`} sub="참가자 평균" color={avgRet>=0?'#4ade80':'#f87171'} accent={avgRet>=0?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'} />
      </div>

      {chart.length > 0 && (
        <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:20, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>💰 커뮤니티 월별 실현 손익</div>
          <div style={{ fontSize:12, color:'#475569', marginBottom:14 }}>전체 참가자 익절 합산</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="m" tick={{ fontSize:11, fill:'#475569' }} />
              <YAxis tick={{ fontSize:11, fill:'#475569' }} tickFormatter={v=>'$'+v} />
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #1e2d3d', borderRadius:8, color:'#e2e8f0' }} formatter={v=>['$'+v.toLocaleString(),'손익']} />
              <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2.5} dot={{ r:4, fill:'#6366f1' }} name="월 손익" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid #1e2d3d' }}>
          <div style={{ fontSize:14, fontWeight:600 }}>🏆 수익률 리더보드</div>
          <div style={{ fontSize:12, color:'#475569', marginTop:3 }}>실현 손익 기준 · 실시간</div>
        </div>
        {board.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', color:'#475569', fontSize:14 }}>아직 참가자가 없습니다. <a href="/join" style={{ color:'#6366f1' }}>첫 번째로 참가하세요!</a></div>
        ) : board.map((p,i) => (
          <div key={p.id} style={{ display:'grid', gridTemplateColumns:'40px 1fr 120px 100px 60px 60px', alignItems:'center', padding:'13px 20px', borderBottom: i<board.length-1?'1px solid #0a1628':'none', background: i===0?'rgba(99,102,241,0.05)':'transparent' }}>
            <div style={{ fontSize:i<3?20:13, textAlign:'center', color:'#475569', fontWeight:700 }}>{i<3?MEDAL[i]:i+1}</div>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{p.nickname}</div>
              <div style={{ fontSize:11, color:'#475569' }}>씨드 ${p.seed_usd.toLocaleString()} · {p.cnt}회</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:16, color:p.ret>=0?'#4ade80':'#f87171' }}>{p.ret>=0?'+':''}{p.ret.toFixed(2)}%</div>
              <div style={{ fontSize:11, color:'#475569' }}>수익률</div>
            </div>
            <div style={{ textAlign:'right', fontFamily:'monospace', fontWeight:600, color:p.pnl>=0?'#4ade80':'#f87171' }}>{p.pnl>=0?'+':''}${p.pnl.toFixed(0)}</div>
            <div style={{ textAlign:'right', fontSize:12, color:'#4ade80', fontWeight:600 }}>{p.wins}승</div>
            <div style={{ textAlign:'right', fontSize:12, color:'#f87171', fontWeight:600 }}>{p.losses}패</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid #1e2d3d', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div><div style={{ fontSize:14, fontWeight:600 }}>📋 최근 매매 피드</div><div style={{ fontSize:12, color:'#475569', marginTop:3 }}>참가자 전체 거래 타임라인</div></div>
          <a href="/trades" style={{ fontSize:12, color:'#6366f1' }}>전체 보기 →</a>
        </div>
        {trades.length === 0 ? <div style={{ padding:40, textAlign:'center', color:'#475569' }}>아직 기록된 거래가 없습니다.</div>
        : trades.slice(-15).reverse().map((t,i) => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 20px', borderBottom:i<14?'1px solid #0a1628':'none' }}>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:12, fontWeight:700, whiteSpace:'nowrap', background:t.type==='SELL'?'rgba(74,222,128,0.1)':'rgba(99,102,241,0.1)', color:t.type==='SELL'?'#4ade80':'#a5b4fc' }}>{t.type==='SELL'?'익절':'매수'}</span>
            <div style={{ flex:1 }}>
              <span style={{ fontWeight:600, fontSize:13 }}>{t.nickname}</span>
              <span style={{ color:'#64748b', fontSize:13 }}> · {t.symbol} </span>
              <span style={{ fontFamily:'monospace', fontSize:13, color:'#94a3b8' }}>${t.price?.toFixed(2)}</span>
              {t.streak > 1 && <span style={{ marginLeft:6, fontSize:11, color:'#f59e0b', fontWeight:600 }}>{t.streak}σ연속↓</span>}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'monospace', fontSize:13, color:t.type==='SELL'?(t.pnl>=0?'#4ade80':'#f87171'):'#64748b', fontWeight:600 }}>{t.type==='SELL'?`${t.pnl>=0?'+':''}$${t.pnl?.toFixed(0)}`:`$${t.amount_usd?.toFixed(0)}`}</div>
              <div style={{ fontSize:11, color:'#475569' }}>{t.trade_date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
