# KPC AI Lab Study Hub 📚

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://kpc-ai-lab-study-hub-v2.vercel.app)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🎯 프로젝트 개요

KPC AI Lab Study Hub는 **React + Supabase + Tailwind CSS** 기반의 종합 스터디 관리 플랫폼입니다. 
스터디 그룹의 모든 활동을 통합 관리할 수 있는 웹 애플리케이션입니다.

### ✨ 주요 기능
- 📅 **스터디 관리**: 세션 일정, 참석 관리, 캘린더 뷰
- 🧠 **학습 도구**: 퀴즈 생성/응시, 스터디 노트 작성
- 💬 **소통 기능**: 댓글, 좋아요, 실시간 피드백
- 📊 **정보 공유**: AI/자격증 정보 큐레이션
- 💰 **장부 관리**: 스터디 관련 비용 추적
- 📁 **자료실**: 파일 공유 및 관리
- 💬 **게시판**: 자유로운 소통 공간

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Deployment    │
│   (React)       │    │   (Supabase)    │    │    (Vercel)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React Router  │◄──►│ • PostgreSQL    │◄──►│ • CDN           │
│ • Tailwind CSS │    │ • Auth System   │    │ • Serverless    │
│ • Context API   │    │ • Row Level     │    │ • Auto Deploy   │
│ • Hooks         │    │   Security      │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 기술 스택

| 계층 | 기술 | 역할 |
|------|------|------|
| **Frontend** | React 19.1.0 | 사용자 인터페이스 |
| **Routing** | React Router Dom 7.6.3 | 페이지 라우팅 |
| **Styling** | Tailwind CSS 3.4.0 | 반응형 UI 디자인 |
| **State Management** | Context API | 전역 상태 관리 |
| **Backend** | Supabase | 데이터베이스 + 인증 |
| **Database** | PostgreSQL | 관계형 데이터베이스 |
| **Authentication** | Supabase Auth | 사용자 인증/인가 |
| **Deployment** | Vercel | 자동 배포 + 호스팅 |

## 📁 프로젝트 구조

```
study-hub/
├── public/                 # 정적 파일
├── src/
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── AuthWrapper.js     # 인증 래퍼
│   │   ├── Login.js           # 로그인 폼
│   │   ├── SignUp.js          # 회원가입 폼
│   │   ├── StudySessionCard.js # 스터디 세션 카드
│   │   ├── PostDetail.js      # 게시글 상세 뷰
│   │   └── LoadingSkeleton.js # 로딩 스켈레톤
│   ├── context/            # React Context
│   │   └── AuthContext.js     # 인증 상태 관리
│   ├── lib/                # API 및 유틸리티
│   │   ├── supabase.js        # Supabase 클라이언트
│   │   ├── studyApi.js        # 스터디 관련 API
│   │   ├── boardApi.js        # 게시판 API
│   │   ├── trendApi.js        # 정보공유 API
│   │   ├── resourceApi.js     # 자료실 API
│   │   └── financialApi.js    # 장부관리 API
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── StudyPage.js       # 스터디 관리
│   │   ├── StudyDetailPage.js # 스터디 상세 (퀴즈/노트)
│   │   ├── TrendPage.js       # 정보공유
│   │   ├── BoardPage.js       # 게시판
│   │   ├── ResourcePage.js    # 자료실
│   │   ├── FinancialPage.js   # 장부관리
│   │   └── EmailConfirmed.js  # 이메일 인증 완료
│   └── styles/             # 스타일 파일
├── .env                    # 환경 변수 (로컬)
├── vercel.json            # Vercel 배포 설정
└── package.json           # 프로젝트 의존성
```

## 🔐 데이터베이스 스키마

### 핵심 테이블 구조

