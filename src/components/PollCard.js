import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { votePoll, cancelVote, getUserVote, deletePoll, closePoll } from '../lib/pollApi';

const PollCard = ({ poll, onUpdate }) => {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showVoters, setShowVoters] = useState(false);
  const [showCreatorMenu, setShowCreatorMenu] = useState(false);

  // 사용자의 투표 상태 확인 함수 (useEffect보다 먼저 선언)
  const checkUserVote = useCallback(async () => {
    if (!user || !poll.id) return;
    const { data } = await getUserVote(poll.id, user.id);
    setUserVote(data);
    setSelectedOption(data);
  }, [user, poll.id]);

  // 사용자의 투표 상태 확인
  useEffect(() => {
    checkUserVote();
  }, [checkUserVote]);

  // 외부 클릭시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreatorMenu && !event.target.closest('.creator-menu')) {
        setShowCreatorMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreatorMenu]);

  // 옵션 선택
  const handleOptionSelect = (optionId) => {
    if (!isPollClosed && !userVote) {
      setSelectedOption(optionId);
    }
  };

  // 투표 확정
  const handleSubmitVote = async () => {
    if (!user || isVoting || !selectedOption || userVote) return;

    setIsVoting(true);
    const { error } = await votePoll(poll.id, selectedOption, user.id);
    
    if (error) {
      console.error('투표 실패:', error);
      alert('투표에 실패했습니다.');
      setIsVoting(false);
    } else {
      setUserVote(selectedOption);
      // 투표 후 잠시 기다린 후 새로고침 (데이터베이스 반영 시간 고려)
      setTimeout(() => {
        onUpdate();
        setIsVoting(false);
      }, 500);
    }
  };

  // 투표 취소
  const handleCancelVote = async () => {
    if (!user || isVoting) return;

    setIsVoting(true);
    const { error } = await cancelVote(poll.id, user.id);
    
    if (error) {
      console.error('투표 취소 실패:', error);
      alert('투표 취소에 실패했습니다.');
      setIsVoting(false);
    } else {
      setUserVote(null);
      setSelectedOption(null);
      // 투표 취소 후 잠시 기다린 후 새로고침
      setTimeout(() => {
        onUpdate();
        setIsVoting(false);
      }, 500);
    }
  };

  // 투표 삭제
  const handleDeletePoll = async () => {
    if (!window.confirm('정말로 이 투표를 삭제하시겠습니까?')) return;

    setShowCreatorMenu(false);
    const { error } = await deletePoll(poll.id);
    if (error) {
      console.error('투표 삭제 실패:', error);
      alert('투표 삭제에 실패했습니다.');
    } else {
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
  };

  // 투표 마감
  const handleClosePoll = async () => {
    if (!window.confirm('이 투표를 마감하시겠습니까?')) return;

    setShowCreatorMenu(false);
    const { error } = await closePoll(poll.id);
    if (error) {
      console.error('투표 마감 실패:', error);
      alert('투표 마감에 실패했습니다.');
    } else {
      onUpdate(); // 상위 컴포넌트에서 데이터 새로고침
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 투표 결과 퍼센트 계산
  const getVotePercentage = (voteCount) => {
    if (poll.total_votes === 0) return 0;
    return Math.round((voteCount / poll.total_votes) * 100);
  };

  // 투표 타입별 아이콘
  const getPollTypeIcon = () => {
    if (poll.poll_type === 'schedule_vote') {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    }
  };

  const isPollClosed = poll.status === 'closed' || (poll.closes_at && new Date(poll.closes_at) < new Date());
  const isCreator = user && poll.created_by === user.id;


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getPollTypeIcon()}
            <div>
              <h3 className="text-lg font-bold text-gray-900">{poll.title}</h3>
              <p className="text-sm text-gray-600">
                {poll.poll_type === 'schedule_vote' ? '일정 투표' : '주제 투표'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPollClosed 
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {isPollClosed ? '마감' : '진행중'}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                총 {poll.total_votes}명 참여
              </p>
            </div>
            {/* 생성자 메뉴 */}
            {isCreator && (
              <div className="relative creator-menu">
                <button 
                  onClick={() => setShowCreatorMenu(!showCreatorMenu)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showCreatorMenu && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
                    {!isPollClosed && (
                      <button
                        onClick={handleClosePoll}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        투표 마감
                      </button>
                    )}
                    <button
                      onClick={handleDeletePoll}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {poll.description && (
          <p className="mt-2 text-sm text-gray-600">{poll.description}</p>
        )}
        
        {poll.closes_at && (
          <p className="mt-2 text-xs text-gray-500">
            마감: {formatDate(poll.closes_at)}
          </p>
        )}
      </div>

      {/* 투표 옵션들 */}
      <div className="p-4 flex-1">
        <div className="space-y-3">
          {poll.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const hasVoted = userVote === option.id;
            const percentage = getVotePercentage(option.vote_count);
            
            return (
              <div key={option.id} className="relative">
                <div
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    hasVoted
                      ? 'border-blue-500 bg-blue-50'
                      : isSelected
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div 
                        onClick={() => {
                          if (!isPollClosed && !isVoting && !userVote) {
                            handleOptionSelect(option.id);
                          }
                        }}
                        className={`flex items-start space-x-2 ${
                          isPollClosed || isVoting || userVote ? 'cursor-not-allowed' : 'cursor-pointer'
                        } p-1 rounded`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                          hasVoted
                            ? 'border-blue-500 bg-blue-500' 
                            : isSelected
                            ? 'border-orange-400 bg-orange-400'
                            : 'border-gray-300'
                        }`}>
                          {(hasVoted || isSelected) && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                          {option.option_text}
                        </span>
                      </div>
                      
                      {/* 일정 투표의 경우 추가 정보 표시 */}
                      {poll.poll_type === 'schedule_vote' && option.option_data && (
                        <p className="text-xs text-gray-500 mt-1 ml-6 break-words">
                          {option.option_data.time && `시간: ${option.option_data.time}`}
                          {option.option_data.location && ` | 장소: ${option.option_data.location}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {option.vote_count}표
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({percentage}%)
                        </span>
                      </div>
                      {/* 투표자 보기 버튼 */}
                      {option.vote_count > 0 && (
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowVoters(showVoters === option.id ? null : option.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer select-none whitespace-nowrap"
                          style={{ userSelect: 'none' }}
                        >
                          투표자 보기 ({option.vote_count}명)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 투표 결과 바 */}
                  {poll.total_votes > 0 && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          hasVoted ? 'bg-blue-500' : 
                          isSelected ? 'bg-orange-400' : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {/* 투표자 목록 */}
                  {showVoters === option.id && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs border border-gray-300">
                      <div className="font-medium text-gray-700 mb-1">투표자 ({option.votes?.length || 0}명):</div>
                      <div className="flex flex-wrap gap-1">
                        {option.votes && option.votes.length > 0 ? (
                          option.votes.map((vote, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white rounded text-gray-600 border"
                            >
                              {vote.profiles?.name || vote.user_id || '익명'}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">투표자 정보를 불러올 수 없습니다.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 투표 버튼 (아직 투표하지 않은 경우) */}
        {!userVote && !isPollClosed && selectedOption && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleSubmitVote}
              disabled={isVoting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {isVoting ? '투표 중...' : '투표하기'}
            </button>
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            생성자: {poll.created_by_profile?.name || '익명'}
            {userVote && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                투표 완료
              </span>
            )}
          </div>
          
          {!isPollClosed && userVote && (
            <button
              onClick={handleCancelVote}
              disabled={isVoting}
              className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              투표 취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollCard;