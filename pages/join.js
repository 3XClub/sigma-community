import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Join() {
  const [form, setForm] = useState({ nickname: '', seed_usd: 20000, intro: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!form.nickname) { setError('닉네임을 입력해주세요.'); return; }
    setSaving(true); setError('');
    const { error: err } = await supabase.from('participants').insert([{
      nickname: form.nickname,
      seed_usd: +form.seed_usd,
      intro: form.intro,
    }]);
    if (err) { setError('저장 실패: ' + err.message); setSaving(false); return; }
    setDone(true); setSaving(false);
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>참가 신청 완료!</h2>
      <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
        1시그마 커뮤니티 1기에 오신 것을 환영합니다.<br />
        이제 매매 기록 페이지에서 거래를 입력할 수 있어요.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <a href="/sigma" style={{ background: '#6366f1', color: 'white', padding: '12px 24px', borderRadius: 10, fontWeight: 600 }}>📡 오늘의 매수가 확인</a>
        <a href="/trades" style={{ background: 'white', color: '#1e293b', padding: '12px 24px', borderRadius: 10, fontWeight: 600, border: '1px solid #e2e8f0' }}>📝 매매 기록 입력</a>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6 }}>1σ Community · 1기</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>참가 신청</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>1기는 무료 · 1년간 함께 실전 기록을 남깁니다</p>
      </div>

      {/* Rules */}
      <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 22px', marginBottom: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>📋 1기 참가 규칙</div>
        {[
          ['🎯 전략', 'QLD · TQQQ · SOXL 중 선택하여 1σ 매수법 + 연속하락 동적 사이징 적용'],
          ['💰 씨드', '개인이 자유롭게 설정 (최소 $1,000 권장)'],
          ['📝 기록', '매수·익절 발생 시 이 사이트에 직접 입력 (실시간 아니어도 됨)'],
          ['🤝 공유', '하락장에 서로 격려, 매수 타이밍 공유 환영'],
          ['⚠️ 주의', '이 커뮤니티는 투자 권유가 아닌 개인 기록 공유 공간입니다'],
        ].map(([label, desc]) => (
          <div key={label} style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 13 }}>
            <span style={{ fontWeight: 700, minWidth: 60, color: '#475569' }}>{label}</span>
            <span style={{ color: '#64748b', lineHeight: 1.6 }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>✍️ 신청서 작성</div>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 6 }}>닉네임 * <span style={{ color: '#94a3b8', fontWeight: 400 }}>(리더보드에 표시됨)</span></label>
              <input placeholder="예: 시그마헌터" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} maxLength={20} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 6 }}>씨드 금액 (USD) *</label>
              <input type="number" value={form.seed_usd} onChange={e => setForm(f => ({ ...f, seed_usd: e.target.value }))} step={1000} min={100} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 6 }}>한 줄 소개 <span style={{ color: '#94a3b8', fontWeight: 400 }}>(선택)</span></label>
            <input placeholder="예: 직장인 투자자 3년차, TQQQ 위주로 할 예정입니다" value={form.intro} onChange={e => setForm(f => ({ ...f, intro: e.target.value }))} maxLength={100} />
          </div>

          {error && <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}

          <button type="submit" disabled={saving} style={{ width: '100%', background: '#6366f1', color: 'white', border: 'none', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700 }}>
            {saving ? '⟳ 저장 중...' : '🙋 1기 참가 신청하기'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
            참가 후 운영자 확인을 거쳐 매매 기록 입력이 가능합니다
          </p>
        </form>
      </div>
    </div>
  );
}
