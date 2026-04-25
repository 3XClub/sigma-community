import Nav from '../components/Nav';

export default function App({ Component, pageProps }) {
  return (
    <>
      <style global jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; font-family: 'Noto Sans KR', sans-serif; color: #1e293b; }
        a { text-decoration: none; color: inherit; }
        input, select, textarea {
          border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 9px 12px; font-size: 14px; background: white;
          color: #1e293b; outline: none; width: 100%;
          font-family: 'Noto Sans KR', sans-serif;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #6366f1; box-shadow: 0 0 0 3px #6366f115;
        }
        button {
          cursor: pointer; border: 1px solid #e2e8f0; background: white;
          border-radius: 8px; padding: 9px 18px; font-size: 13px;
          font-family: 'Noto Sans KR', sans-serif; transition: all 0.15s;
        }
        button:hover { background: #f8fafc; }
        button:disabled { opacity: 0.5; cursor: default; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>
      <Nav />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px 80px' }}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
