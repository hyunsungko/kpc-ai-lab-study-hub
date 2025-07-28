-- study_notes 테이블이 이미 존재하고 RLS가 활성화되어 있는지 확인
-- 기존 정책이 있다면 삭제하고 새로 생성

-- 1. 기존 정책들 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view all study notes" ON study_notes;
DROP POLICY IF EXISTS "Users can insert study notes" ON study_notes;
DROP POLICY IF EXISTS "Users can update their own study notes" ON study_notes;
DROP POLICY IF EXISTS "Users can delete their own study notes" ON study_notes;

-- 2. RLS가 비활성화되어 있다면 활성화 (이미 활성화되어 있을 수도 있음)
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;

-- 3. 새로운 RLS 정책 생성 (올바른 컬럼명 updated_by 사용)

-- 모든 사용자가 스터디 노트 조회 가능 (공개적 성격)
CREATE POLICY "모든 사용자 스터디 노트 조회 가능" 
ON study_notes FOR SELECT 
USING (true);

-- 인증된 사용자만 노트 작성 가능 (updated_by 컬럼 사용)
CREATE POLICY "인증된 사용자만 스터디 노트 작성 가능" 
ON study_notes FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND updated_by = auth.uid()
);

-- 본인이 업데이트한 노트만 수정 가능
CREATE POLICY "본인 스터디 노트만 수정 가능" 
ON study_notes FOR UPDATE 
USING (updated_by = auth.uid());

-- 본인이 업데이트한 노트만 삭제 가능
CREATE POLICY "본인 스터디 노트만 삭제 가능" 
ON study_notes FOR DELETE 
USING (updated_by = auth.uid());

-- 4. 정책 확인용 쿼리 (실행하여 확인)
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'study_notes';