```sql
-- 사용자 프로필
profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  bio TEXT,
  interests TEXT[]
)

-- 스터디 세션
study_sessions (
  id UUID PRIMARY KEY,
  title TEXT,
  presenter TEXT,
  topic TEXT,
  session_date TIMESTAMP,
  location TEXT,
  created_by UUID REFERENCES profiles(id)
)

-- 퀴즈 시스템
study_quizzes (
  id UUID PRIMARY KEY,
  study_session_id UUID REFERENCES study_sessions(id),
  question TEXT,
  options JSONB,
  correct_answer INTEGER,
  explanation TEXT
)

-- 게시판
board_posts (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT,
  author_id UUID REFERENCES profiles(id),
  view_count INTEGER DEFAULT 0
)

-- 정보공유
trend_posts (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT,
  category TEXT,
  url TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES profiles(id)
)
```

## 🔒 보안 및 권한 관리

### Row Level Security (RLS) 정책

```sql
-- 예시: 본인 데이터만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 예시: 게시글 작성자만 수정/삭제 가능
CREATE POLICY "Authors can edit own posts" ON board_posts
  FOR UPDATE USING (auth.uid() = author_id);
```

## 📊 사용자 플로우

### 1. 회원가입 및 로그인
```
사용자 → 회원가입 폼 → 이메일 인증 → 프로필 설정 → 메인 대시보드
```

### 2. 스터디 참여 플로우
```
스터디 목록 조회 → 세션 선택 → 참석/불참 선택 → 댓글 작성 → 퀴즈 참여
```

### 3. 퀴즈 시스템
```
[출제자] 퀴즈 생성 → 정답 설정 → 해설 작성
[응시자] 문제 풀이 → 답안 제출 → 점수 확인 → 해설 보기
```

## 🚀 배포 및 운영 가이드

### 1. 환경 변수 설정

#### Vercel 환경 변수
```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
CI=false
ESLINT_NO_DEV_ERRORS=true
```

#### 로컬 개발 환경 (.env)
```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 배포 프로세스

#### 자동 배포 (GitHub → Vercel)
1. `main` 브랜치에 푸시
2. Vercel이 자동으로 빌드 및 배포
3. 배포 완료 알림 확인

#### 수동 배포
```bash
# 로컬에서 빌드 테스트
npm run build

# 변경사항 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# GitHub에 푸시
git push origin main
```

### 3. 모니터링 및 로그

#### Vercel 대시보드에서 확인
- **Functions**: 서버리스 함수 실행 상태
- **Analytics**: 사용자 접속 통계
- **Speed Insights**: 성능 메트릭
- **Deployments**: 배포 히스토리 및 로그

#### Supabase 대시보드에서 확인
- **Database**: 쿼리 성능 및 사용량
- **Auth**: 사용자 인증 현황
- **API**: API 호출 통계
- **Logs**: 실시간 로그 모니터링

## 🔧 유지보수 가이드

### 일상적인 관리 작업

#### 1. 정기 업데이트 (월 1회)
```bash
# 의존성 업데이트 확인
npm outdated

# 보안 취약점 확인
npm audit

# 업데이트 적용
npm update
```

#### 2. 데이터베이스 관리
- **백업**: Supabase 자동 백업 활성화
- **인덱스 최적화**: 느린 쿼리 모니터링
- **RLS 정책**: 보안 정책 정기 검토

#### 3. 성능 최적화
- **이미지 최적화**: WebP 포맷 사용
- **코드 분할**: React.lazy로 지연 로딩
- **캐싱**: Vercel Edge Caching 활용

### 문제 해결 가이드

#### 빌드 실패 시
1. 로컬에서 `npm run build` 테스트
2. ESLint 경고 확인 및 수정
3. 환경 변수 설정 확인

#### 인증 문제 시
1. Supabase Auth 설정 확인
2. JWT 토큰 만료 확인
3. RLS 정책 검토

#### 성능 저하 시
1. Vercel Analytics 확인
2. Supabase 쿼리 성능 분석
3. 불필요한 API 호출 최적화

## 🌟 주요 페이지 기능

### 📅 스터디 관리 페이지
- **캘린더 뷰**: 월별 스터디 일정 확인
- **세션 카드**: 세션별 상세 정보 및 참석 관리
- **댓글 시스템**: 실시간 소통 및 피드백
- **파일 관리**: 세션별 자료 업로드/다운로드

### 🧠 스터디 상세 페이지
- **노트 시스템**: 개인/공유 노트 작성 및 편집
- **퀴즈 기능**: 
  - 출제자: 문제 생성, 정답 설정, 해설 작성
  - 응시자: 문제 풀이, 실시간 채점, 결과 확인
- **탭 인터페이스**: 개요/노트/퀴즈 구분

### 📊 정보공유 페이지
- **카테고리 필터**: AI 정보, 자격증 정보
- **링크 큐레이션**: YouTube, 웹사이트 썸네일 자동 생성
- **정렬 기능**: 최신순, 인기순
- **태그 시스템**: 관련 키워드 관리

### 💬 게시판 페이지
- **게시글 CRUD**: 작성, 읽기, 수정, 삭제
- **검색 기능**: 제목/내용 통합 검색
- **정렬 옵션**: 최신순, 인기순, 공지 우선
- **조회수 추적**: 자동 조회수 증가

## 🔄 API 구조

### 인증 관련
```javascript
// 회원가입
signUp(email, password, profileData)

