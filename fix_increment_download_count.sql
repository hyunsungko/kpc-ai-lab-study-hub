-- increment_download_count 함수 search_path 보안 설정 수정
-- Function Search Path Mutable 경고 해결

-- 기존 함수를 안전한 search_path 설정으로 교체
CREATE OR REPLACE FUNCTION increment_download_count(resource_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- resources 테이블의 download_count 컬럼을 1 증가
    UPDATE resources 
    SET download_count = COALESCE(download_count, 0) + 1 
    WHERE id = resource_id;
END;
$$;

-- 함수에 대한 설명 추가
COMMENT ON FUNCTION increment_download_count(UUID) IS 'Safely increment download count for a resource by 1';