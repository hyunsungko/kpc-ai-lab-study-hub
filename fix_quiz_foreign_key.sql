-- 기존 테이블이 있으면 삭제하고 다시 생성
DROP TABLE IF EXISTS study_quizzes CASCADE;

-- 스터디 퀴즈 테이블 생성 (올바른 외래키 관계 설정)
CREATE TABLE study_quizzes (
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
CREATE INDEX idx_study_quizzes_session_id ON study_quizzes(session_id);
CREATE INDEX idx_study_quizzes_created_by ON study_quizzes(created_by);

-- 외래키 제약조건 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='study_quizzes';

SELECT 'Quiz table with proper foreign keys created!' as status;