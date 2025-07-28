-- Function Search Path Mutable 경고 해결
-- update_updated_at_column 함수의 search_path 보안 설정

-- 기존 함수를 삭제하는 대신 CREATE OR REPLACE로 안전하게 수정
-- (트리거들이 의존하고 있으므로 DROP 하지 않음)

-- search_path가 고정된 안전한 함수로 교체
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 함수에 대한 설명 추가
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at column with current timestamp';