import { useRouter } from 'next/router';

const TABS = [
  { href: '/',          label: '🏆 리더보드',    },
  { href: '/trades',    label: '📝 매매 기록',   },
  { href: '/sigma',     label: '📡 오늘의 1σ',   },
  { href: '/report',   label: '📊 월별 리포트',  },
  { href: '/join',      label: '🙋 참가 신청',    },
];

export default function Nav() {
  const router = useRouter();
  return (
    <nav style={{
      background: 'white', borderBottom: '1px solid #e2e8f0',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📈</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>1σ 커뮤니티</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>1기 · 2025</div>
            </div>
          </div>
        </a>
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <a key={t.href} href={t.href} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none',
              fontWeight: router.pathname === t.href ? 600 : 400,
              background: router.pathname === t.href ? '#eff6ff' : 'transparent',
              color: router.pathname === t.href ? '#1d4ed8' : '#64748b',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
