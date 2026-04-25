# 1σ 커뮤니티 플랫폼

## 📦 페이지 구성
| 페이지 | URL | 설명 |
|--------|-----|------|
| 리더보드 | `/` | 참가자 수익률 순위 + 피드 |
| 매매 기록 | `/trades` | 거래 입력 + 전체 목록 |
| 오늘의 1σ | `/sigma` | 실시간 매수가 |
| 월별 리포트 | `/report` | 자동 집계 통계 |
| 참가 신청 | `/join` | 신규 참가자 등록 |

---

## 🗄️ Supabase 설정 (필수!)

### 1단계 — Supabase 프로젝트 생성
1. https://supabase.com 접속 → 가입/로그인
2. `New Project` → 이름, DB 비밀번호 설정
3. 프로젝트 생성 완료까지 1~2분 대기

### 2단계 — 테이블 생성
Supabase 대시보드 → `SQL Editor` → 아래 SQL 붙여넣고 실행:

```sql
-- 참가자 테이블
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL UNIQUE,
  seed_usd NUMERIC NOT NULL DEFAULT 20000,
  intro TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 매매 기록 테이블
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  nickname TEXT,
  symbol TEXT NOT NULL,
  trade_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  price NUMERIC NOT NULL,
  amount_usd NUMERIC NOT NULL,
  streak INTEGER DEFAULT 1,
  pnl NUMERIC,
  pnl_pct NUMERIC,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 누구나 읽기/쓰기 가능 (RLS 비활성화)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON trades FOR ALL USING (true) WITH CHECK (true);
```

### 3단계 — API 키 확인
Supabase → `Settings` → `API` →
- `Project URL` 복사
- `anon public` 키 복사

### 4단계 — Vercel 환경변수 설정
Vercel → 프로젝트 → `Settings` → `Environment Variables`:
```
NEXT_PUBLIC_SUPABASE_URL = (Project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY = (anon public 키)
```

### 5단계 — Deploy!
저장 후 Vercel 재배포하면 완성 🎉

---

## 💰 비용
- Supabase 무료 플랜: 500MB DB, 월 50만건 API 호출 (충분)
- Vercel 무료 플랜: 월 100GB 대역폭 (충분)
- Yahoo Finance: 무료
- **총 비용: $0**

---

## 🔮 2기 유료화 시
- Supabase에 `is_paid` 컬럼 추가
- 토스페이먼츠 or 스트라이프 연동
- 미결제 회원은 리더보드만 열람 가능으로 제한
