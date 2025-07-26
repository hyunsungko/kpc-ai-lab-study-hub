-- 🔧 KPC AI Lab 프로필 테이블 RLS 정책 수정
-- Supabase Dashboard → SQL Editor에서 실행하세요!

-- 1️⃣ 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- 2️⃣ 새로운 정책들 생성
-- 읽기: 모든 사용자가 모든 프로필 조회 가능
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT USING (true);

-- 삽입: 인증된 사용자가 자신의 프로필만 생성 가능
CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 수정: 사용자가 자신의 프로필만 수정 가능  
CREATE POLICY "Enable update for users based on user_id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 삭제: 사용자가 자신의 프로필만 삭제 가능
CREATE POLICY "Enable delete for users based on user_id" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- 3️⃣ 정책 확인
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4️⃣ 완료 메시지
SELECT '✅ Profile RLS policies updated successfully!' as status;