import { useState } from 'react';

const CATS = [
  { id:'all', label:'전체' },
  { id:'market', label:'시장' },
  { id:'policy', label:'정책' },
  { id:'global', label:'글로벌' },
  { id:'real_estate', label:'부동산' },
];
const COL = {
  market:      { bg:'rgba(74,222,128,0.08)',  text:'#4ade80' },
  policy:      { bg:'rgba(99,102,241,0.08)',  text:'#a5b4fc' },
  global:      { bg:'rgba(251,191,36,0.08)',  text:'#fbbf24' },
  real_estate: { bg:'rgba(244,114,182,0.08)', text:'#f472b6' },
};

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cat, setCat] = useState('all');
  const [updatedAt, setUpdatedAt] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function fetchNews() {
    setLoading(true); setNews([]); setErrorMsg('');
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNews(data.news || []);
      setUpdatedAt(new Date().toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' }));
    } catch(e) {
      setErrorMsg('뉴스 수집 실패: ' + e.message);
    }
    setLoading(false);
  }

  const filtered = cat === 'all' ? news : news.filter(n => n.category === cat);

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>Daily News</div>
          <h1 style={{ fontSize:24, fontWeight:700 }}>📰 오늘의 정책·금융 뉴스</h1>
          <p style={{ fontSize:13, color:'#475569', marginTop:5 }}>Claude AI 실시간 수집 · 한국 투자자 맞춤</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {updatedAt && <span style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>업데이트 {updatedAt}</span>}
          <button onClick={fetchNews} disabled={loading} style={{ display:'flex', alignItems:'center', gap:6, color:'#a5b4fc', background:'rgba(99,102,241,0.1)', border:'1px solid #6366f1', borderRadius:8, padding:'7px 14px', fontSize:12, cursor:'pointer' }}>
            <span style={{ display:'inline-block', animation:loading?'spin 1s linear infinite':'none' }}>⟳</span>
            {loading ? '수집 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, padding:'12px 16px', color:'#f87171', marginBottom:16, fontSize:13 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {CATS.map(c => (
          <button key={c.id} onClick={()=>setCat(c.id)} style={{ fontSize:12, padding:'5px 12px', background:cat===c.id?'rgba(99,102,241,0.2)':'#0f172a', color:cat===c.id?'#a5b4fc':'#64748b', border:`1px solid ${cat===c.id?'#6366f1':'#1e2d3d'}`, borderRadius:8, cursor:'pointer' }}>
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', overflow:'hidden' }}>
        {/* 스켈레톤 */}
        {loading && [0,1,2,3,4,5].map(i => (
          <div key={i} style={{ padding:'18px 22px', borderBottom:'1px solid #0a1628', animation:'pulse 1.5s ease-in-out infinite' }}>
            <div style={{ width:60, height:12, background:'#1e2d3d', borderRadius:4, marginBottom:10 }} />
            <div style={{ width:'55%', height:15, background:'#1e2d3d', borderRadius:4, marginBottom:8 }} />
            <div style={{ width:'85%', height:12, background:'#0a1628', borderRadius:4 }} />
          </div>
        ))}

        {/* 빈 상태 */}
        {!loading && news.length === 0 && (
          <div style={{ padding:'72px', textAlign:'center', color:'#475569' }}>
            <div style={{ fontSize:40, marginBottom:14, opacity:0.4 }}>📰</div>
            <div style={{ fontSize:15, color:'#64748b', marginBottom:6 }}>새로고침을 눌러 오늘의 뉴스를 불러오세요</div>
            <div style={{ fontSize:12 }}>Claude AI가 정책·금융 뉴스를 실시간으로 수집합니다</div>
            <button onClick={fetchNews} style={{ marginTop:18, background:'#6366f1', color:'white', border:'none', padding:'10px 24px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              지금 불러오기
            </button>
          </div>
        )}

        {/* 뉴스 리스트 */}
        {!loading && filtered.map((item, i) => {
          const col = COL[item.category] || { bg:'rgba(255,255,255,0.05)', text:'#94a3b8' };
          const isOpen = expanded === i;
          return (
            <div key={i} onClick={()=>setExpanded(isOpen?null:i)} style={{ padding:'18px 22px', borderBottom:i<filtered.length-1?'1px solid #0a1628':'none', cursor:'pointer', background:isOpen?'#0a1628':'transparent', transition:'background 0.2s' }}>
              <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace', paddingTop:2, minWidth:70, flexShrink:0 }}>{item.date}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:col.bg, color:col.text, border:`1px solid ${col.text}22` }}>
                      {CATS.find(c=>c.id===item.category)?.label || item.category}
                    </span>
                    {item.urgent && (
                      <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'rgba(248,113,113,0.1)', color:'#f87171', animation:'pulse 2s ease-in-out infinite' }}>LIVE</span>
                    )}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#e2e8f0', marginBottom:6, lineHeight:1.5 }}>{item.title}</div>
                  <div style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{item.summary}</div>
                  {isOpen && item.tags && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
                      {item.tags.map(tag => (
                        <span key={tag} style={{ fontSize:11, color:'#475569', background:'#0f1c2d', padding:'2px 8px', borderRadius:12, border:'1px solid #1e2d3d', fontFamily:'monospace' }}>→ {tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ color:'#475569', fontSize:12, transform:isOpen?'rotate(90deg)':'none', transition:'transform 0.2s', flexShrink:0 }}>→</div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && news.length > 0 && (
        <div style={{ marginTop:10, fontSize:11, color:'#475569', fontFamily:'monospace', display:'flex', justifyContent:'space-between' }}>
          <span>총 {filtered.length}건</span>
          <span>Powered by Claude AI + Web Search</span>
        </div>
      )}
    </div>
  );
}
