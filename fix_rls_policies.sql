-- 스터디 관련 RLS 정책 수정
-- session_comments 테이블 RLS 정책 추가
CREATE POLICY "인증된 사용자만 댓글 조회 가능" ON session_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "인증된 사용자만 댓글 작성 가능" ON session_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "본인 댓글만 수정 가능" ON session_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "본인 댓글만 삭제 가능" ON session_comments FOR DELETE USING (user_id = auth.uid());

-- session_likes 테이블 RLS 정책 추가
CREATE POLICY "인증된 사용자만 좋아요 조회 가능" ON session_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "인증된 사용자만 좋아요 추가 가능" ON session_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "본인 좋아요만 삭제 가능" ON session_likes FOR DELETE USING (user_id = auth.uid());

-- session_files 테이블 RLS 정책 추가
CREATE POLICY "인증된 사용자만 파일 조회 가능" ON session_files FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "인증된 사용자만 파일 업로드 가능" ON session_files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());
CREATE POLICY "본인 파일만 삭제 가능" ON session_files FOR DELETE USING (uploaded_by = auth.uid());

-- session_attendance 정책 수정 (INSERT, UPDATE, DELETE 분리)
DROP POLICY IF EXISTS "인증된 사용자만 참석 상태 변경 가능" ON session_attendance;
CREATE POLICY "인증된 사용자만 참석 추가 가능" ON session_attendance FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "본인 참석 상태만 수정 가능" ON session_attendance FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "본인 참석 상태만 삭제 가능" ON session_attendance FOR DELETE USING (user_id = auth.uid());