import { useRouter } from 'next/router';
import { useState } from 'react';

const TABS = [
  { href:'/',          label:'🏆 리더보드'  },
  { href:'/trades',   label:'📝 매매 기록' },
  { href:'/sigma',    label:'📡 오늘의 1σ' },
  { href:'/news',     label:'📰 뉴스'      },
  { href:'/community',label:'💬 게시판'    },
  { href:'/my',       label:'🔐 나의 현황' },
  { href:'/join',     label:'🙋 참가 신청' },
];

export default function Nav() {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 3) {
      setShowAdmin(!showAdmin);
      setClickCount(0);
    }
    
    setTimeout(() => setClickCount(0), 1000);
  };

  return (
    <nav style={{ background:'#0a0f1a', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'sticky', top:0, zIndex:50 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div onClick={handleLogoClick} style={{ textDecoration:'none', flexShrink:0, cursor:'pointer' }}>
          <div style={{ padding:'10px 0', display:'flex', alignItems:'center', gap:10 }}>
            <img src="/logo.jpg" alt="1σ" style={{ width:36, height:36, borderRadius:8, objectFit:'cover' }} />
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#ffffff', letterSpacing:'0.02em' }}>1σ 매수단</div>
              <div style={{ fontSize:9, color:'#6366f1', letterSpacing:'0.1em', textTransform:'uppercase' }}>Sigma Buyers · 1기 2026</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:1, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {TABS.map(t => (
            <a key={t.href} href={t.href} style={{
              padding:'7px 9px', borderRadius:7, fontSize:11, textDecoration:'none',
              fontWeight: router.pathname === t.href ? 600 : 400,
              background: router.pathname === t.href ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: router.pathname === t.href ? '#a5b4fc' : '#64748b',
              whiteSpace:'nowrap',
            }}>{t.label}</a>
          ))}
          {showAdmin && (
            <a href="/admin" style={{
              padding:'7px 9px', borderRadius:7, fontSize:11, textDecoration:'none',
              fontWeight: router.pathname === '/admin' ? 600 : 400,
              background: router.pathname === '/admin' ? 'rgba(99,102,241,0.2)' : 'rgba(239,68,68,0.15)',
              color: router.pathname === '/admin' ? '#a5b4fc' : '#f87171',
              whiteSpace:'nowrap',
            }}>⚙️ 관리자</a>
          )}
        </div>
      </div>
    </nav>
  );
}
