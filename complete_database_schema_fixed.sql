-- =============================================
-- Mars-Q 스터디 플랫폼 - 완전한 데이터베이스 스키마 (수정됨)
-- =============================================

-- 0. 업데이트 함수 먼저 생성
-- ============================================

-- 업데이트 시간 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. 스터디 모임 관리 테이블들
-- ============================================

-- 스터디 모임 세션 (카드뉴스형)
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  presenter VARCHAR(100) NOT NULL, -- 발제자
  topic VARCHAR(200) NOT NULL, -- 발제 주제
  description TEXT, -- 모임 설명
  session_date TIMESTAMP WITH TIME ZONE NOT NULL, -- 모임 일시
  location VARCHAR(200) DEFAULT '온라인',
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, completed, cancelled
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 모임 참석 현황
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- attending, not_attending, pending
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- 모임 파일 업로드
CREATE TABLE IF NOT EXISTS session_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 모임 댓글
CREATE TABLE IF NOT EXISTS session_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 모임 좋아요
CREATE TABLE IF NOT EXISTS session_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- 2. 투표 기능 테이블들
-- ============================================

-- 투표
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  poll_type VARCHAR(50) NOT NULL, -- topic_vote, schedule_vote
  status VARCHAR(20) DEFAULT 'active', -- active, closed
  multiple_choice BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closes_at TIMESTAMP WITH TIME ZONE
);

-- 투표 옵션
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text VARCHAR(200) NOT NULL,
  option_data JSONB, -- 일정 투표의 경우 날짜/시간 정보 저장
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 투표 참여
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id, option_id)
);

-- 3. 장부 관리 테이블들
-- ============================================

-- 결석비 관리
CREATE TABLE IF NOT EXISTS absence_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL DEFAULT 5000, -- 결석비 금액
  status VARCHAR(20) DEFAULT 'unpaid', -- paid, unpaid
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 수입/지출 내역
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL, -- income, expense
  category VARCHAR(100) NOT NULL, -- 결석비, 간식비, 도서구입 등
  amount INTEGER NOT NULL,
  description TEXT,
  receipt_url TEXT, -- 영수증 이미지 URL
  recorded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 자료실 테이블들
-- ============================================

-- 자료 카테고리
CREATE TABLE IF NOT EXISTS resource_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자료 파일
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  category_id UUID REFERENCES resource_categories(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 트렌드 페이지 테이블들
-- ============================================

-- 트렌드 포스트
CREATE TABLE IF NOT EXISTS trend_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- ai_trend, certification_trend
  url TEXT, -- 외부 링크 (유튜브, 웹페이지 등)
  thumbnail_url TEXT,
  tags TEXT[],
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 트렌드 포스트 댓글
CREATE TABLE IF NOT EXISTS trend_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES trend_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 트렌드 포스트 좋아요
CREATE TABLE IF NOT EXISTS trend_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES trend_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 6. 채팅 기능 테이블들
-- ============================================

-- 채팅 메시지
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, file
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 알림 기능 테이블
-- ============================================

-- 알림
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- session_reminder, new_poll, etc
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 인덱스 생성
-- ============================================

-- 스터디 세션 관련
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_user ON session_attendance(user_id);

-- 투표 관련
CREATE INDEX IF NOT EXISTS idx_polls_type ON polls(poll_type);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);

-- 장부 관련
CREATE INDEX IF NOT EXISTS idx_absence_fees_user ON absence_fees(user_id);
CREATE INDEX IF NOT EXISTS idx_absence_fees_status ON absence_fees(status);
CREATE INDEX IF NOT EXISTS idx_financial_records_type ON financial_records(type);

-- 자료실 관련
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

-- 트렌드 관련
CREATE INDEX IF NOT EXISTS idx_trend_posts_category ON trend_posts(category);
CREATE INDEX IF NOT EXISTS idx_trend_posts_created_at ON trend_posts(created_at DESC);

-- 채팅 관련
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- 알림 관련
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 9. RLS 정책 활성화
-- ============================================

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 10. 기본 RLS 정책들 (인증된 사용자만 접근 가능)
-- ============================================

