import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getBoardPost,
  createBoardComment,
  deleteBoardComment,
  toggleBoardLike,
  checkBoardUserLike
} from '../lib/boardApi';

const PostDetail = ({ postId, onBack }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { user } = useAuth();

  // 게시글 상세 정보 불러오기
  const fetchPost = async () => {
    try {
      const { data, error } = await getBoardPost(postId);
      if (!error && data) {
        setPost(data);
        
        // 사용자 좋아요 상태 확인
        if (user) {
          const { data: likeData } = await checkBoardUserLike(postId, user.id);
          setIsLiked(!!likeData);
        }
      }
    } catch (error) {
      console.error('게시글 불러오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId, user]);

  // 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const { error } = await createBoardComment({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim()
      });

      if (error) {
        console.error('댓글 작성 실패:', error);
        alert('댓글 작성에 실패했습니다.');
      } else {
        setNewComment('');
        // 게시글 다시 로드해서 댓글 업데이트
        fetchPost();
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await deleteBoardComment(commentId);
      
      if (error) {
        console.error('댓글 삭제 실패:', error);
        alert('댓글 삭제에 실패했습니다.');
      } else {
        // 게시글 다시 로드해서 댓글 업데이트
        fetchPost();
      }
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (!user) return;

    try {
      const { data, error } = await toggleBoardLike(postId, user.id);
      if (!error && data) {
        setIsLiked(data.liked);
        setPost(prev => ({
          ...prev,
          like_count: prev.like_count + (data.liked ? 1 : -1)
        }));
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로 가기 버튼 */}
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </button>
      </div>

      {/* 게시글 내용 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            {post.is_pinned && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                📌 공지
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h1>
          <div className="flex items-center text-sm text-gray-500">
            <span>{post.author?.name || '익명'}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(post.created_at)}</span>
            <span className="mx-2">•</span>
            <span>조회 {post.view_count}</span>
          </div>
        </div>
        
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* 좋아요 버튼 */}
        <div className="flex items-center space-x-4 py-4 border-t border-gray-200">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
            }`}
          >
            <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>좋아요 {post.like_count}</span>
          </button>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          댓글 ({post.comments?.length || 0})
        </h3>

        {/* 댓글 작성 폼 */}
        {user && (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="mb-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </form>
        )}

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {!post.comments || post.comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
            </p>
          ) : (
            post.comments.map((comment) => (
              <CommentCard 
                key={comment.id} 
                comment={comment} 
                currentUser={user}
                onDelete={handleDeleteComment}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 댓글 카드 컴포넌트
const CommentCard = ({ comment, currentUser, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const isAuthor = currentUser?.id === comment.user_id;

  return (
    <div className="border-l-2 border-gray-100 pl-4 py-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-gray-900">
              {comment.author?.name || '익명'}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(comment.created_at)}
            </span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        </div>
        
        {isAuthor && (
          <button
            onClick={() => onDelete(comment.id)}
            className="text-gray-400 hover:text-red-600 ml-2"
            title="댓글 삭제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default PostDetail; 