# 🚀 KPC AI Lab Study Hub 배포 및 운영 가이드

## 📋 목차
1. [배포 환경 설정](#배포-환경-설정)
2. [서버 운영 관리](#서버-운영-관리)
3. [유지보수 가이드](#유지보수-가이드)
4. [모니터링 및 로깅](#모니터링-및-로깅)
5. [문제 해결](#문제-해결)
6. [보안 관리](#보안-관리)

## 🌐 배포 환경 설정

### Vercel 환경 변수 설정

#### 필수 환경 변수
```bash
# Supabase 연결 정보
REACT_APP_SUPABASE_URL=https://dalznnfyyzbuoiwriajd.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# 빌드 설정
CI=false                    # ESLint 경고를 오류로 처리하지 않음
ESLINT_NO_DEV_ERRORS=true  # 개발 중 ESLint 오류 무시
```

#### Vercel 대시보드 설정 방법
1. **Vercel 프로젝트** → **Settings** → **Environment Variables**
2. 각 변수 추가 시 **Production**, **Preview**, **Development** 모두 체크
3. 설정 완료 후 **Redeploy** 실행

### 도메인 설정 (선택사항)

#### 커스텀 도메인 연결
1. **Vercel 프로젝트** → **Settings** → **Domains**
2. 도메인 입력 (예: `kpc-study-hub.com`)
3. DNS 설정 안내에 따라 네임서버 설정

#### SSL 인증서
- Vercel에서 자동으로 Let's Encrypt SSL 인증서 발급
- HTTPS 자동 리디렉션 활성화

## 🖥️ 서버 운영 관리

### 1. Vercel 서버리스 환경

#### 특징
- **서버 관리 불필요**: 인프라 관리 자동화
- **자동 스케일링**: 트래픽에 따른 자동 확장/축소
- **글로벌 CDN**: 전 세계 엣지 서버를 통한 빠른 응답
- **무중단 배포**: 롤링 업데이트 방식

#### 제한사항
- **함수 실행 시간**: 최대 10초 (Hobby 플랜)
- **메모리 사용량**: 최대 1GB
- **파일 크기**: 배포 시 최대 100MB

### 2. Supabase 데이터베이스 관리

#### 연결 관리
```javascript
// 연결 풀 설정 (자동 관리)
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})
```

#### 백업 정책
- **자동 백업**: 매일 00:00 UTC
- **보관 기간**: 7일 (Free 플랜), 30일 (Pro 플랜)
- **수동 백업**: Dashboard → Database → Backups

## 🔧 유지보수 가이드

### 일상 관리 작업

#### 1. 일일 점검 (5분)
```bash
# 서비스 상태 확인
curl -I https://kpc-ai-lab-study-hub-v2.vercel.app

# 응답 코드 200 확인
```

**Vercel 대시보드 확인 항목:**
- [ ] 최근 배포 상태 (성공/실패)
- [ ] Function 실행 에러 여부
- [ ] 응답 시간 평균 (< 2초)

**Supabase 대시보드 확인 항목:**
- [ ] API 요청 에러율 (< 1%)
- [ ] 데이터베이스 연결 상태
- [ ] 스토리지 사용량

#### 2. 주간 점검 (30분)

**성능 메트릭 분석:**
```bash
# 로컬에서 성능 테스트
npm run build
npx serve -s build

# Lighthouse 성능 점수 확인 (Chrome DevTools)
# 목표: Performance > 90, Accessibility > 95
```

**데이터베이스 최적화:**
```sql
-- 느린 쿼리 확인 (Supabase Dashboard → Database → Logs)
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 인덱스 사용률 확인
SELECT schemaname, tablename, attname, n_distinct
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

#### 3. 월간 점검 (2시간)

**의존성 업데이트:**
```bash
# 보안 취약점 확인
npm audit

# 업데이트 가능한 패키지 확인
npm outdated

# 주요 업데이트 적용 (신중하게)
npm update

# 테스트 후 배포
npm run build
git add .
git commit -m "chore: update dependencies for security patches"
git push origin main
```

**데이터베이스 정리:**
```sql
-- 90일 이상 된 로그 데이터 정리
DELETE FROM activity_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 통계 정보 업데이트
ANALYZE;
```

### 코드 품질 관리

#### ESLint 및 Prettier 설정
```json
// .eslintrc.json
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

#### 코드 리뷰 체크리스트
- [ ] 컴포넌트 재사용성 확인
- [ ] 성능 최적화 (React.memo, useMemo)
- [ ] 에러 처리 구현
- [ ] 접근성 (a11y) 준수
- [ ] 보안 취약점 검토

## 📊 모니터링 및 로깅

### 1. Vercel Analytics

#### 설정 방법
1. **Vercel 프로젝트** → **Analytics** 탭
2. **Enable Analytics** 클릭
3. 실시간 데이터 확인

#### 주요 메트릭
- **Page Views**: 페이지별 조회수
- **Unique Visitors**: 순 방문자 수
- **Top Pages**: 인기 페이지
- **Top Referrers**: 유입 경로
- **Devices**: 디바이스별 접속 통계

### 2. Supabase Logs

#### 실시간 로그 모니터링
```sql
-- API 요청 로그
SELECT * FROM auth.audit_log_entries 
ORDER BY created_at DESC 
LIMIT 100;

-- 에러 로그 필터링
SELECT * FROM edge_logs 
WHERE level = 'error' 
AND timestamp > NOW() - INTERVAL '24 hours';
```

#### 알림 설정
- **Supabase Dashboard** → **Settings** → **Notifications**
- 다음 상황에 알림 설정:
  - 데이터베이스 연결 실패
  - API 에러율 5% 초과
  - 스토리지 사용량 80% 초과

### 3. 커스텀 로깅

#### 프론트엔드 에러 추적
```javascript
// src/lib/analytics.js
export const logError = (error, context) => {
  console.error('Error:', error, 'Context:', context);
  
  // 프로덕션에서만 외부 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // Sentry, LogRocket 등 연동
  }
};

// 사용 예시
try {
  await createStudySession(data);
} catch (error) {
  logError(error, { component: 'StudyPage', action: 'createSession' });
}
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 배포 실패
**증상**: Vercel 빌드 에러
```bash
# 로컬에서 재현
npm run build

# 흔한 원인들:
# - ESLint 경고 (CI=false로 해결)
# - 환경 변수 누락
# - 의존성 충돌
```

**해결 방법**:
1. 로컬에서 빌드 테스트
2. 환경 변수 확인
3. Vercel 로그 분석

#### 2. 데이터베이스 연결 실패
**증상**: Supabase 연결 에러
```javascript
// 연결 테스트
import { supabase } from './lib/supabase';

const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Connection:', data ? 'OK' : 'Failed', error);
  } catch (err) {
    console.error('Connection error:', err);
  }
};
```

**해결 방법**:
1. Supabase 서비스 상태 확인
2. API 키 유효성 검증
3. 네트워크 연결 확인

#### 3. 성능 저하
**증상**: 느린 페이지 로딩
```javascript
// 성능 측정
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

**최적화 방법**:
1. 이미지 최적화 (WebP, lazy loading)
2. 코드 분할 (React.lazy)
3. 캐싱 전략 개선

### 긴급 상황 대응

#### 서비스 중단 시
1. **상황 파악** (2분)
   - Vercel 상태 페이지 확인
   - Supabase 상태 페이지 확인
   - 에러 로그 분석

2. **임시 조치** (5분)
   - 이전 안정 버전으로 롤백
   - Vercel Dashboard → Deployments → Previous → Promote

3. **근본 원인 분석** (30분)
   - 로그 분석
   - 코드 변경사항 검토
   - 외부 서비스 의존성 확인

4. **영구 해결책 적용**
   - 버그 수정
   - 테스트 강화
   - 모니터링 개선

## 🔒 보안 관리

### 1. 환경 변수 보안

#### 민감 정보 관리
```bash
# ❌ 절대 Git에 커밋하지 말 것
REACT_APP_SUPABASE_ANON_KEY=your_secret_key

# ✅ .gitignore에 포함
.env
.env.local
.env.production
```

#### 키 순환 정책
- **Supabase API 키**: 6개월마다 재생성
- **서비스 계정 키**: 3개월마다 재생성

### 2. 데이터베이스 보안

#### RLS 정책 정기 검토
```sql
-- 모든 RLS 정책 확인
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- 권한 없는 접근 시도 로그
SELECT * FROM auth.audit_log_entries 
WHERE event_type = 'FAILED_LOGIN' 
AND created_at > NOW() - INTERVAL '24 hours';
```

### 3. 프론트엔드 보안

#### XSS 방지
```javascript
// 사용자 입력 검증
const sanitizeInput = (input) => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[\/\!]*?[^<>]*?>/gi, '');
};

// CSP 헤더 설정 (vercel.json)
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'"
        }
      ]
    }
  ]
}
```

## 📈 성능 최적화

### 1. 프론트엔드 최적화

#### 코드 분할
```javascript
// 페이지별 지연 로딩
const StudyPage = lazy(() => import('./pages/StudyPage'));
const BoardPage = lazy(() => import('./pages/BoardPage'));

// 라우터에서 Suspense 사용
<Suspense fallback={<LoadingSkeleton />}>
  <Routes>
    <Route path="/study" element={<StudyPage />} />
    <Route path="/board" element={<BoardPage />} />
  </Routes>
</Suspense>
```

#### 이미지 최적화
```javascript
// Next.js Image 컴포넌트 패턴 적용
const OptimizedImage = ({ src, alt, ...props }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    style={{ aspectRatio: '16/9' }}
    {...props}
  />
);
```

### 2. 데이터베이스 최적화

#### 인덱스 생성
```sql
-- 자주 조회되는 컬럼에 인덱스 생성
CREATE INDEX idx_study_sessions_date 
ON study_sessions(session_date);

CREATE INDEX idx_board_posts_author 
ON board_posts(author_id);

-- 복합 인덱스
CREATE INDEX idx_comments_post_date 
ON board_comments(post_id, created_at);
```

#### 쿼리 최적화
```javascript
// N+1 문제 해결: 관련 데이터 함께 조회
const getPostsWithAuthors = async () => {
  const { data } = await supabase
    .from('board_posts')
    .select(`
      *,
      profiles:author_id (name, email)
    `)
    .order('created_at', { ascending: false });
  
  return data;
};
```

## 🎯 운영 자동화

### GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test -- --coverage --watchAll=false
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Vercel
        uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 백업 자동화 스크립트

```bash
#!/bin/bash
# backup.sh - 주간 데이터베이스 백업

BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Supabase 백업 (API 활용)
curl -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/$PROJECT_ID/database/backup" \
  > $BACKUP_DIR/backup.json

# 로그 파일 압축
tar -czf $BACKUP_DIR/logs.tar.gz /var/log/app/

echo "Backup completed: $BACKUP_DIR"
```

---

## ✅ 운영 체크리스트 요약

### 매일 (5분)
- [ ] 서비스 응답 상태 확인
- [ ] Vercel 배포 상태 확인
- [ ] 에러 알림 검토

### 매주 (30분)
- [ ] 성능 메트릭 분석
- [ ] 데이터베이스 용량 확인
- [ ] 보안 로그 검토

### 매월 (2시간)
- [ ] 의존성 업데이트
- [ ] 백업 데이터 검증
- [ ] 보안 정책 점검
- [ ] 성능 최적화 적용

### 분기별 (4시간)
- [ ] 전체 시스템 아키텍처 검토
- [ ] 비용 최적화 분석
- [ ] 재해 복구 계획 테스트
- [ ] 팀 교육 및 문서 업데이트

---

**이 가이드를 통해 안정적이고 효율적인 서비스 운영을 실현하세요! 🚀**