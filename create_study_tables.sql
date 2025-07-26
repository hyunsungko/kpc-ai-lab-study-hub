-- 스터디 노트 테이블 생성
CREATE TABLE IF NOT EXISTS study_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    content TEXT,
    updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id)
);

-- 스터디 퀴즈 테이블 생성
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
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_quizzes ENABLE ROW LEVEL SECURITY;

-- study_notes RLS 정책
CREATE POLICY "Users can view all study notes" ON study_notes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert study notes" ON study_notes
    FOR INSERT WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Users can update their own study notes" ON study_notes
    FOR UPDATE USING (auth.uid() = updated_by);

CREATE POLICY "Users can delete their own study notes" ON study_notes
    FOR DELETE USING (auth.uid() = updated_by);

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
CREATE INDEX IF NOT EXISTS idx_study_notes_session_id ON study_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_study_quizzes_session_id ON study_quizzes(session_id);
CREATE INDEX IF NOT EXISTS idx_study_quizzes_created_by ON study_quizzes(created_by);