import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateAttendanceStatus, addSessionComment, updateSessionComment, deleteSessionComment, toggleSessionLike, updateStudySession, deleteStudySession } from '../lib/studyApi';

const StudySessionCard = ({ session, onUpdate, onCardClick }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editSessionData, setEditSessionData] = useState({
    title: session.title,
    presenter: session.presenter,
    topic: session.topic,
    description: session.description || '',
    session_date: session.session_date ? new Date(session.session_date).toISOString().slice(0, 16) : '',
    location: session.location || '온라인'
  });

  // 현재 사용자의 참석 상태 확인
  const myAttendance = session.session_attendance?.find(a => a.user_id === user?.id);
  const myAttendanceStatus = myAttendance?.status || 'pending';

  // 현재 사용자가 좋아요를 눌렀는지 확인
  const isLiked = session.session_likes?.some(like => like.user_id === user?.id);
  const likeCount = session.session_likes?.length || 0;

  // 참석자 수 계산
  const attendingCount = session.session_attendance?.filter(a => a.status === 'attending').length || 0;
  const notAttendingCount = session.session_attendance?.filter(a => a.status === 'not_attending').length || 0;

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

  // 참석 상태 변경
  const handleAttendanceChange = async (status) => {
    const { error } = await updateAttendanceStatus(session.id, user.id, status);
    if (error) {
      console.error('참석 상태 변경 실패:', error);
      alert('참석 상태 변경에 실패했습니다.');
    } else {
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    const { error } = await addSessionComment(session.id, user.id, newComment.trim());
    
    if (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } else {
      setNewComment('');
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
    setIsSubmittingComment(false);
  };

  // 댓글 수정 시작
  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.content);
  };

  // 댓글 수정 취소
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  // 댓글 수정 완료
  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;

    const { error } = await updateSessionComment(commentId, user.id, editCommentText.trim());
    
    if (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    } else {
      setEditingComment(null);
      setEditCommentText('');
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    const { error } = await deleteSessionComment(commentId, user.id);
    
    if (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    } else {
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async () => {
    setIsTogglingLike(true);
    const { error } = await toggleSessionLike(session.id, user.id);
    
    if (error) {
      console.error('좋아요 토글 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    } else {
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
    setIsTogglingLike(false);
  };

  // 세션 수정
  const handleEditSession = async (e) => {
    e.preventDefault();
    const { error } = await updateStudySession(session.id, editSessionData);
    
    if (error) {
      console.error('세션 수정 실패:', error);
      alert('세션 수정에 실패했습니다.');
    } else {
      setShowEditModal(false);
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
  };

  // 세션 삭제
  const handleDeleteSession = async () => {
    if (!window.confirm('정말로 이 스터디 세션을 삭제하시겠습니까?')) return;
    
    const { error } = await deleteStudySession(session.id);
    
    if (error) {
      console.error('세션 삭제 실패:', error);
      alert('세션 삭제에 실패했습니다.');
    } else {
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
  };

  // 카드 클릭 핸들러
  const handleCardClick = (e) => {
    // 버튼 클릭 시에는 카드 클릭 이벤트 무시
    if (e.target.closest('button') || e.target.closest('form') || e.target.closest('input')) {
      return;
    }
    if (onCardClick) {
      onCardClick(session);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-1 truncate">{session.title}</h3>
            <div className="flex items-center text-blue-100 text-xs">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{formatDate(session.session_date)}</span>
            </div>
            <div className="flex items-center text-blue-100 text-xs mt-1">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{session.location}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              session.status === 'upcoming' ? 'bg-green-100 text-green-800' :
              session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {session.status === 'upcoming' ? '예정' : 
               session.status === 'completed' ? '완료' : '취소'}
            </span>
            {/* 수정/삭제 버튼 (작성자만) */}
            {user && session.created_by === user.id && (
              <div className="flex space-x-1">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="수정"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDeleteSession}
                  className="p-1 hover:bg-red-500/30 rounded transition-colors"
                  title="삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 발제자 정보 */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-bold text-sm">{session.presenter.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">발제자: {session.presenter}</h4>
            <p className="text-blue-600 font-medium text-xs truncate">{session.topic}</p>
          </div>
        </div>
        {session.description && (
          <p className="mt-2 text-gray-600 text-xs leading-relaxed line-clamp-2">{session.description}</p>
        )}
      </div>

      {/* 참석 현황 */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-semibold text-gray-900 text-sm">참석 현황</h5>
          <div className="flex space-x-2 text-xs">
            <button 
              onClick={() => setShowAttendeeModal(true)}
              className="text-green-600 hover:text-green-800 transition-colors cursor-pointer underline"
            >
              참석: {attendingCount}
            </button>
            <button 
              onClick={() => setShowAttendeeModal(true)}
              className="text-red-600 hover:text-red-800 transition-colors cursor-pointer underline"
            >
              불참: {notAttendingCount}
            </button>
          </div>
        </div>

        {/* 참석 버튼 */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleAttendanceChange('attending')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
              myAttendanceStatus === 'attending'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            ✅ 참석
          </button>
          <button
            onClick={() => handleAttendanceChange('not_attending')}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${
              myAttendanceStatus === 'not_attending'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            ❌ 불참
          </button>
        </div>
      </div>

      {/* 파일 목록 */}
      {session.session_files && session.session_files.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <h5 className="font-semibold text-gray-900 mb-3">첨부 파일</h5>
          <div className="space-y-2">
            {session.session_files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {file.profiles?.name} • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  다운로드
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 좋아요 및 댓글 섹션 */}
      <div className="p-4 flex-1 flex flex-col">
        {/* 좋아요 버튼 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleLikeToggle}
            disabled={isTogglingLike}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              isLiked
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>좋아요 {likeCount}</span>
          </button>
        </div>

        {/* 댓글 목록 */}
        {session.session_comments && session.session_comments.length > 0 && (
          <div className="space-y-2 mb-3 flex-1">
            {(showAllComments ? session.session_comments : session.session_comments.slice(0, 2)).map((comment) => (
              <div key={comment.id} className="flex space-x-2 group">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-xs font-medium">
                    {comment.profiles?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {comment.profiles?.name || '익명'}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {/* 수정/삭제 버튼 (본인 댓글만) */}
                    {user && comment.user_id === user.id && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  {editingComment === comment.id ? (
                    /* 수정 모드 */
                    <div className="mt-1 space-y-1">
                      <input
                        type="text"
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateComment(comment.id);
                          }
                        }}
                      />
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleUpdateComment(comment.id)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 일반 모드 */
                    <p className="text-xs text-gray-700 line-clamp-2">{comment.content}</p>
                  )}
                </div>
              </div>
            ))}
            {session.session_comments.length > 2 && (
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-xs text-blue-500 hover:text-blue-700 text-center w-full py-1 transition-colors"
              >
                {showAllComments 
                  ? '댓글 접기' 
                  : `+${session.session_comments.length - 2}개 댓글 더보기`
                }
              </button>
            )}
          </div>
        )}

        {/* 댓글 작성 */}
        <form onSubmit={handleCommentSubmit} className="flex space-x-2 mt-auto">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-xs font-medium">
              {user?.email?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글 입력..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingComment || !newComment.trim()}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSubmittingComment ? '...' : '작성'}
          </button>
        </form>
      </div>

      {/* 참석자 목록 모달 */}
      {showAttendeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">참석자 명단</h3>
                <button
                  onClick={() => setShowAttendeeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 참석자 목록 */}
                <div>
                  <h4 className="text-sm font-semibold text-green-600 mb-2">✅ 참석자 ({attendingCount}명)</h4>
                  <div className="space-y-2">
                    {session.session_attendance?.filter(a => a.status === 'attending').map((attendance) => (
                      <div key={attendance.id} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xs font-medium">
                            {attendance.profiles?.name?.[0] || '?'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">{attendance.profiles?.name || '익명'}</span>
                      </div>
                    ))}
                    {attendingCount === 0 && (
                      <p className="text-sm text-gray-500">아직 참석자가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 불참자 목록 */}
                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-2">❌ 불참자 ({notAttendingCount}명)</h4>
                  <div className="space-y-2">
                    {session.session_attendance?.filter(a => a.status === 'not_attending').map((attendance) => (
                      <div key={attendance.id} className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 text-xs font-medium">
                            {attendance.profiles?.name?.[0] || '?'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">{attendance.profiles?.name || '익명'}</span>
                      </div>
                    ))}
                    {notAttendingCount === 0 && (
                      <p className="text-sm text-gray-500">불참자가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAttendeeModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">스터디 세션 수정</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    모임 제목
                  </label>
                  <input
                    type="text"
                    value={editSessionData.title}
                    onChange={(e) => setEditSessionData({ ...editSessionData, title: e.target.value })}
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
                    value={editSessionData.presenter}
                    onChange={(e) => setEditSessionData({ ...editSessionData, presenter: e.target.value })}
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
                    value={editSessionData.topic}
                    onChange={(e) => setEditSessionData({ ...editSessionData, topic: e.target.value })}
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
                    value={editSessionData.session_date}
                    onChange={(e) => setEditSessionData({ ...editSessionData, session_date: e.target.value })}
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
                    value={editSessionData.location}
                    onChange={(e) => setEditSessionData({ ...editSessionData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={editSessionData.description}
                    onChange={(e) => setEditSessionData({ ...editSessionData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    수정
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

export default StudySessionCard;