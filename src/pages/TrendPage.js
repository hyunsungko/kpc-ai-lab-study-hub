import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTrendPosts,
  createTrendPost,
  updateTrendPost,
  deleteTrendPost,
  toggleLike,
  checkUserLike,
  createComment,
  updateComment,
  deleteComment,
  getTrendCategories,
  extractThumbnail
} from '../lib/trendApi';
import { PageLoadingSkeleton } from '../components/LoadingSkeleton';

const TrendPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'ai_info',
    url: '',
    tags: []
  });
  const [userLikes, setUserLikes] = useState(new Set());
  const [commentInputs, setCommentInputs] = useState({});
  const [showAllComments, setShowAllComments] = useState(new Set());
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPost, setEditPost] = useState({
    title: '',
    content: '',
    category: 'ai_info',
    url: '',
    tags: []
  });

  const categories = getTrendCategories();

  // 데이터 로드
  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await getTrendPosts(selectedCategory, sortBy);
      if (!error) {
        setPosts(data);
        
        // 사용자의 좋아요 상태 확인
        if (user) {
          const likePromises = data.map(post => checkUserLike(post.id, user.id));
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
      console.error('포스트 로드 오류:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [selectedCategory, sortBy, user]);

  // 새 포스트 생성
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      // URL에서 썸네일 추출
      let thumbnailUrl = null;
      if (newPost.url) {
        thumbnailUrl = await extractThumbnail(newPost.url);
      }

      const postData = {
        ...newPost,
        thumbnail_url: thumbnailUrl,
        created_by: user.id,
        tags: newPost.tags.filter(tag => tag.trim() !== '')
      };

      const { error } = await createTrendPost(postData);
      if (error) {
        console.error('포스트 생성 실패:', error);
        alert('포스트 생성에 실패했습니다.');
      } else {
        setNewPost({
          title: '',
          content: '',
          category: 'ai_info',
          url: '',
          tags: []
        });
        setIsCreateModalOpen(false);
        loadPosts();
      }
    } catch (error) {
      console.error('포스트 생성 오류:', error);
      alert('포스트 생성 중 오류가 발생했습니다.');
    }
  };

  // 포스트 삭제
  const handleDeletePost = async (postId) => {
    if (!window.confirm('정말로 이 포스트를 삭제하시겠습니까?')) return;

    const { error } = await deleteTrendPost(postId);
    if (error) {
      console.error('포스트 삭제 실패:', error);
      alert('포스트 삭제에 실패했습니다.');
    } else {
      loadPosts();
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async (postId) => {
    if (!user) return;

    const { data, error } = await toggleLike(postId, user.id);
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

    // 포스트 목록에서 좋아요 수 업데이트
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, like_count: post.like_count + (data.liked ? 1 : -1) }
        : post
    ));
  };

  // 댓글 추가
  const handleAddComment = async (postId) => {
    if (!user || !commentInputs[postId]?.trim()) return;

    const { error } = await createComment({
      post_id: postId,
      user_id: user.id,
      content: commentInputs[postId].trim()
    });

    if (error) {
      console.error('댓글 생성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } else {
      setCommentInputs({ ...commentInputs, [postId]: '' });
      loadPosts(); // 새로고침하여 댓글 수 업데이트
    }
  };

  // 댓글 수정 시작
  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.content);
  };

  // 댓글 수정 취소
  const handleCancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  // 댓글 수정 완료
  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;

    const { error } = await updateComment(commentId, user.id, editCommentText.trim());
    
    if (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    } else {
      setEditingComment(null);
      setEditCommentText('');
      loadPosts(); // 새로고침
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    const { error } = await deleteComment(commentId, user.id);
    
    if (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    } else {
      loadPosts(); // 새로고침
    }
  };

  // 댓글 더보기 토글
  const toggleShowAllComments = (postId) => {
    const newShowAllComments = new Set(showAllComments);
    if (newShowAllComments.has(postId)) {
      newShowAllComments.delete(postId);
    } else {
      newShowAllComments.add(postId);
    }
    setShowAllComments(newShowAllComments);
  };

  // 포스트 수정 시작
  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditPost({
      title: post.title,
      content: post.content,
      category: post.category,
      url: post.url || '',
      tags: post.tags || []
    });
    setIsEditModalOpen(true);
  };

  // 포스트 수정 제출
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      // URL에서 썸네일 추출
      let thumbnailUrl = editingPost.thumbnail_url;
      if (editPost.url && editPost.url !== editingPost.url) {
        thumbnailUrl = await extractThumbnail(editPost.url);
      }

      const updateData = {
        ...editPost,
        thumbnail_url: thumbnailUrl,
        tags: editPost.tags.filter(tag => tag.trim() !== '')
      };

      const { error } = await updateTrendPost(editingPost.id, updateData);
      if (error) {
        console.error('포스트 수정 실패:', error);
        alert('포스트 수정에 실패했습니다.');
      } else {
        setIsEditModalOpen(false);
        setEditingPost(null);
        loadPosts();
      }
    } catch (error) {
      console.error('포스트 수정 오류:', error);
      alert('포스트 수정 중 오류가 발생했습니다.');
    }
  };

  // 이미지 클릭시 링크 이동
  const handleImageClick = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 태그 추가/제거
  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!newPost.tags.includes(newTag)) {
        setNewPost({
          ...newPost,
          tags: [...newPost.tags, newTag]
        });
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setNewPost({
      ...newPost,
      tags: newPost.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // 수정용 태그 추가/제거
  const handleEditTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!editPost.tags.includes(newTag)) {
        setEditPost({
          ...editPost,
          tags: [...editPost.tags, newTag]
        });
      }
      e.target.value = '';
    }
  };

  const removeEditTag = (tagToRemove) => {
    setEditPost({
      ...editPost,
      tags: editPost.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // 필터링된 포스트
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">정보공유</h1>
              <p className="mt-2 text-gray-600">AI와 자격증 관련 정보를 공유하고 함께 학습하세요</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>정보 공유</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Category and Sort */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 카테고리</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="포스트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">
                {filteredPosts.length}개 포스트
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <PageLoadingSkeleton type="trends" count={8} />
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">포스트가 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 정보를 공유해보세요!</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              정보 공유하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => {
              const category = categories.find(cat => cat.value === post.category);
              const isLiked = userLikes.has(post.id);
              
              return (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Thumbnail */}
                  <div className="relative">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt="썸네일"
                        className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(post.url)}
                      />
                    ) : (
                      <div 
                        className={`w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ${
                          post.url ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
                        }`}
                        onClick={() => post.url && handleImageClick(post.url)}
                      >
                        <span className="text-4xl">{category?.icon}</span>
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-gray-800">
                        {category?.icon} {category?.label}
                      </span>
                    </div>

                    {/* Edit/Delete Buttons */}
                    {user && post.created_by === user.id && (
                      <div className="absolute top-3 right-3 flex space-x-1">
                        <button
                          onClick={() => handleEditPost(post)}
                          className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white transition-colors"
                          title="수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-white transition-colors"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {post.content}
                    </p>

                    {/* Author and Date */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-medium">
                          {post.author.name?.[0] || '?'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{post.author.name}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{post.tags.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLikeToggle(post.id)}
                          className={`flex items-center space-x-1 text-xs transition-colors ${
                            isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                          }`}
                        >
                          <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{post.like_count}</span>
                        </button>

                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{post.comment_count}</span>
                        </div>
                      </div>

                      {/* URL Link */}
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {/* Comments Display */}
                    {post.trend_comments && post.trend_comments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {(showAllComments.has(post.id) ? post.trend_comments : post.trend_comments.slice(0, 3)).map((comment) => (
                            <div key={comment.id} className="flex space-x-2 group">
                              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-600 text-xs font-medium">
                                  {comment.profiles?.name?.[0] || '?'}
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
                                        onClick={handleCancelEditComment}
                                        className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* 일반 모드 */
                                  <p className="text-xs text-gray-700 break-words">{comment.content}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {post.trend_comments.length > 3 && (
                            <button
                              onClick={() => toggleShowAllComments(post.id)}
                              className="text-xs text-blue-500 hover:text-blue-700 text-center w-full py-1 transition-colors"
                            >
                              {showAllComments.has(post.id)
                                ? '댓글 접기'
                                : `+${post.trend_comments.length - 3}개 댓글 더보기`
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comment Input */}
                    {user && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="댓글..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({
                              ...commentInputs,
                              [post.id]: e.target.value
                            })}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            댓글
                          </button>
                        </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">정보 공유하기</h3>
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
                    placeholder="포스트 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="포스트 내용을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">관련 링크 (선택사항)</label>
                  <input
                    type="url"
                    value={newPost.url}
                    onChange={(e) => setNewPost({ ...newPost, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                  <input
                    type="text"
                    onKeyPress={handleTagInput}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="태그 입력 후 Enter (예: ChatGPT, 정보처리기사)"
                  />
                  {newPost.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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
                    포스트 작성
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">포스트 수정</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={editPost.title}
                    onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="포스트 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={editPost.category}
                    onChange={(e) => setEditPost({ ...editPost, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    value={editPost.content}
                    onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="포스트 내용을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">관련 링크 (선택사항)</label>
                  <input
                    type="url"
                    value={editPost.url}
                    onChange={(e) => setEditPost({ ...editPost, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                  <input
                    type="text"
                    onKeyPress={handleEditTagInput}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="태그 입력 후 Enter (예: ChatGPT, 정보처리기사)"
                  />
                  {editPost.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {editPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeEditTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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

export default TrendPage;