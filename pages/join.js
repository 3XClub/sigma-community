import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Join() {
  const [form, setForm] = useState({ nickname:'', email:'', seed_tqqq:20000, seed_qld:20000, seed_soxl:20000, intro:'', referral:'' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!form.nickname || !form.email) { setError('닉네임과 이메일은 필수입니다.'); return; }
    setSaving(true); setError('');
    // 이미 신청했는지 확인
    const { data: existing } = await supabase.from('participants').select('id').eq('nickname', form.nickname).single();
    if (existing) { setError('이미 동일한 닉네임으로 신청이 접수되어 있습니다.'); setSaving(false); return; }

    const totalSeed = (+form.seed_tqqq || 0) + (+form.seed_qld || 0) + (+form.seed_soxl || 0);
    const { error: err } = await supabase.from('participants').insert([{
      nickname: form.nickname,
      email: form.email,
      seed_usd: totalSeed,
      seed_tqqq: +form.seed_tqqq || 0,
      seed_qld: +form.seed_qld || 0,
      seed_soxl: +form.seed_soxl || 0,
      intro: form.intro,
      referral: form.referral,
      status: 'pending', // 승인 대기
    }]);
    if (err) { setError('저장 실패: ' + err.message); setSaving(false); return; }
    setDone(true); setSaving(false);
  }

  // 씨드 기반 매수금 계산
  const calcBuy = (seed, totalTimes, streakTimes, stepPct) => {
    const normalTimes = totalTimes - streakTimes;
    // 연속 하락 시 stepPct씩 증가: 1회 base, 2회 base*(1+step), 3회 base*(1+step*2) ...
    // base * normalTimes + base*(1) + base*(1+step) + ... = seed
    // base * (normalTimes + sum of streak multipliers) = seed
    let streakMultipliers = 0;
    for (let i = 0; i < streakTimes; i++) streakMultipliers += (1 + i * stepPct);
    const base = seed / (normalTimes + streakMultipliers);
    return { base: Math.round(base), normalTimes, streakTimes };
  };

  const tqqqCalc = calcBuy(+form.seed_tqqq||20000, 24, 5, 0.5);
  const qldCalc  = calcBuy(+form.seed_qld||20000,  18, 3, 0.4);
  const soxlCalc = calcBuy(+form.seed_soxl||20000, 30, 6, 0.4);

  if (done) return (
    <div style={{ textAlign:'center', padding:'80px 20px', animation:'fadeUp 0.3s ease' }}>
      <div style={{ fontSize:60, marginBottom:20 }}>🎉</div>
      <h2 style={{ fontSize:24, fontWeight:700, marginBottom:12, color:'#e2e8f0' }}>참가 신청 완료!</h2>
      <div style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:14, padding:'24px', maxWidth:480, margin:'0 auto 28px', textAlign:'left' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#a5b4fc', marginBottom:12 }}>📬 다음 절차</div>
        {[
          '운영자(1st Sigma)가 신청 내용을 검토합니다',
          '블로그 또는 이메일로 승인 여부를 알려드립니다',
          '승인되면 매매 기록 입력 및 커뮤니티 기능이 활성화됩니다',
          '1기는 소수 정예로 운영되어 선착순이 아닌 심사제입니다',
        ].map((s,i) => (
          <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#94a3b8' }}>
            <span style={{ color:'#6366f1', fontWeight:700, flexShrink:0 }}>{i+1}.</span>{s}
          </div>
        ))}
      </div>
      <a href="/" style={{ background:'#6366f1', color:'white', padding:'12px 28px', borderRadius:10, fontWeight:600, fontSize:14 }}>홈으로 돌아가기</a>
    </div>
  );

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>1σ 매수단 · 1기 2026</div>
        <h1 style={{ fontSize:24, fontWeight:700 }}>참가 신청</h1>
        <p style={{ fontSize:13, color:'#64748b', marginTop:5 }}>심사 후 승인 · 1기는 무료 · 소수 정예 운영</p>
      </div>

      {/* 승인제 안내 */}
      <div style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:14, padding:'18px 22px', marginBottom:22 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#a5b4fc', marginBottom:12 }}>🔐 심사제 안내</div>
        <div style={{ fontSize:13, color:'#64748b', lineHeight:1.8 }}>
          1σ 매수단은 <strong style={{ color:'#e2e8f0' }}>신청 후 운영자 승인</strong> 방식으로 운영됩니다.<br/>
          블로그 방문자, 지인 추천 등 소개받은 분들을 우선으로 승인합니다.<br/>
          승인까지 <strong style={{ color:'#e2e8f0' }}>1~3일</strong> 소요될 수 있습니다.
        </div>
      </div>

      {/* 규칙 */}
      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'20px 22px', marginBottom:22 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>📋 1기 참가 규칙</div>
        {[
          ['🎯 전략', 'QLD · TQQQ · SOXL 중 1개 이상 선택, 1σ 매수법 + 연속하락 동적 사이징 적용'],
          ['💰 씨드', '종목별 씨드를 직접 설정 (최소 $1,000 권장)'],
          ['📝 기록', '매수·익절 발생 시 이 사이트에 직접 입력'],
          ['🤝 공유', '하락장에 서로 격려, 매수 타이밍 공유 환영'],
          ['⚠️ 주의', '투자 권유 아님 · 개인 기록 공유 공간'],
        ].map(([l,d]) => (
          <div key={l} style={{ display:'flex', gap:14, marginBottom:10, fontSize:13 }}>
            <span style={{ fontWeight:700, minWidth:60, color:'#475569' }}>{l}</span>
            <span style={{ color:'#64748b', lineHeight:1.6 }}>{d}</span>
          </div>
        ))}
      </div>

      {/* 씨드 & 매수금 계산기 */}
      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'22px', marginBottom:22 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>💰 종목별 씨드 & 매수금 자동 계산</div>
        <div style={{ fontSize:12, color:'#475569', marginBottom:18 }}>씨드를 입력하면 1회 매수금이 자동 계산됩니다</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:18 }}>
          {[
            { sym:'TQQQ', color:'#6366f1', key:'seed_tqqq', calc:tqqqCalc, times:24, streak:5, step:'50%' },
            { sym:'QLD',  color:'#3b82f6', key:'seed_qld',  calc:qldCalc,  times:18, streak:3, step:'40%' },
            { sym:'SOXL', color:'#f59e0b', key:'seed_soxl', calc:soxlCalc, times:30, streak:6, step:'40%' },
          ].map(({ sym, color, key, calc, times, streak, step }) => (
            <div key={sym} style={{ background:'#0a1628', borderRadius:12, padding:'16px', border:`1px solid ${color}20` }}>
              <div style={{ fontSize:13, fontWeight:700, color, marginBottom:10, fontFamily:'monospace' }}>{sym}</div>
              <label style={{ fontSize:11, color:'#64748b', display:'block', marginBottom:5 }}>씨드 (USD)</label>
              <input type="number" value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} step={1000} min={1000} style={{ marginBottom:12 }} />
              <div style={{ borderTop:'1px solid #1e2d3d', paddingTop:10, display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'#475569' }}>연간 {times}회 매수</span>
                  <span style={{ color:'#64748b' }}>연속 최대 {streak}회</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginTop:4 }}>
                  <span style={{ color:'#94a3b8' }}>기본 매수금</span>
                  <span style={{ fontFamily:'monospace', fontWeight:700, color:'#e2e8f0', fontSize:15 }}>${calc.base.toLocaleString()}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                  <span style={{ color:'#475569' }}>연속 하락 시</span>
                  <span style={{ color, fontWeight:600 }}>+{step}씩 증가</span>
                </div>
                {/* 연속 하락 미리보기 */}
                <div style={{ marginTop:8, display:'flex', gap:4, flexWrap:'wrap' }}>
                  {Array.from({length:streak},(_,i) => {
                    const amt = Math.round(calc.base * (1 + i * parseFloat(step)/100));
                    return (
                      <div key={i} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:`${color}15`, color, fontFamily:'monospace', fontWeight:600 }}>
                        {i+1}회 ${amt.toLocaleString()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 신청 폼 */}
      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'24px' }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:18 }}>✍️ 신청서 작성</div>
        <form onSubmit={submit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:6 }}>닉네임 * <span style={{ color:'#475569', fontWeight:400 }}>(리더보드에 표시)</span></label>
              <input placeholder="예: 시그마헌터" value={form.nickname} onChange={e=>setForm(f=>({...f,nickname:e.target.value}))} maxLength={20} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:6 }}>이메일 * <span style={{ color:'#475569', fontWeight:400 }}>(승인 시 연락)</span></label>
              <input type="email" placeholder="example@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:6 }}>어떻게 알게 되셨나요? <span style={{ color:'#475569', fontWeight:400 }}>(선택)</span></label>
            <input placeholder="예: 네이버 블로그, 지인 추천, 유튜브 등" value={form.referral} onChange={e=>setForm(f=>({...f,referral:e.target.value}))} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:6 }}>한 줄 소개 <span style={{ color:'#475569', fontWeight:400 }}>(선택)</span></label>
            <input placeholder="예: 직장인 3년차, TQQQ 위주로 할 예정입니다" value={form.intro} onChange={e=>setForm(f=>({...f,intro:e.target.value}))} maxLength={100} />
          </div>
          {error && <div style={{ padding:'10px 14px', background:'rgba(248,113,113,0.1)', color:'#f87171', borderRadius:8, fontSize:13, marginBottom:14, border:'1px solid rgba(248,113,113,0.2)' }}>{error}</div>}
          <button type="submit" disabled={saving} style={{ width:'100%', background:'#6366f1', color:'white', border:'none', padding:13, borderRadius:10, fontSize:15, fontWeight:700 }}>
            {saving ? '⟳ 저장 중...' : '🙋 1기 참가 신청하기'}
          </button>
          <p style={{ textAlign:'center', fontSize:12, color:'#475569', marginTop:12 }}>신청 후 운영자 심사 → 승인 시 이메일 안내</p>
        </form>
      </div>
    </div>
  );
}
