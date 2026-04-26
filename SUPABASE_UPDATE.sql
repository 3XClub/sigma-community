-- ======================================
-- 1σ 매수단 커뮤니티 v3 — Supabase SQL
-- Supabase → SQL Editor에서 실행하세요
-- ======================================

-- 1. participants 테이블 업데이트 (기존 있으면 컬럼 추가)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS seed_tqqq NUMERIC DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS seed_qld NUMERIC DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS seed_soxl NUMERIC DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS referral TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 기존 참가자 승인 처리 (이미 있는 분들)
UPDATE participants SET status = 'approved' WHERE status IS NULL;

-- 2. posts 테이블 (자유게시판) - 없으면 새로 생성
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  tag TEXT DEFAULT '일상',
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS 정책
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON participants;
DROP POLICY IF EXISTS "allow_all" ON trades;
DROP POLICY IF EXISTS "allow_all" ON posts;

CREATE POLICY "allow_all" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON posts FOR ALL USING (true) WITH CHECK (true);

-- 완료!
-- 위 SQL을 전부 복사해서 Supabase SQL Editor에 붙여넣고 Run 클릭!
