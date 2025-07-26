-- 기존 테이블이 있는지 확인하고 없으면 생성
CREATE TABLE IF NOT EXISTS study_quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    explanation TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 활성화
ALTER TABLE study_quizzes ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 삭제하고 새로 생성
DROP POLICY IF EXISTS "Users can view all study quizzes" ON study_quizzes;
DROP POLICY IF EXISTS "Users can insert study quizzes" ON study_quizzes;
DROP POLICY IF EXISTS "Users can update their own study quizzes" ON study_quizzes;
DROP POLICY IF EXISTS "Users can delete their own study quizzes" ON study_quizzes;

-- study_quizzes RLS 정책
CREATE POLICY "Users can view all study quizzes" ON study_quizzes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert study quizzes" ON study_quizzes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own study quizzes" ON study_quizzes
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own study quizzes" ON study_quizzes
    FOR DELETE USING (auth.uid() = created_by);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_study_quizzes_session_id ON study_quizzes(session_id);
CREATE INDEX IF NOT EXISTS idx_study_quizzes_created_by ON study_quizzes(created_by);

-- 샘플 데이터 확인 (있으면 출력, 없으면 생성 안함)
SELECT 'Quiz table ready!' as status;