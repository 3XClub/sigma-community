import { useState } from 'react';

const CATS = [{ id:'all',label:'전체' },{ id:'market',label:'시장' },{ id:'policy',label:'정책' },{ id:'global',label:'글로벌' },{ id:'real_estate',label:'부동산' }];
const COL = { market:{bg:'rgba(74,222,128,0.08)',text:'#4ade80'}, policy:{bg:'rgba(99,102,241,0.08)',text:'#a5b4fc'}, global:{bg:'rgba(251,191,36,0.08)',text:'#fbbf24'}, real_estate:{bg:'rgba(244,114,182,0.08)',text:'#f472b6'} };

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cat, setCat] = useState('all');
  const [updatedAt, setUpdatedAt] = useState('');
  const [expanded, setExpanded] = useState(null);

  async function fetchNews() {
    setLoading(true); setNews([]);
    const today = new Date().toLocaleDateString('ko-KR');
    const prompt = `오늘(${today}) 기준 한국 투자자에게 중요한 금융·경제·정책 뉴스 8개를 웹 검색해서 수집해줘. 반드시 JSON 배열만 반환. 다른 텍스트 없이:\n[{"date":"${today}","category":"policy|market|global|real_estate 중 하나","title":"뉴스 제목 20자 내외","summary":"핵심 1~2문장, 숫자 포함","tags":["키워드1","키워드2","투자시사점"],"urgent":false}]`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:2000, tools:[{ type:'web_search_20250305', name:'web_search' }], messages:[{ role:'user', content:prompt }] }),
      });
      const data = await res.json();
      const text = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
      const match = text.match(/\[[\s\S]*\]/);
      if (match) { setNews(JSON.parse(match[0])); setUpdatedAt(new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})); }
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  const filtered = cat === 'all' ? news : news.filter(n => n.category === cat);

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>Daily News</div>
          <h1 style={{ fontSize:24, fontWeight:700 }}>📰 오늘의 정책·금융 뉴스</h1>
          <p style={{ fontSize:13, color:'#475569', marginTop:5 }}>AI가 실시간으로 수집 · 한국 투자자 맞춤</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {updatedAt && <span style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>업데이트 {updatedAt}</span>}
          <button onClick={fetchNews} disabled={loading} style={{ display:'flex', alignItems:'center', gap:6, color:'#a5b4fc', borderColor:'#6366f1', background:'rgba(99,102,241,0.1)', border:'1px solid #6366f1', borderRadius:8, padding:'7px 14px', fontSize:12 }}>
            <span style={{ display:'inline-block', animation:loading?'spin 1s linear infinite':'none' }}>⟳</span>
            {loading?'수집 중...':'새로고침'}
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {CATS.map(c => <button key={c.id} onClick={()=>setCat(c.id)} style={{ fontSize:12, padding:'5px 12px', background:cat===c.id?'rgba(99,102,241,0.2)':'#0f172a', color:cat===c.id?'#a5b4fc':'#64748b', border:`1px solid ${cat===c.id?'#6366f1':'#1e2d3d'}`, borderRadius:8 }}>{c.label}</button>)}
      </div>

      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', overflow:'hidden' }}>
        {loading && [0,1,2,3,4,5].map(i => <div key={i} style={{ padding:'18px 22px', borderBottom:'1px solid #0a1628', animation:'pulse 1.5s ease-in-out infinite' }}><div style={{ width:60, height:12, background:'#1e2d3d', borderRadius:4, marginBottom:10 }} /><div style={{ width:'60%', height:15, background:'#1e2d3d', borderRadius:4, marginBottom:8 }} /><div style={{ width:'90%', height:12, background:'#0f1c2d', borderRadius:4 }} /></div>)}
        {!loading && news.length === 0 && (
          <div style={{ padding:'72px', textAlign:'center', color:'#475569' }}>
            <div style={{ fontSize:36, marginBottom:14, opacity:0.4 }}>📰</div>
            <div style={{ fontSize:15, color:'#64748b', marginBottom:6 }}>새로고침을 눌러 오늘의 뉴스를 불러오세요</div>
            <div style={{ fontSize:12 }}>Claude AI가 실시간으로 정책·금융 뉴스를 수집합니다</div>
          </div>
        )}
        {!loading && filtered.map((item,i) => {
          const col = COL[item.category]||{bg:'rgba(255,255,255,0.05)',text:'#94a3b8'};
          const isOpen = expanded === i;
          return (
            <div key={i} onClick={()=>setExpanded(isOpen?null:i)} style={{ padding:'18px 22px', borderBottom:i<filtered.length-1?'1px solid #0a1628':'none', cursor:'pointer', background:isOpen?'#0a1628':'transparent', transition:'background 0.2s' }}>
              <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace', paddingTop:2, minWidth:70, flexShrink:0 }}>{item.date}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:col.bg, color:col.text, border:`1px solid ${col.text}22` }}>{CATS.find(c=>c.id===item.category)?.label||item.category}</span>
                    {item.urgent && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'rgba(248,113,113,0.1)', color:'#f87171', animation:'pulse 2s ease-in-out infinite' }}>LIVE</span>}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#e2e8f0', marginBottom:6, lineHeight:1.5 }}>{item.title}</div>
                  <div style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{item.summary}</div>
                  {isOpen && item.tags && <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>{item.tags.map(tag=><span key={tag} style={{ fontSize:11, color:'#475569', background:'#0f1c2d', padding:'2px 8px', borderRadius:12, border:'1px solid #1e2d3d', fontFamily:'monospace' }}>→ {tag}</span>)}</div>}
                </div>
                <div style={{ color:'#475569', fontSize:12, transform:isOpen?'rotate(90deg)':'none', transition:'transform 0.2s', flexShrink:0 }}>→</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