-- 모든 테이블에 대해 인증된 사용자만 조회/생성 가능
CREATE POLICY "인증된 사용자만 조회 가능" ON study_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "인증된 사용자만 생성 가능" ON study_sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
CREATE POLICY "생성자만 수정 가능" ON study_sessions FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "생성자만 삭제 가능" ON study_sessions FOR DELETE USING (created_by = auth.uid());

-- 다른 테이블들도 유사한 정책 적용
CREATE POLICY "인증된 사용자만 조회 가능" ON session_attendance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "인증된 사용자만 참석 상태 변경 가능" ON session_attendance FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "인증된 사용자만 조회 가능" ON polls FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "인증된 사용자만 투표 생성 가능" ON polls FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "인증된 사용자만 조회 가능" ON trend_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "인증된 사용자만 포스트 생성 가능" ON trend_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "인증된 사용자만 조회 가능" ON chat_messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "인증된 사용자만 메시지 전송 가능" ON chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "본인 알림만 조회 가능" ON notifications FOR SELECT USING (user_id = auth.uid());

-- 11. 업데이트 트리거
-- ============================================

CREATE TRIGGER update_study_sessions_updated_at 
  BEFORE UPDATE ON study_sessions 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_session_attendance_updated_at 
  BEFORE UPDATE ON session_attendance 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_trend_posts_updated_at 
  BEFORE UPDATE ON trend_posts 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- 12. 초기 데이터 삽입
-- ============================================

-- 자료 카테고리 초기 데이터
INSERT INTO resource_categories (name, description) VALUES 
('AI 학습자료', 'AI 관련 학습 자료'),
('발표자료', '스터디 발표에 사용된 자료'),
('참고문서', '기타 참고할만한 문서들'),
('도구 및 소프트웨어', '유용한 도구나 소프트웨어 정보')
ON CONFLICT DO NOTHING;

-- 첫 번째 스터디 세션 생성 (2025년 8월 5일)
INSERT INTO study_sessions (
  title, 
  presenter, 
  topic, 
  description, 
  session_date, 
  created_by
) VALUES (
  'Mars-Q 첫 번째 모임',
  '고현성',
  'AI활용과 Agent에 대해서',
  'AI 활용 방법과 AI Agent 개념에 대한 발제 및 실습',
  '2025-08-05 09:30:00+09:00',
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;

-- 7. 게시판 테이블들
-- =============================================

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS board_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false
);

-- 게시글 좋아요 테이블
CREATE TABLE IF NOT EXISTS board_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- 게시글 댓글 테이블
CREATE TABLE IF NOT EXISTS board_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 게시판 테이블 RLS 활성화 및 정책 설정
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments ENABLE ROW LEVEL SECURITY;

-- 게시글 정책
CREATE POLICY "모든 사용자 게시글 조회 가능" ON board_posts FOR SELECT USING (true);
CREATE POLICY "인증된 사용자만 게시글 작성 가능" ON board_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());
CREATE POLICY "작성자만 게시글 수정 가능" ON board_posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "작성자만 게시글 삭제 가능" ON board_posts FOR DELETE USING (author_id = auth.uid());

-- 좋아요 정책
CREATE POLICY "모든 사용자 좋아요 조회 가능" ON board_likes FOR SELECT USING (true);
CREATE POLICY "인증된 사용자만 좋아요 추가 가능" ON board_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "본인 좋아요만 삭제 가능" ON board_likes FOR DELETE USING (user_id = auth.uid());

-- 댓글 정책
CREATE POLICY "모든 사용자 댓글 조회 가능" ON board_comments FOR SELECT USING (true);
CREATE POLICY "인증된 사용자만 댓글 작성 가능" ON board_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "댓글 작성자만 수정 가능" ON board_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "댓글 작성자만 삭제 가능" ON board_comments FOR DELETE USING (user_id = auth.uid());

-- 게시판 테이블 업데이트 트리거
CREATE TRIGGER update_board_posts_updated_at BEFORE UPDATE ON board_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_board_comments_updated_at BEFORE UPDATE ON board_comments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- 완전한 데이터베이스 스키마 생성 완료
-- =============================================