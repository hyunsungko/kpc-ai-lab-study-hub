import React, { useState, useEffect } from 'react';
import StudySessionCard from '../components/StudySessionCard';
import { useAuth } from '../context/AuthContext';
import { getStudySessions, createStudySession } from '../lib/studyApi';
import { checkStudySessions } from '../lib/debugApi';
import { PageLoadingSkeleton } from '../components/LoadingSkeleton';

// 캘린더 뷰 컴포넌트
const CalendarView = ({ sessions, loading, onSessionClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 현재 월의 첫째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 캘린더 시작일 (이전 월의 마지막 주 포함)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  // 캘린더 종료일 (다음 월의 첫 주 포함)
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));
  
  // 캘린더에 표시할 날짜들 생성
  const calendarDays = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  // 특정 날짜의 세션들 가져오기
  const getSessionsForDate = (date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.session_date);
      return sessionDate.toDateString() === date.toDateString();
    });
  };
  
  // 월 변경
  const changeMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };
  
  if (loading) {
    return <PageLoadingSkeleton type="calendar" count={1} />;
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* 캘린더 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              오늘
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div key={day} className={`p-4 text-center text-sm font-medium ${
            index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {day}
          </div>
        ))}
      </div>
      
      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const sessionsForDay = getSessionsForDate(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          
          return (
            <div 
              key={index} 
              className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className={`text-sm mb-2 ${
                isToday 
                  ? 'w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold'
                  : isCurrentMonth 
                    ? isWeekend ? 'text-red-500' : 'text-gray-900'
                    : 'text-gray-400'
              }`}>
                {day.getDate()}
              </div>
              
              {/* 해당 날짜의 세션들 */}
              <div className="space-y-1">
                {sessionsForDay.slice(0, 3).map((session) => (
                  <div 
                    key={session.id}
                    className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
                    title={`${session.title} - ${session.presenter} (${new Date(session.session_date).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})})`}
                    onClick={() => onSessionClick && onSessionClick(session)}
                  >
                    {new Date(session.session_date).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})} {session.title}
                  </div>
                ))}
                {sessionsForDay.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{sessionsForDay.length - 3}개 더
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 캘린더 하단 정보 */}
      <div className="p-4 bg-gray-50 text-sm text-gray-600">
        총 {sessions.length}개의 스터디 모임이 등록되어 있습니다.
      </div>
    </div>
  );
};

const StudyPage = ({ onNavigateToDetail }) => {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
  const [newSession, setNewSession] = useState({
    title: '',
    presenter: '',
    topic: '',
    description: '',
    session_date: '',
    location: '온라인'
  });

  const SESSIONS_PER_PAGE = 9;

  // 스터디 세션 목록 로드
  const loadSessions = async () => {
    setLoading(true);
    
    // 디버깅용 함수 호출 - 인증 상태 확인
    console.log('🔍 디버깅: 현재 사용자 정보:', user);
    await checkStudySessions();
    
    const { data, error } = await getStudySessions();
    if (error) {
      console.error('세션 로드 실패:', error);
    } else {
      console.log('✅ 로드된 세션들:', data);
      setSessions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // 새 세션 생성
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const sessionData = {
      ...newSession,
      created_by: user.id
    };

    const { error } = await createStudySession(sessionData);
    if (error) {
      console.error('세션 생성 실패:', error);
      alert('모임 생성에 실패했습니다.');
    } else {
      setNewSession({
        title: '',
        presenter: '',
        topic: '',
        description: '',
        session_date: '',
        location: '온라인'
      });
      setIsCreateModalOpen(false);
      loadSessions(); // 목록 새로고침
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
  const endIndex = startIndex + SESSIONS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 스터디 카드 클릭 핸들러
  const handleCardClick = (session) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(session);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">스터디 관리</h1>
              <p className="mt-2 text-gray-600">팀원들과 함께 AI 기술을 학습하고 성장해보세요</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>새 모임 만들기</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setViewMode('grid')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'grid'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>카드 뷰</span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>캘린더 뷰</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          // Grid View (기존 카드 뷰)
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">스터디 모임</h3>
              {sessions.length > 0 && (
                <div className="text-sm text-gray-600">
                  총 {sessions.length}개 모임 | {currentPage} / {totalPages} 페이지
                </div>
              )}
            </div>
            
            {loading ? (
              <PageLoadingSkeleton type="studies" count={6} />
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 모임이 없습니다</h3>
                <p className="text-gray-600 mb-4">첫 번째 모임을 만들어보세요!</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  모임 만들기
                </button>
              </div>
            ) : (
              <>
                {/* 3단 그리드 레이아웃 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentSessions.map((session) => (
                    <StudySessionCard
                      key={session.id}
                      session={session}
                      onUpdate={loadSessions}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Calendar View (캘린더 뷰)
          <CalendarView sessions={sessions} loading={loading} onSessionClick={handleCardClick} />
        )}
      </main>

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">새 모임 만들기</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    모임 제목
                  </label>
                  <input
                    type="text"
                    value={newSession.title}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    발제자
                  </label>
                  <input
                    type="text"
                    value={newSession.presenter}
                    onChange={(e) => setNewSession({ ...newSession, presenter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    발제 주제
                  </label>
                  <input
                    type="text"
                    value={newSession.topic}
                    onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    일시
                  </label>
                  <input
                    type="datetime-local"
                    value={newSession.session_date}
                    onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    장소
                  </label>
                  <input
                    type="text"
                    value={newSession.location}
                    onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    생성
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

export default StudyPage; 