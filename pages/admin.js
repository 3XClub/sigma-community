import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PW = 'sigma2026'; // 간단한 비밀번호 보호

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('pending');

  function login(e) {
    e.preventDefault();
    if (pw === ADMIN_PW) { setAuth(true); load(); }
    else setPwErr('비밀번호가 틀렸습니다.');
  }

  async function load() {
    setLoading(true);
    const { data: pen } = await supabase.from('participants').select('*').eq('status','pending').order('joined_at', { ascending: false });
    const { data: app } = await supabase.from('participants').select('*').eq('status','approved').order('joined_at', { ascending: false });
    setPending(pen || []);
    setApproved(app || []);
    setLoading(false);
  }

  async function approve(id, nickname) {
    await supabase.from('participants').update({ status: 'approved' }).eq('id', id);
    setMsg(`✅ ${nickname} 승인 완료!`);
    setTimeout(() => setMsg(''), 3000);
    load();
  }

  async function reject(id, nickname) {
    if (!confirm(`${nickname} 신청을 거절하시겠습니까?`)) return;
    await supabase.from('participants').update({ status: 'rejected' }).eq('id', id);
    setMsg(`❌ ${nickname} 거절 처리됨`);
    setTimeout(() => setMsg(''), 3000);
    load();
  }

  async function revoke(id, nickname) {
    if (!confirm(`${nickname} 승인을 취소하시겠습니까?`)) return;
    await supabase.from('participants').update({ status: 'pending' }).eq('id', id);
    load();
  }

  if (!auth) return (
    <div style={{ maxWidth: 360, margin: '80px auto', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ background: '#0f172a', borderRadius: 16, border: '1px solid #1e2d3d', padding: '36px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>관리자 페이지</h2>
        <p style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>1st Sigma 전용</p>
        <form onSubmit={login}>
          <input type="password" placeholder="관리자 비밀번호" value={pw} onChange={e => setPw(e.target.value)} style={{ marginBottom: 10, textAlign: 'center' }} />
          {pwErr && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>{pwErr}</div>}
          <button type="submit" style={{ width: '100%', background: '#6366f1', color: 'white', border: 'none', padding: '11px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>로그인</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>⚙️ 관리자 대시보드</h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 5 }}>참가 신청 심사 · 승인 관리</p>
        </div>
        <button onClick={load} disabled={loading} style={{ fontSize: 12, color: '#a5b4fc', borderColor: '#6366f1', padding: '7px 16px', background: 'rgba(99,102,241,0.1)' }}>
          {loading ? '⟳' : '⟳ 새로고침'}
        </button>
      </div>

      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, background: msg.startsWith('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: msg.startsWith('✅') ? '#4ade80' : '#f87171', border: `1px solid ${msg.startsWith('✅') ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>{msg}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: '대기 중', value: pending.length, color: '#fbbf24' },
          { label: '승인 완료', value: approved.length, color: '#4ade80' },
          { label: '총 신청', value: pending.length + approved.length, color: '#a5b4fc' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#0f172a', borderRadius: 12, padding: '16px 20px', border: '1px solid #1e2d3d', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['pending','⏳ 대기 중', pending.length], ['approved','✅ 승인 완료', approved.length]].map(([t,l,c]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: tab===t ? 600 : 400, background: tab===t ? 'rgba(99,102,241,0.2)' : '#0f172a', color: tab===t ? '#a5b4fc' : '#64748b', border: `1px solid ${tab===t ? '#6366f1' : '#1e2d3d'}` }}>
            {l} ({c})
          </button>
        ))}
      </div>

      {/* Pending list */}
      {tab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>대기 중인 신청이 없습니다.</div>}
          {pending.map(p => (
            <div key={p.id} style={{ background: '#0f172a', borderRadius: 14, border: '1px solid rgba(251,191,36,0.2)', padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{p.nickname}</div>
                  <div style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>{p.email}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>신청일: {p.joined_at?.slice(0,10)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => approve(p.id, p.nickname)} style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>✅ 승인</button>
                  <button onClick={() => reject(p.id, p.nickname)} style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', padding: '8px 18px', borderRadius: 8, fontSize: 13 }}>❌ 거절</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: p.intro || p.referral ? 12 : 0 }}>
                {[['TQQQ', p.seed_tqqq,'#6366f1'], ['QLD', p.seed_qld,'#3b82f6'], ['SOXL', p.seed_soxl,'#f59e0b']].map(([sym,seed,col]) => (
                  <div key={sym} style={{ background: '#0a1628', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: col, fontWeight: 700, marginBottom: 3 }}>{sym}</div>
                    <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#e2e8f0' }}>${(seed||0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              {p.referral && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>📍 유입경로: <span style={{ color: '#94a3b8' }}>{p.referral}</span></div>}
              {p.intro && <div style={{ fontSize: 12, color: '#64748b' }}>💬 소개: <span style={{ color: '#94a3b8' }}>{p.intro}</span></div>}
            </div>
          ))}
        </div>
      )}

      {/* Approved list */}
      {tab === 'approved' && (
        <div style={{ background: '#0f172a', borderRadius: 14, border: '1px solid #1e2d3d', overflow: 'hidden' }}>
          {approved.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>승인된 참가자가 없습니다.</div>}
          {approved.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < approved.length-1 ? '1px solid #0a1628' : 'none' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nickname}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{p.email} · 씨드 ${p.seed_usd?.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '2px 10px', borderRadius: 20 }}>승인됨</span>
                <button onClick={() => revoke(p.id, p.nickname)} style={{ fontSize: 11, color: '#f87171', background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', padding: '4px 10px', borderRadius: 6 }}>취소</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
