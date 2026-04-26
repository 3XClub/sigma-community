import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const TAGS = ['일상','매수인증','익절인증','시장분석','질문','격려','하락장버티기'];
const TAG_COL = { '일상':'#64748b','매수인증':'#6366f1','익절인증':'#4ade80','시장분석':'#fbbf24','질문':'#a5b4fc','격려':'#f472b6','하락장버티기':'#f87171' };

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nickname:'', tag:'일상', content:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending:false });
    setPosts(data || []); setLoading(false);
  }

  async function savePost(e) {
    e.preventDefault();
    if (!form.nickname || !form.content) { setMsg('❌ 닉네임과 내용을 입력해주세요.'); return; }
    setSaving(true);
    const { error } = await supabase.from('posts').insert([{ nickname:form.nickname, tag:form.tag, content:form.content }]);
    if (error) { setMsg('❌ 저장 실패: ' + error.message); }
    else { setMsg('✅ 게시글이 등록됐어요!'); setForm(f=>({...f,content:''})); loadPosts(); }
    setSaving(false); setTimeout(() => setMsg(''), 3000);
  }

  async function likePost(id, likes) {
    await supabase.from('posts').update({ likes:(likes||0)+1 }).eq('id', id);
    loadPosts();
  }

  const filtered = selectedTag === '전체' ? posts : posts.filter(p => p.tag === selectedTag);

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>Community Board</div>
        <h1 style={{ fontSize:24, fontWeight:700 }}>💬 자유게시판</h1>
        <p style={{ fontSize:13, color:'#475569', marginTop:5 }}>하락장은 같이 버티고, 상승장은 같이 즐기는 공간</p>
      </div>

      {/* Write */}
      <div style={{ background:'#0f172a', borderRadius:14, border:'1px solid #1e2d3d', padding:'22px', marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>✍️ 글 남기기</div>
        <form onSubmit={savePost}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>닉네임 *</label>
              <input placeholder="예: 1st Sigma" value={form.nickname} onChange={e=>setForm(f=>({...f,nickname:e.target.value}))} maxLength={20} />
            </div>
            <div>
              <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>태그</label>
              <select value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))}>
                {TAGS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'#64748b', fontWeight:500, display:'block', marginBottom:5 }}>내용 *</label>
            <textarea rows={4} placeholder="자유롭게 써주세요. 매수 인증, 격려, 시장 분석, 잡담 모두 환영!" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} style={{ resize:'vertical' }} />
          </div>
          {msg && <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:12, fontSize:13, background:msg.startsWith('✅')?'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)', color:msg.startsWith('✅')?'#4ade80':'#f87171', border:`1px solid ${msg.startsWith('✅')?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.2)'}` }}>{msg}</div>}
          <button type="submit" disabled={saving} style={{ background:'#6366f1', color:'white', border:'none', padding:'10px 24px', fontWeight:600, fontSize:14, borderRadius:10, cursor:'pointer' }}>
            {saving?'⟳ 저장 중...':'📝 게시하기'}
          </button>
        </form>
      </div>

      {/* Tag filter */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {['전체',...TAGS].map(t=><button key={t} onClick={()=>setSelectedTag(t)} style={{ fontSize:12, padding:'5px 12px', background:selectedTag===t?'rgba(99,102,241,0.2)':'#0f172a', color:selectedTag===t?'#a5b4fc':'#64748b', border:`1px solid ${selectedTag===t?'#6366f1':'#1e2d3d'}`, borderRadius:8 }}>{t}</button>)}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading && <div style={{ textAlign:'center', padding:40, color:'#475569' }}>⟳ 로딩 중...</div>}
        {!loading && filtered.length === 0 && <div style={{ textAlign:'center', padding:'60px 20px', color:'#475569' }}><div style={{ fontSize:36, marginBottom:12, opacity:0.4 }}>💬</div><div style={{ fontSize:14 }}>아직 게시글이 없어요. 첫 글을 남겨주세요!</div></div>}
        {filtered.map((p,i) => (
          <div key={p.id} style={{ background:'#0f172a', borderRadius:12, border:'1px solid #1e2d3d', padding:'18px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#a5b4fc' }}>{p.nickname?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{p.nickname}</div>
                  <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace' }}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</div>
                </div>
              </div>
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:12, fontWeight:600, background:`${TAG_COL[p.tag]||'#64748b'}18`, color:TAG_COL[p.tag]||'#64748b', border:`1px solid ${TAG_COL[p.tag]||'#64748b'}30` }}>{p.tag}</span>
            </div>
            <p style={{ fontSize:14, color:'#94a3b8', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{p.content}</p>
            <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
              <button onClick={()=>likePost(p.id,p.likes)} style={{ fontSize:12, color:'#64748b', padding:'5px 12px', display:'flex', alignItems:'center', gap:4, background:'transparent', border:'1px solid #1e2d3d', borderRadius:8 }}>👍 {p.likes||0}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
