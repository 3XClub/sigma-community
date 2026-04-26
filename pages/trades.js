import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SYMBOLS = ['TQQQ','QLD','SOXL'];

export default function Trades() {
  const [participants, setParticipants] = useState([]);
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState({ participant_id:'', symbol:'TQQQ', trade_date:new Date().toISOString().split('T')[0], type:'BUY', price:'', amount_usd:'', streak:1, memo:'' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterNick, setFilterNick] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: p } = await supabase.from('participants').select('*').eq('status','approved').order('nickname');
    const { data: t } = await supabase.from('trades').select('*').order('trade_date', { ascending: false });
    setParticipants(p || []); setTrades(t || []); setLoading(false);
  }

  async function saveTrade(e) {
    e.preventDefault();
    if (!form.participant_id || !form.price || !form.amount_usd) { setMsg('❌ 참가자, 가격, 금액은 필수입니다.'); return; }
    const priceNum = parseFloat(form.price);
    const amtNum = parseFloat(form.amount_usd);
    if (isNaN(priceNum) || priceNum <= 0) { setMsg('❌ 올바른 가격을 입력해주세요.'); return; }
    if (isNaN(amtNum) || amtNum <= 0) { setMsg('❌ 올바른 금액을 입력해주세요.'); return; }
    setSaving(true);
    const p = participants.find(x => x.id === form.participant_id);
    let pnl = null, pnl_pct = null;
    if (form.type === 'SELL') {
      const buyTrades = trades.filter(t => t.participant_id === form.participant_id && t.symbol === form.symbol && t.type === 'BUY');
      const sellTrades = trades.filter(t => t.participant_id === form.participant_id && t.symbol === form.symbol && t.type === 'SELL');
      const totalBuyAmt = buyTrades.reduce((s, t) => s + (t.amount_usd||0), 0);
      const totalSellAmt = sellTrades.reduce((s, t) => s + (t.amount_usd||0), 0);
      const netBuy = totalBuyAmt - totalSellAmt;
      if (netBuy > 0) { pnl = +(amtNum - netBuy).toFixed(2); pnl_pct = +((pnl / netBuy) * 100).toFixed(2); }
    }
    const { error } = await supabase.from('trades').insert([{
      participant_id: form.participant_id,
      nickname: p?.nickname,
      symbol: form.symbol,
      trade_date: form.trade_date,
      type: form.type,
      price: priceNum,
      amount_usd: amtNum,
      streak: +form.streak,
      memo: form.memo,
      pnl, pnl_pct,
    }]);
    if (error) { setMsg('❌ 저장 실패: ' + error.message); }
    else { setMsg('✅ 매매 기록 저장 완료!'); setForm(f => ({ ...f, price:'', amount_usd:'', memo:'', streak:1 })); load(); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  const filtered = filterNick === 'all' ? trades : trades.filter(t => t.participant_id === filterNick);
  const SYM_COL = { TQQQ:'#6366f1', QLD:'#3b82f6', SOXL:'#f59e0b' };

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>Trade Log</div>
        <h1 style={{ fontSize:24, fontWeight:700 }}>📝 매매 기록 입력</h1>
        <p style={{ fontSize:13, color:'#64748b', marginTop:5 }}>매수·익절 발생 시 직접 기록해주세요</p>
      </div>

      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'22px', marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:18 }}>📝 새 거래 입력</div>
        <form onSubmit={saveTrade}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>참가자 *</label>
              <select value={form.participant_id} onChange={e => setForm(f=>({...f,participant_id:e.target.value}))}>
                <option value="">선택하세요</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>종목 *</label>
              <select value={form.symbol} onChange={e => setForm(f=>({...f,symbol:e.target.value}))}>
                {SYMBOLS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>구분 *</label>
              <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                <option value="BUY">📥 매수</option>
                <option value="SELL">💰 익절</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>거래일 *</label>
              <input type="date" value={form.trade_date} onChange={e => setForm(f=>({...f,trade_date:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>체결가 (USD) *</label>
              <input type="number" step="0.01" min="0.01" placeholder="예: 52.30" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>{form.type==='BUY'?'매수 금액 (USD) *':'익절 금액 (USD) *'}</label>
              <input type="number" step="0.01" min="0.01" placeholder="예: 700" value={form.amount_usd} onChange={e => setForm(f=>({...f,amount_usd:e.target.value}))} />
            </div>
            {form.type === 'BUY' && (
              <div>
                <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>연속 하락 횟수</label>
                <select value={form.streak} onChange={e => setForm(f=>({...f,streak:e.target.value}))}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}회 연속</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn:form.type==='BUY'?'span 2':'span 3' }}>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>메모 (선택)</label>
              <input placeholder="예: 장 폭락으로 2σ 진입" value={form.memo} onChange={e => setForm(f=>({...f,memo:e.target.value}))} />
            </div>
          </div>
          {msg && <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:12, fontSize:13, background:msg.startsWith('✅')?'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)', color:msg.startsWith('✅')?'#4ade80':'#f87171', border:`1px solid ${msg.startsWith('✅')?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'}` }}>{msg}</div>}
          <button type="submit" disabled={saving} style={{ background:'#6366f1', color:'white', border:'none', padding:'11px 28px', fontWeight:600, fontSize:14, borderRadius:10, cursor:'pointer' }}>
            {saving ? '⟳ 저장 중...' : '💾 기록 저장'}
          </button>
        </form>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        <button onClick={() => setFilterNick('all')} style={{ fontSize:12, padding:'5px 12px', background:filterNick==='all'?'rgba(99,102,241,0.2)':'#0f172a', color:filterNick==='all'?'#a5b4fc':'#64748b', border:`1px solid ${filterNick==='all'?'#6366f1':'#1e2d3d'}`, borderRadius:8 }}>전체</button>
        {participants.map(p => (
          <button key={p.id} onClick={() => setFilterNick(p.id)} style={{ fontSize:12, padding:'5px 12px', background:filterNick===p.id?'rgba(99,102,241,0.2)':'#0f172a', color:filterNick===p.id?'#a5b4fc':'#64748b', border:`1px solid ${filterNick===p.id?'#6366f1':'#1e2d3d'}`, borderRadius:8 }}>
            {p.nickname}
          </button>
        ))}
      </div>

      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'90px 80px 70px 70px 90px 90px 60px 1fr', padding:'10px 16px', background:'#0a1628', borderBottom:'1px solid #1e2d3d', fontSize:11, color:'#64748b', fontWeight:600, gap:8 }}>
          <span>날짜</span><span>닉네임</span><span>종목</span><span>구분</span><span>체결가</span><span>금액</span><span>연속</span><span>손익 / 메모</span>
        </div>
        {loading && <div style={{ padding:32, textAlign:'center', color:'#475569' }}>⟳ 불러오는 중...</div>}
        {!loading && filtered.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#475569', fontSize:14 }}>아직 기록이 없습니다.</div>}
        {filtered.map((t,i) => (
          <div key={t.id} style={{ display:'grid', gridTemplateColumns:'90px 80px 70px 70px 90px 90px 60px 1fr', padding:'11px 16px', borderBottom:i<filtered.length-1?'1px solid #0a1628':'none', fontSize:13, alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'monospace', fontSize:11, color:'#475569' }}>{t.trade_date}</span>
            <span style={{ fontWeight:600, fontSize:13 }}>{t.nickname}</span>
            <span style={{ fontFamily:'monospace', fontWeight:700, color:SYM_COL[t.symbol]||'#94a3b8' }}>{t.symbol}</span>
            <span><span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:700, background:t.type==='SELL'?'rgba(74,222,128,0.1)':'rgba(99,102,241,0.1)', color:t.type==='SELL'?'#4ade80':'#a5b4fc' }}>{t.type==='SELL'?'익절':'매수'}</span></span>
            <span style={{ fontFamily:'monospace' }}>${t.price?.toFixed(2)}</span>
            <span style={{ fontFamily:'monospace', fontWeight:600 }}>${t.amount_usd?.toLocaleString()}</span>
            <span style={{ textAlign:'center' }}>{t.streak>1?<span style={{ fontSize:11, color:'#f59e0b', fontWeight:700 }}>{t.streak}연속</span>:<span style={{ color:'#475569' }}>-</span>}</span>
            <span style={{ fontFamily:'monospace', fontWeight:600, color:t.pnl>0?'#4ade80':t.pnl<0?'#f87171':'#475569', fontSize:12 }}>
              {t.pnl!=null?`${t.pnl>=0?'+':''}$${t.pnl?.toFixed(0)} (${t.pnl_pct?.toFixed(1)}%)`:(t.memo||'-')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