// 로그인
signIn(email, password)

// 로그아웃
signOut()

// 현재 사용자 정보
getCurrentUser()
```

### 스터디 관련
```javascript
// 세션 CRUD
getStudySessions()
createStudySession(sessionData)
updateStudySession(sessionId, sessionData)
deleteStudySession(sessionId)

// 참석 관리
updateAttendanceStatus(sessionId, userId, status)

// 댓글 시스템
addSessionComment(sessionId, userId, content)
updateSessionComment(commentId, userId, content)
deleteSessionComment(commentId, userId)
```

### 퀴즈 시스템
```javascript
// 퀴즈 CRUD
createQuiz(sessionId, quizData)
getQuizzes(sessionId)
updateQuiz(quizId, quizData)
deleteQuiz(quizId)

// 노트 시스템
getStudyNotes(sessionId)
saveStudyNotes(sessionId, content)
```

## 🌟 향후 개선 계획

### Phase 1: 기능 확장
- [ ] 실시간 채팅 기능
- [ ] 푸시 알림 시스템
- [ ] 모바일 앱 개발 (React Native)

### Phase 2: 성능 최적화
- [ ] 이미지 CDN 도입
- [ ] 데이터베이스 최적화
- [ ] PWA 지원

### Phase 3: 고급 기능
- [ ] AI 기반 학습 추천
- [ ] 데이터 분석 대시보드
- [ ] 외부 API 연동 (Google Calendar, Slack)

## 🚨 운영 체크리스트

### 일일 점검
- [ ] 서비스 접속 상태 확인
- [ ] 에러 로그 모니터링
- [ ] 사용자 피드백 확인

### 주간 점검
- [ ] 성능 메트릭 분석
- [ ] 데이터베이스 용량 확인
- [ ] 보안 업데이트 적용

### 월간 점검
- [ ] 의존성 업데이트
- [ ] 백업 데이터 검증
- [ ] 사용자 통계 분석

## 📞 지원 및 문의

- **개발자**: KPC AI Lab Team
- **GitHub**: [https://github.com/hyunsungko/kpc-ai-lab-study-hub](https://github.com/hyunsungko/kpc-ai-lab-study-hub)
- **배포 URL**: [https://kpc-ai-lab-study-hub-v2.vercel.app](https://kpc-ai-lab-study-hub-v2.vercel.app)

---

## 🎉 첫 배포 성공을 축하합니다!

첫 번째 웹 애플리케이션 배포를 성공적으로 완료하셨습니다! 
이제 본격적인 개발자의 여정이 시작됩니다.

### 다음 단계 추천
1. **사용자 피드백 수집**: 실제 사용자들의 의견 청취
2. **성능 모니터링**: Vercel Analytics로 사용 패턴 분석
3. **기능 확장**: 사용자 요구사항에 따른 새 기능 개발
4. **보안 강화**: 정기적인 보안 업데이트 및 점검

**Happy Coding! 🚀**

---

*본 프로젝트는 Claude Code와 함께 개발되었습니다.*