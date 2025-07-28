import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthWrapper from './components/AuthWrapper';
import StudyPage from './pages/StudyPage';
import StudyDetailPage from './pages/StudyDetailPage';
import PollPage from './pages/PollPage';
import FinancialPage from './pages/FinancialPage';
import ResourcePage from './pages/ResourcePage';
import TrendPage from './pages/TrendPage';
import BoardPage from './pages/BoardPage';
import EmailConfirmed from './pages/EmailConfirmed';
import { getStudySessions } from './lib/studyApi';

// 메인 대시보드 컴포넌트
const Dashboard = () => {
  const { user, profile, signOut, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(() => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/studies/')) return 'study-detail';
    return path.slice(1) || 'dashboard';
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState({
    name: '',
    department: ''
  });
  const [upcomingSession, setUpcomingSession] = useState(null);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileEdit = () => {
    setEditProfile({
      name: profile?.name || '',
      department: profile?.department || ''
    });
    setIsProfileModalOpen(true);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await updateProfile(editProfile);
      if (error) {
        console.error('프로필 업데이트 실패:', error);
        alert(`프로필 업데이트에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        return;
      }
      
      console.log('프로필 업데이트 성공:', data);
      alert('프로필이 성공적으로 업데이트되었습니다!');
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error('프로필 업데이트 예외:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 다음 예정된 스터디 세션 가져오기
  const loadUpcomingSession = async () => {
    try {
      const { data, error } = await getStudySessions();
      if (!error && data && data.length > 0) {
        // 현재 시간 이후의 세션들 중 가장 가까운 것 찾기
        const now = new Date();
        const upcomingSessions = data
          .filter(session => new Date(session.session_date) > now)
          .sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
        
        if (upcomingSessions.length > 0) {
          setUpcomingSession(upcomingSessions[0]);
        }
      }
    } catch (error) {
      console.error('다음 스터디 세션 로드 실패:', error);
    }
  };

  useEffect(() => {
    if (user && currentPage === 'dashboard') {
      loadUpcomingSession();
    }
  }, [user, currentPage]);

  // 페이지 변경 시 URL 업데이트
  const handlePageChange = (page) => {
    setCurrentPage(page);
    navigate(`/${page === 'dashboard' ? '' : page}`);
  };

  // 스터디 상세 페이지로 이동
  const handleNavigateToStudyDetail = (session) => {
    setSelectedSession(session);
    setCurrentPage('study-detail');
    navigate(`/studies/${session.id}`);
  };

  // 스터디 상세 페이지에서 뒤로가기
  const handleBackFromStudyDetail = () => {
    setSelectedSession(null);
    setCurrentPage('studies');
    navigate('/studies');
  };

  // URL 변경 감지
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setCurrentPage('dashboard');
    } else if (path.startsWith('/studies/')) {
      setCurrentPage('study-detail');
    } else {
      const page = path.slice(1);
      if (['studies', 'polls', 'board', 'trends', 'resources', 'financial'].includes(page)) {
        setCurrentPage(page);
      }
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-blue-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="h-8 w-32 bg-blue-500 rounded animate-pulse"></div>
                <div className="ml-3 w-12 h-6 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden md:flex space-x-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-8 w-16 bg-blue-500 rounded-lg animate-pulse"></div>
                ))}
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-20 bg-blue-500 rounded-lg animate-pulse"></div>
                <div className="h-8 w-16 bg-blue-500 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Message Skeleton */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <div className="h-8 w-64 bg-blue-500/30 rounded mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 w-96 bg-blue-500/30 rounded mx-auto mb-6 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="h-6 w-16 bg-white/20 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Cards Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="w-14 h-14 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <div className="h-5 w-16 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded mx-auto"></div>
              </div>
            ))}
          </div>

          {/* Loading Message */}
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">
              KPC AI Lab 스터디 플랫폼 로딩 중...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              잠시만 기다려주세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 
                className="text-2xl font-bold cursor-pointer hover:text-blue-200 transition-colors"
                onClick={() => handlePageChange('dashboard')}
              >
                KPC AI Lab
              </h1>
              <span className="ml-3 px-3 py-1 bg-blue-500 text-xs rounded-full">Beta</span>
            </div>
            <nav className="hidden md:flex space-x-1">
              {[
                { id: 'dashboard', label: '홈' },
                { id: 'studies', label: '스터디' },
                { id: 'polls', label: '투표' },
                { id: 'board', label: '게시판' },
                { id: 'trends', label: '정보공유' },
                { id: 'resources', label: '자료실' },
                { id: 'financial', label: '장부관리' }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === item.id 
                      ? 'text-white bg-blue-500/20 font-semibold' 
                      : 'text-blue-100 hover:text-white hover:bg-blue-500/10'
                  }`}
                >
                  {item.label}
                  {currentPage === item.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-200 rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleProfileEdit}
                className="text-right hover:bg-blue-500/10 px-3 py-2 rounded-lg transition-colors"
                title="프로필 수정"
              >
                <p className="text-sm font-medium">{profile?.name || user?.email}</p>
                <p className="text-xs text-blue-200">{profile?.department || '부서 없음'}</p>
              </button>
              <button
                onClick={handleSignOut}
                className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-sm"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {currentPage === 'dashboard' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in">
          {/* Welcome Message */}
          <div className="gradient-hero rounded-2xl shadow-lg p-8 mb-8 text-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">
                안녕하세요, {profile?.name || '팀원'}님! 👋
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-6">
                KPC AI Lab 스터디 플랫폼에 오신 것을 환영합니다.<br/>
                함께 AI 기술을 학습하고 성장해나가요!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm fade-in">
                  <div className="text-2xl font-bold">AI 학습</div>
                  <div className="text-sm opacity-80">최신 AI 기술 습득</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm fade-in">
                  <div className="text-2xl font-bold">협업</div>
                  <div className="text-sm opacity-80">동료들과 지식 공유</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm fade-in">
                  <div className="text-2xl font-bold">성장</div>
                  <div className="text-sm opacity-80">전문성 향상</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div 
              onClick={() => handlePageChange('studies')}
              className="card card-hover group text-center cursor-pointer"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">스터디</h3>
              <p className="text-gray-600 text-sm">AI 학습 세션 관리</p>
            </div>

            <div 
              onClick={() => handlePageChange('board')}
              className="group text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">게시판</h3>
              <p className="text-gray-600 text-sm">자유로운 소통 공간</p>
            </div>

            <div 
              onClick={() => handlePageChange('polls')}
              className="group text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-200"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">투표</h3>
              <p className="text-gray-600 text-sm">주제 및 일정 투표</p>
            </div>

            <div 
              onClick={() => handlePageChange('trends')}
              className="group text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-indigo-200"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">정보공유</h3>
              <p className="text-gray-600 text-sm">AI/자격 정보 공유</p>
            </div>
          </div>

          {/* Upcoming Session */}
          {upcomingSession && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                다음 예정된 스터디
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{upcomingSession.title}</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span><strong>발제자:</strong> {upcomingSession.presenter}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span><strong>주제:</strong> {upcomingSession.topic}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span><strong>일시:</strong> {new Date(upcomingSession.session_date).toLocaleString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span><strong>장소:</strong> {upcomingSession.location}</span>
                      </div>
                    </div>
                    {upcomingSession.description && (
                      <p className="mt-3 text-sm text-gray-700 bg-white/50 rounded-lg p-3">
                        {upcomingSession.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handlePageChange('studies')}
                    className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    상세보기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                관리 도구
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handlePageChange('resources')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between focus-ring"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>자료실</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button 
                  onClick={() => handlePageChange('financial')}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>장부관리</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                최근 활동
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>✅ 새로운 스터디 세션 등록</span>
                  <span className="text-xs text-gray-400">방금 전</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>💬 게시판에 새 글 작성</span>
                  <span className="text-xs text-gray-400">1시간 전</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>📊 투표 참여 완료</span>
                  <span className="text-xs text-gray-400">2시간 전</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>📁 자료 업로드</span>
                  <span className="text-xs text-gray-400">어제</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {currentPage === 'studies' && (
        <div className="fade-in">
          <StudyPage onNavigateToDetail={handleNavigateToStudyDetail} />
        </div>
      )}

      {currentPage === 'study-detail' && selectedSession && (
        <div className="fade-in">
          <StudyDetailPage 
            session={selectedSession} 
            onBack={handleBackFromStudyDetail} 
          />
        </div>
      )}

      {currentPage === 'polls' && (
        <div className="fade-in">
          <PollPage />
        </div>
      )}

      {currentPage === 'financial' && (
        <div className="fade-in">
          <FinancialPage />
        </div>
      )}

      {currentPage === 'resources' && (
        <div className="fade-in">
          <ResourcePage />
        </div>
      )}

      {currentPage === 'trends' && (
        <div className="fade-in">
          <TrendPage />
        </div>
      )}

      {currentPage === 'board' && (
        <div className="fade-in">
          <BoardPage />
        </div>
      )}

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">프로필 수정</h3>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                  <input
                    type="text"
                    value={editProfile.name}
                    onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">부서</label>
                  <input
                    type="text"
                    value={editProfile.department}
                    onChange={(e) => setEditProfile({ ...editProfile, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="부서를 입력하세요"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>이메일:</strong> {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    * 이메일은 변경할 수 없습니다.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 앱 컨테이너 (라우터 내부)  
const AppContent = () => {
  const { isAuthenticated, loading, status } = useAuth();
  const location = useLocation();
  
  // URL에서 이메일 확인 완료 여부 체크
  const urlParams = new URLSearchParams(location.search);
  const hashParams = new URLSearchParams(location.hash.substring(1));
  const isEmailConfirmed = urlParams.get('type') === 'signup' || 
                           hashParams.get('type') === 'signup' ||
                           urlParams.get('confirmation') === 'success';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-800">KPC AI Lab</p>
            <p className="text-gray-600">인증 중...</p>
            {status && (
              <p className="text-xs text-gray-400">상태: {status}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // 이메일 확인 완료 페이지 표시
  if (isEmailConfirmed) {
    return <EmailConfirmed />;
  }

  return isAuthenticated ? (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/studies" element={<Dashboard />} />
      <Route path="/studies/:sessionId" element={<Dashboard />} />
      <Route path="/polls" element={<Dashboard />} />
      <Route path="/board" element={<Dashboard />} />
      <Route path="/trends" element={<Dashboard />} />
      <Route path="/resources" element={<Dashboard />} />
      <Route path="/financial" element={<Dashboard />} />
    </Routes>
  ) : <AuthWrapper />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
