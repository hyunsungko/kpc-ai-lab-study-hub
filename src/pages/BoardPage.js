import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getBoardPosts,
  createBoardPost,
  updateBoardPost,
  deleteBoardPost,
  toggleBoardLike,
  checkBoardUserLike
} from '../lib/boardApi';
import { PageLoadingSkeleton } from '../components/LoadingSkeleton';
import PostDetail from '../components/PostDetail';

const BoardPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPost, setNewPost] = useState({
    title: '',
    content: ''
  });
  const [userLikes, setUserLikes] = useState(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editPost, setEditPost] = useState({
    title: '',
    content: ''
  });

  // 데이터 로드
  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await getBoardPosts(sortBy);
      if (!error) {
        setPosts(data);
        
        // 사용자의 좋아요 상태 확인
        if (user) {
          const likePromises = data.map(post => checkBoardUserLike(post.id, user.id));
          const likeResults = await Promise.all(likePromises);
          const likedPostIds = new Set();
          likeResults.forEach((result, index) => {
            if (result.data) {
              likedPostIds.add(data[index].id);
            }
          });
          setUserLikes(likedPostIds);
        }
      }
    } catch (error) {
      console.error('게시글 로드 오류:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [sortBy, user]);

  // 새 게시글 생성
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const postData = {
        ...newPost,
        author_id: user.id
      };

      const { error } = await createBoardPost(postData);
      if (error) {
        console.error('게시글 생성 실패:', error);
        alert('게시글 작성에 실패했습니다.');
      } else {
        setNewPost({
          title: '',
          content: ''
        });
        setIsCreateModalOpen(false);
        loadPosts();
      }
    } catch (error) {
      console.error('게시글 생성 오류:', error);
      alert('게시글 작성 중 오류가 발생했습니다.');
    }
  };

  // 게시글 수정 모달 열기
  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditPost({
      title: post.title,
      content: post.content
    });
    setIsEditModalOpen(true);
  };

  // 게시글 수정
  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!user || !editingPost) return;

    try {
      const { error } = await updateBoardPost(editingPost.id, editPost, user.id);
      if (error) {
        console.error('게시글 수정 실패:', error);
        alert('게시글 수정에 실패했습니다.');
      } else {
        setEditPost({
          title: '',
          content: ''
        });
        setIsEditModalOpen(false);
        setEditingPost(null);
        loadPosts();
      }
    } catch (error) {
      console.error('게시글 수정 중 오류:', error);
      alert('게시글 수정 중 오류가 발생했습니다.');
    }
  };

  // 게시글 삭제
  const handleDeletePost = async (postId) => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    const { error } = await deleteBoardPost(postId);
    if (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    } else {
      loadPosts();
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async (postId) => {
    if (!user) return;

    const { data, error } = await toggleBoardLike(postId, user.id);
    if (error) {
      console.error('좋아요 토글 실패:', error);
      return;
    }

    // 로컬 상태 업데이트
    const newUserLikes = new Set(userLikes);
    if (data.liked) {
      newUserLikes.add(postId);
    } else {
      newUserLikes.delete(postId);
    }
    setUserLikes(newUserLikes);

    // 게시글 목록에서 좋아요 수 업데이트
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, like_count: post.like_count + (data.liked ? 1 : -1) }
        : post
    ));
  };

  // 게시글 상세보기 (PostDetail 컴포넌트로)
  const handleViewPost = (postId) => {
    setSelectedPostId(postId);
    setShowPostDetail(true);
  };

  // 게시글 목록으로 돌아가기
  const handleBackToList = () => {
    setShowPostDetail(false);
    setSelectedPostId(null);
    loadPosts(); // 목록 새로고침
  };

  // 필터링된 게시글
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // PostDetail 컴포넌트 표시 여부 확인
  if (showPostDetail && selectedPostId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PostDetail 
            postId={selectedPostId} 
            onBack={handleBackToList}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">게시판</h1>
              <p className="mt-2 text-gray-600">자유롭게 소통하고 정보를 공유하세요</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>글쓰기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Sort */}
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
                <option value="pinned">공지 우선</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="게시글 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">
                {filteredPosts.length}개 게시글
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <PageLoadingSkeleton type="list" count={5} />
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">게시글이 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 글을 작성해보세요!</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              글쓰기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const isLiked = userLikes.has(post.id);
              
              return (
                <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {post.is_pinned && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            📌 공지
                          </span>
                        )}
                        <span className="text-sm text-gray-500">{post.author.name}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">조회 {post.view_count}</span>
                      </div>
                      
                      <h3 
                        className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                        onClick={() => handleViewPost(post.id)}
                      >
                        {post.title}
                      </h3>
                      
                      <p 
                        className="text-gray-600 mb-4 line-clamp-2 cursor-pointer hover:text-gray-800"
                        onClick={() => handleViewPost(post.id)}
                      >
                        {post.content}
                      </p>

                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLikeToggle(post.id)}
                          className={`flex items-center space-x-1 text-sm transition-colors ${
                            isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                          }`}
                        >
                          <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{post.like_count}</span>
                        </button>

                        <button
                          onClick={() => handleViewPost(post.id)}
                          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{post.comment_count}</span>
                        </button>
                      </div>
                    </div>

                    {/* Edit and Delete Buttons */}
                    {user && post.author_id === user.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">새 게시글 작성</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="게시글 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="게시글 내용을 입력하세요"
                    required
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
                    게시글 작성
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">게시글 수정</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={editPost.title}
                    onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="게시글 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    value={editPost.content}
                    onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="게시글 내용을 입력하세요"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    수정 완료
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

export default BoardPage;