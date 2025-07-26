import React, { useState, useEffect } from 'react';
import PollCard from '../components/PollCard';
import { useAuth } from '../context/AuthContext';
import { getPolls, createPoll } from '../lib/pollApi';
import { PageLoadingSkeleton } from '../components/LoadingSkeleton';

const PollPage = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all, active, closed
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    poll_type: 'topic_vote',
    closes_at: '',
    options: ['', '']
  });

  const POLLS_PER_PAGE = 9;

  // 투표 목록 로드
  const loadPolls = async () => {
    setLoading(true);
    const { data, error } = await getPolls();
    if (error) {
      console.error('투표 로드 실패:', error);
    } else {
      setPolls(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPolls();
  }, []);

  // 새 투표 생성
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 빈 옵션 제거
    const filteredOptions = newPoll.options.filter(option => option.trim() !== '');
    if (filteredOptions.length < 2) {
      alert('최소 2개의 옵션이 필요합니다.');
      return;
    }

    const pollData = {
      title: newPoll.title,
      description: newPoll.description,
      poll_type: newPoll.poll_type,
      created_by: user.id,
      closes_at: newPoll.closes_at || null,
      options: filteredOptions.map(text => ({ text }))
    };

    const { error } = await createPoll(pollData);
    if (error) {
      console.error('투표 생성 실패:', error);
      alert('투표 생성에 실패했습니다.');
    } else {
      setNewPoll({
        title: '',
        description: '',
        poll_type: 'topic_vote',
        closes_at: '',
        options: ['', '']
      });
      setIsCreateModalOpen(false);
      loadPolls(); // 목록 새로고침
    }
  };

  // 옵션 추가
  const addOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, '']
    });
  };

  // 옵션 제거
  const removeOption = (index) => {
    if (newPoll.options.length > 2) {
      const newOptions = newPoll.options.filter((_, i) => i !== index);
      setNewPoll({ ...newPoll, options: newOptions });
    }
  };

  // 옵션 값 변경
  const updateOption = (index, value) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  };

  // 필터링된 투표 목록
  const filteredPolls = polls.filter(poll => {
    if (filter === 'active') {
      return poll.status === 'active' && (!poll.closes_at || new Date(poll.closes_at) > new Date());
    } else if (filter === 'closed') {
      return poll.status === 'closed' || (poll.closes_at && new Date(poll.closes_at) <= new Date());
    }
    return true; // all
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredPolls.length / POLLS_PER_PAGE);
  const startIndex = (currentPage - 1) * POLLS_PER_PAGE;
  const currentPolls = filteredPolls.slice(startIndex, startIndex + POLLS_PER_PAGE);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">투표하기</h1>
              <p className="mt-2 text-gray-600">다음 모임 일정과 주제를 투표로 정해보세요</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>새 투표 만들기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 및 통계 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => { setFilter('all'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              전체 ({polls.length})
            </button>
            <button
              onClick={() => { setFilter('active'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              진행중 ({polls.filter(p => p.status === 'active' && (!p.closes_at || new Date(p.closes_at) > new Date())).length})
            </button>
            <button
              onClick={() => { setFilter('closed'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'closed'
                  ? 'bg-gray-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              마감 ({polls.filter(p => p.status === 'closed' || (p.closes_at && new Date(p.closes_at) <= new Date())).length})
            </button>
          </div>

          {filteredPolls.length > 0 && (
            <div className="text-sm text-gray-600">
              {currentPage} / {totalPages} 페이지
            </div>
          )}
        </div>

        {/* 투표 목록 */}
        {loading ? (
          <PageLoadingSkeleton type="polls" count={6} />
        ) : filteredPolls.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? '아직 투표가 없습니다' : 
               filter === 'active' ? '진행중인 투표가 없습니다' : '마감된 투표가 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">첫 번째 투표를 만들어보세요!</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              투표 만들기
            </button>
          </div>
        ) : (
          <>
            {/* 3단 그리드 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onUpdate={loadPolls}
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
      </main>

      {/* Create Poll Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">새 투표 만들기</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreatePoll} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    투표 제목
                  </label>
                  <input
                    type="text"
                    value={newPoll.title}
                    onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    투표 타입
                  </label>
                  <select
                    value={newPoll.poll_type}
                    onChange={(e) => setNewPoll({ ...newPoll, poll_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="topic_vote">주제 투표</option>
                    <option value="schedule_vote">일정 투표</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 (선택사항)
                  </label>
                  <textarea
                    value={newPoll.description}
                    onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    마감일 (선택사항)
                  </label>
                  <input
                    type="datetime-local"
                    value={newPoll.closes_at}
                    onChange={(e) => setNewPoll({ ...newPoll, closes_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    투표 옵션
                  </label>
                  <div className="space-y-2">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`옵션 ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {newPoll.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                    >
                      + 옵션 추가
                    </button>
                  </div>
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

export default PollPage;