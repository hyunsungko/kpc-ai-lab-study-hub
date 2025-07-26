import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudyNotes, saveStudyNotes, deleteStudyNotes, getStudyQuizzes, createStudyQuiz, updateStudyQuiz, deleteStudyQuiz } from '../lib/studyApi';

const StudyDetailPage = ({ session, onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [studyNotes, setStudyNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [hasExistingNotes, setHasExistingNotes] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });
  const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
  const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({}); // 사용자 답안
  const [showResults, setShowResults] = useState(false); // 결과 표시 여부
  const [quizCompleted, setQuizCompleted] = useState(false); // 퀴즈 완료 여부

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 데이터 로드
  useEffect(() => {
    if (session && user) {
      loadStudyNotes();
      loadQuizzes();
    }
  }, [session, user]);

  // 스터디 노트 로드
  const loadStudyNotes = async () => {
    setNotesLoading(true);
    try {
      const { data, error } = await getStudyNotes(session.id);
      if (!error && data) {
        setStudyNotes(data.content || '');
        setHasExistingNotes(true);
        setIsEditingNotes(false); // 로드 후 읽기 모드로
      } else {
        setStudyNotes('');
        setHasExistingNotes(false);
        setIsEditingNotes(true); // 새 노트면 편집 모드로
      }
    } catch (error) {
      console.error('스터디 노트 로드 실패:', error);
    }
    setNotesLoading(false);
  };

  // 퀴즈 로드
  const loadQuizzes = async () => {
    setQuizzesLoading(true);
    try {
      const { data, error } = await getStudyQuizzes(session.id);
      if (!error) {
        setQuizzes(data || []);
      }
    } catch (error) {
      console.error('퀴즈 로드 실패:', error);
    }
    setQuizzesLoading(false);
  };

  // 스터디 노트 저장
  const handleSaveNotes = async () => {
    if (!user) return;
    
    setNotesSaving(true);
    try {
      const { error } = await saveStudyNotes(session.id, user.id, studyNotes);
      if (error) {
        console.error('스터디 노트 저장 실패:', error);
        alert('스터디 노트 저장에 실패했습니다.');
      } else {
        setHasExistingNotes(true);
        setIsEditingNotes(false); // 저장 후 읽기 모드로 전환
        alert('스터디 노트가 저장되었습니다.');
      }
    } catch (error) {
      console.error('스터디 노트 저장 오류:', error);
      alert('스터디 노트 저장 중 오류가 발생했습니다.');
    }
    setNotesSaving(false);
  };

  // 스터디 노트 삭제
  const handleDeleteNotes = async () => {
    if (!window.confirm('정말로 스터디 노트를 삭제하시겠습니까?')) return;
    
    try {
      const { error } = await deleteStudyNotes(session.id);
      if (error) {
        console.error('스터디 노트 삭제 실패:', error);
        alert('스터디 노트 삭제에 실패했습니다.');
      } else {
        setStudyNotes('');
        setHasExistingNotes(false);
        setIsEditingNotes(true); // 삭제 후 편집 모드로
        alert('스터디 노트가 삭제되었습니다.');
      }
    } catch (error) {
      console.error('스터디 노트 삭제 오류:', error);
      alert('스터디 노트 삭제 중 오류가 발생했습니다.');
    }
  };

  // 편집 모드로 전환
  const handleEditNotes = () => {
    setIsEditingNotes(true);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditingNotes(false);
    loadStudyNotes(); // 원래 내용으로 복원
  };

  // 자동 저장 함수
  const autoSaveNotes = async () => {
    if (!user || !studyNotes.trim()) return;
    
    try {
      await saveStudyNotes(session.id, user.id, studyNotes);
      setHasExistingNotes(true);
      console.log('자동 저장 완료');
    } catch (error) {
      console.error('자동 저장 실패:', error);
    }
  };

  // 노트 변경 시 자동 저장 타이머 설정 (편집 모드에서만)
  const handleNotesChange = (value) => {
    setStudyNotes(value);
    
    // 편집 모드가 아니면 자동 저장 안함
    if (!isEditingNotes) return;
    
    // 기존 타이머 제거
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // 5초 후 자동 저장 (편집 중에만)
    const timer = setTimeout(() => {
      autoSaveNotes();
    }, 5000);
    
    setAutoSaveTimer(timer);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // 퀴즈 생성
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await createStudyQuiz({
        sessionId: session.id,
        question: newQuiz.question,
        options: newQuiz.options,
        correctAnswer: newQuiz.correctAnswer,
        explanation: newQuiz.explanation,
        createdBy: user.id
      });

      if (error) {
        console.error('퀴즈 생성 실패:', error);
        alert('퀴즈 생성에 실패했습니다.');
      } else {
        setNewQuiz({
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        });
        setIsCreateQuizModalOpen(false);
        loadQuizzes(); // 퀴즈 목록 새로고침
        alert('퀴즈가 생성되었습니다.');
      }
    } catch (error) {
      console.error('퀴즈 생성 오류:', error);
      alert('퀴즈 생성 중 오류가 발생했습니다.');
    }
  };

  // 퀴즈 수정 모달 열기
  const handleEditQuiz = (quiz) => {
    setEditingQuiz({
      ...quiz,
      options: [...quiz.options] // 배열 복사
    });
    setIsEditQuizModalOpen(true);
  };

  // 퀴즈 수정
  const handleUpdateQuiz = async (e) => {
    e.preventDefault();
    if (!user || !editingQuiz) return;

    try {
      const { data, error } = await updateStudyQuiz(editingQuiz.id, {
        question: editingQuiz.question,
        options: editingQuiz.options,
        correctAnswer: editingQuiz.correct_answer,
        explanation: editingQuiz.explanation
      });

      if (error) {
        console.error('퀴즈 수정 실패:', error);
        alert('퀴즈 수정에 실패했습니다.');
      } else {
        setIsEditQuizModalOpen(false);
        setEditingQuiz(null);
        loadQuizzes(); // 퀴즈 목록 새로고침
        alert('퀴즈가 수정되었습니다.');
      }
    } catch (error) {
      console.error('퀴즈 수정 중 오류:', error);
      alert('퀴즈 수정 중 오류가 발생했습니다.');
    }
  };

  // 퀴즈 삭제
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('정말로 이 퀴즈를 삭제하시겠습니까?')) return;

    try {
      const { error } = await deleteStudyQuiz(quizId);
      if (error) {
        console.error('퀴즈 삭제 실패:', error);
        alert('퀴즈 삭제에 실패했습니다.');
      } else {
        loadQuizzes(); // 퀴즈 목록 새로고침
        alert('퀴즈가 삭제되었습니다.');
      }
    } catch (error) {
      console.error('퀴즈 삭제 오류:', error);
      alert('퀴즈 삭제 중 오류가 발생했습니다.');
    }
  };

  // 퀴즈 옵션 업데이트
  const updateQuizOption = (index, value) => {
    const newOptions = [...newQuiz.options];
    newOptions[index] = value;
    setNewQuiz({ ...newQuiz, options: newOptions });
  };

  // 사용자 답안 선택
  const handleAnswerSelect = (quizId, answerIndex) => {
    if (showResults) return; // 결과 표시 중에는 답안 변경 불가
    
    setUserAnswers(prev => ({
      ...prev,
      [quizId]: answerIndex
    }));
  };

  // 퀴즈 제출 및 결과 확인
  const handleSubmitQuiz = () => {
    if (Object.keys(userAnswers).length < quizzes.length) {
      alert('모든 문제에 답해주세요.');
      return;
    }
    
    setShowResults(true);
    setQuizCompleted(true);
  };

  // 퀴즈 다시 풀기
  const handleRetakeQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
    setQuizCompleted(false);
  };

  // 점수 계산
  const calculateScore = () => {
    if (quizzes.length === 0) return { correct: 0, total: 0, percentage: 0 };
    
    const correct = quizzes.reduce((count, quiz) => {
      return userAnswers[quiz.id] === quiz.correct_answer ? count + 1 : count;
    }, 0);
    
    const total = quizzes.length;
    const percentage = Math.round((correct / total) * 100);
    
    return { correct, total, percentage };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
                <p className="mt-2 text-gray-600">발제자: {session.presenter} | {formatDate(session.session_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                session.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {session.status === 'upcoming' ? '예정' : 
                 session.status === 'completed' ? '완료' : '취소'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>개요</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>스터디 노트</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'quiz'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>퀴즈</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 기본 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">스터디 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">발제 주제</h4>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{session.topic}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">장소</h4>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{session.location}</p>
                </div>
              </div>
              {session.description && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-2">상세 설명</h4>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg leading-relaxed">{session.description}</p>
                </div>
              )}
            </div>

            {/* 참석자 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">참석 현황</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">✅ 참석자</h4>
                  <div className="space-y-2">
                    {session.session_attendance?.filter(a => a.status === 'attending').map((attendance) => (
                      <div key={attendance.id} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium">
                            {attendance.profiles?.name?.[0] || '?'}
                          </span>
                        </div>
                        <span className="text-gray-900">{attendance.profiles?.name || '익명'}</span>
                      </div>
                    )) || <p className="text-gray-500">참석자가 없습니다.</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">❌ 불참자</h4>
                  <div className="space-y-2">
                    {session.session_attendance?.filter(a => a.status === 'not_attending').map((attendance) => (
                      <div key={attendance.id} className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-medium">
                            {attendance.profiles?.name?.[0] || '?'}
                          </span>
                        </div>
                        <span className="text-gray-900">{attendance.profiles?.name || '익명'}</span>
                      </div>
                    )) || <p className="text-gray-500">불참자가 없습니다.</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* 첨부 파일 */}
            {session.session_files && session.session_files.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">첨부 파일</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {session.session_files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">{file.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {file.profiles?.name} • {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        다운로드
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">스터디 노트</h3>
              <div className="flex space-x-2">
                {isEditingNotes ? (
                  // 편집 모드 버튼들
                  <>
                    {hasExistingNotes && (
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        취소
                      </button>
                    )}
                    <button
                      onClick={handleSaveNotes}
                      disabled={notesSaving}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {notesSaving ? '저장 중...' : '저장'}
                    </button>
                  </>
                ) : (
                  // 읽기 모드 버튼들
                  <>
                    <button
                      onClick={handleDeleteNotes}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      삭제
                    </button>
                    <button
                      onClick={handleEditNotes}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      수정
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {notesLoading ? (
              <div className="w-full h-96 border border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-sm">노트를 불러오는 중...</p>
                </div>
              </div>
            ) : isEditingNotes ? (
              // 편집 모드
              <textarea
                value={studyNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="스터디 내용을 정리해보세요..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              // 읽기 모드
              <div className="w-full h-96 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                {studyNotes ? (
                  <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed font-sans">
                    {studyNotes}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">아직 작성된 노트가 없습니다.</p>
                      <button
                        onClick={handleEditNotes}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        노트 작성하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <p className="mt-2 text-sm text-gray-500">
              {isEditingNotes ? (
                <>
                  스터디 내용, 핵심 포인트, 토론 내용 등을 자유롭게 기록하세요.
                  <span className="ml-2 text-blue-500">• 자동 저장 (5초 후)</span>
                </>
              ) : (
                '스터디 노트를 확인하고 수정할 수 있습니다.'
              )}
            </p>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">퀴즈</h3>
              <button
                onClick={() => setIsCreateQuizModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>퀴즈 생성</span>
              </button>
            </div>

            {quizzesLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">퀴즈를 불러오는 중...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">아직 퀴즈가 없습니다</h4>
                <p className="text-gray-600 mb-4">스터디 내용을 바탕으로 퀴즈를 만들어보세요!</p>
                <button
                  onClick={() => setIsCreateQuizModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  첫 번째 퀴즈 만들기
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 퀴즈 진행 상태 및 제출 버튼 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        퀴즈 진행 상황: {Object.keys(userAnswers).length} / {quizzes.length}
                      </h4>
                      {showResults && (
                        <div className="mt-2">
                          {(() => {
                            const score = calculateScore();
                            let scoreColor = 'text-red-600';
                            let scoreMessage = '다시 도전해보세요!';
                            
                            if (score.percentage >= 80) {
                              scoreColor = 'text-green-600';
                              scoreMessage = '훌륭합니다! 🎉';
                            } else if (score.percentage >= 60) {
                              scoreColor = 'text-blue-600';
                              scoreMessage = '잘했어요! 👍';
                            } else if (score.percentage >= 40) {
                              scoreColor = 'text-yellow-600';
                              scoreMessage = '조금 더 공부해보세요.';
                            }
                            
                            return (
                              <div className={`text-lg font-bold ${scoreColor}`}>
                                점수: {score.correct}/{score.total} ({score.percentage}점) - {scoreMessage}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {showResults ? (
                        <button
                          onClick={handleRetakeQuiz}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          다시 풀기
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(userAnswers).length < quizzes.length}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          제출하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 퀴즈 문제들 */}
                <div className="space-y-4">
                  {quizzes.map((quiz, index) => {
                    const isQuizOwner = user && quiz.created_by === user.id;
                    
                    return (
                      <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                        {/* 출제자용 컨트롤 버튼들 */}
                        {isQuizOwner && (
                          <div className="absolute top-4 right-4 flex space-x-2">
                            <button
                              onClick={() => handleEditQuiz(quiz)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="퀴즈 수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="퀴즈 삭제"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                        
                        <div className={isQuizOwner ? "pr-20" : "pr-8"}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900">
                              Q{index + 1}. {quiz.question}
                            </h4>
                            {isQuizOwner && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                출제자
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-4">
                            작성자: {quiz.profiles?.name || '익명'} • {new Date(quiz.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>

                        {/* 선택지 - 출제자와 응시자 구분 */}
                        {isQuizOwner ? (
                          /* 출제자용 화면 - 정답 표시 */
                          <div className="space-y-2 mb-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">정답 확인</div>
                            {quiz.options.map((option, optIndex) => {
                              const isCorrect = optIndex === quiz.correct_answer;
                              
                              return (
                                <div
                                  key={optIndex}
                                  className={`w-full p-3 rounded-lg border text-left ${
                                    isCorrect 
                                      ? 'bg-green-50 border-green-200 text-green-800' 
                                      : 'bg-gray-50 border-gray-200 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{optIndex + 1}. {option}</span>
                                    {isCorrect && (
                                      <span className="text-green-600 font-medium flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        정답
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {/* 출제자용 해설 표시 */}
                            {quiz.explanation && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                <p className="text-sm text-blue-800">
                                  <strong>해설:</strong> {quiz.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* 응시자용 화면 - 인터랙티브 퀴즈 */
                          <div className="space-y-2 mb-4">
                            {quiz.options.map((option, optIndex) => {
                              const isSelected = userAnswers[quiz.id] === optIndex;
                              const isCorrect = optIndex === quiz.correct_answer;
                              const isWrong = showResults && isSelected && !isCorrect;
                              
                              let buttonStyle = 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100';
                              
                              if (showResults) {
                                if (isCorrect) {
                                  buttonStyle = 'bg-green-50 border-green-200 text-green-800';
                                } else if (isWrong) {
                                  buttonStyle = 'bg-red-50 border-red-200 text-red-800';
                                } else if (isSelected) {
                                  buttonStyle = 'bg-blue-50 border-blue-200 text-blue-800';
                                }
                              } else if (isSelected) {
                                buttonStyle = 'bg-blue-50 border-blue-200 text-blue-800';
                              }
                              
                              return (
                                <button
                                  key={optIndex}
                                  onClick={() => handleAnswerSelect(quiz.id, optIndex)}
                                  disabled={showResults}
                                  className={`w-full p-3 rounded-lg border text-left transition-colors ${buttonStyle} ${
                                    showResults ? 'cursor-default' : 'cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{optIndex + 1}. {option}</span>
                                    <div className="flex space-x-2">
                                      {isSelected && !showResults && (
                                        <span className="text-blue-600 font-medium">선택됨</span>
                                      )}
                                      {showResults && isCorrect && (
                                        <span className="text-green-600 font-medium">✓ 정답</span>
                                      )}
                                      {showResults && isWrong && (
                                        <span className="text-red-600 font-medium">✗ 오답</span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                            
                            {/* 응시자용 해설 (결과 표시 시에만) */}
                            {showResults && quiz.explanation && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                <p className="text-sm text-blue-800">
                                  <strong>해설:</strong> {quiz.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 퀴즈 생성 모달 */}
      {isCreateQuizModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">퀴즈 생성</h3>
                <button
                  onClick={() => setIsCreateQuizModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    질문
                  </label>
                  <textarea
                    value={newQuiz.question}
                    onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="퀴즈 질문을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    선택지 및 정답 설정
                  </label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">📍 정답 선택 방법:</span> 각 선택지 왼쪽의 라디오 버튼(○)을 클릭하여 정답을 선택하세요.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {newQuiz.options.map((option, index) => {
                      const isCorrect = newQuiz.correctAnswer === index;
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${
                            isCorrect 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="correctAnswer"
                              value={index}
                              checked={isCorrect}
                              onChange={(e) => setNewQuiz({ ...newQuiz, correctAnswer: parseInt(e.target.value) })}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <span className={`ml-2 text-sm font-medium w-8 ${
                              isCorrect ? 'text-green-700' : 'text-gray-500'
                            }`}>
                              {index + 1}.
                            </span>
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateQuizOption(index, e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                              isCorrect
                                ? 'border-green-300 focus:ring-green-500 bg-white'
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder={`선택지 ${index + 1}`}
                            required
                          />
                          {isCorrect && (
                            <span className="text-green-600 font-medium text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              정답
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <p className="font-medium">현재 선택된 정답: {newQuiz.correctAnswer + 1}번</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    해설 (선택사항)
                  </label>
                  <textarea
                    value={newQuiz.explanation}
                    onChange={(e) => setNewQuiz({ ...newQuiz, explanation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="정답에 대한 해설을 입력하세요"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateQuizModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    퀴즈 생성
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 퀴즈 수정 모달 */}
      {isEditQuizModalOpen && editingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">퀴즈 수정</h3>
                <button
                  onClick={() => {setIsEditQuizModalOpen(false); setEditingQuiz(null);}}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateQuiz} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    질문
                  </label>
                  <textarea
                    value={editingQuiz.question}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="퀴즈 질문을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    선택지 및 정답 설정
                  </label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">📍 정답 선택 방법:</span> 각 선택지 왼쪽의 라디오 버튼(○)을 클릭하여 정답을 선택하세요.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {editingQuiz.options.map((option, index) => {
                      const isCorrect = editingQuiz.correct_answer === index;
                      
                      return (
                        <div key={index} className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                          isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <input
                            type="radio"
                            name="correct_answer"
                            value={index}
                            checked={editingQuiz.correct_answer === index}
                            onChange={() => setEditingQuiz({ ...editingQuiz, correct_answer: index })}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...editingQuiz.options];
                              newOptions[index] = e.target.value;
                              setEditingQuiz({ ...editingQuiz, options: newOptions });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`선택지 ${index + 1}`}
                            required
                          />
                          {isCorrect && (
                            <span className="text-green-600 font-medium text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              정답
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <p className="font-medium">현재 선택된 정답: {editingQuiz.correct_answer + 1}번</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    해설 (선택사항)
                  </label>
                  <textarea
                    value={editingQuiz.explanation || ''}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, explanation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="정답에 대한 해설을 입력하세요"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {setIsEditQuizModalOpen(false); setEditingQuiz(null);}}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    퀴즈 수정
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

export default StudyDetailPage;