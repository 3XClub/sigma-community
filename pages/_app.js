import Nav from '../components/Nav';
export default function App({ Component, pageProps }) {
  return (
    <>
      <style global jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0f1a; font-family: -apple-system, 'Noto Sans KR', sans-serif; color: #e2e8f0; }
        a { text-decoration: none; color: inherit; }
        input, select, textarea {
          border: 1px solid #1e2d3d; border-radius: 8px; padding: 9px 12px; font-size: 14px;
          background: #0f1c2d; color: #e2e8f0; outline: none; width: 100%;
        }
        input:focus, select:focus, textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        button { cursor: pointer; font-family: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
      <Nav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 80px' }}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
