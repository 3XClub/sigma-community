import { useState } from 'react';

export default function News() {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6 }}>Coming Soon</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>📰 오늘의 정책·금융 뉴스</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>Claude AI 실시간 수집 · 한국 투자자 맞춤</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', marginTop: 80 }}>
        {/* Coming Soon 카드 */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: 14, border: '1px solid rgba(99,102,241,0.3)', padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📰</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>곧 오픈됩니다!</h2>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, marginBottom: 28 }}>
            블로그 구독자분들의 의견을 반영하여<br/>
            더 좋은 형태로 준비 중입니다.
          </p>

          {/* 뉴스 기능 미리보기 */}
          <div style={{ background: '#0a1628', borderRadius: 12, padding: '20px 24px', marginBottom: 28, border: '1px solid #1e2d3d', textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 600, marginBottom: 14 }}>🔮 예정된 기능</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '⚡ 실시간 금융·정책 뉴스 수집',
                '🏷️ 카테고리별 필터링 (시장/정책/글로벌/부동산)',
                '📌 투자에 영향을 주는 핵심 뉴스 요약',
                '🔔 중요 뉴스 알림 설정',
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#6366f1', fontWeight: 700 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* 의견 수집 CTA */}
          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 600, marginBottom: 8 }}>📧 의견 제시하기</p>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
              블로그나 <span style={{ color: '#6366f1' }}>커뮤니티 게시판</span>에서
              "뉴스 기능은 어떻게 구성했으면 좋을까?"
              의견을 나눠주세요!
            </p>
          </div>

          {/* 현재 사용 가능한 기능 */}
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid #1e2d3d' }}>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>지금 사용 가능한 기능</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[
                { icon: '📡', label: '오늘의 1σ', href: '/sigma' },
                { icon: '📝', label: '매매 기록', href: '/trades' },
                { icon: '💬', label: '커뮤니티', href: '/community' },
                { icon: '🔐', label: '나의 현황', href: '/my' },
              ].map((item, i) => (
                <a key={i} href={item.href} style={{
                  background: '#0a1628', border: '1px solid #1e2d3d', borderRadius: 10,
                  padding: '14px 16px', textDecoration: 'none', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2d3d'}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: '#475569' }}>
        통계로 사고, 함께 버틴다. · 1σ 매수단
      </div>
    </div>
  );
}
