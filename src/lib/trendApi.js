import { supabase } from './supabase';

// 트렌드 관련 API 함수들

// 모든 트렌드 포스트 조회
export const getTrendPosts = async (category = 'all', sortBy = 'latest') => {
  try {
    let query = supabase
      .from('trend_posts')
      .select('*');

    // 카테고리 필터링
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    // 정렬
    if (sortBy === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'popular') {
      // 좋아요 수는 별도로 계산해야 함
      query = query.order('created_at', { ascending: false });
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // 각 포스트에 대해 추가 정보 조회 (작성자, 좋아요 수, 댓글 수)
    const enrichedPosts = await Promise.all(
      (posts || []).map(async (post) => {
        try {
          // 작성자 정보 조회
          const { data: author } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', post.created_by)
            .single();

          // 좋아요 수 조회
          const { data: likes } = await supabase
            .from('trend_likes')
            .select('id')
            .eq('post_id', post.id);

          // 댓글 조회 (작성자 정보 포함)
          const { data: comments } = await supabase
            .from('trend_comments')
            .select('id, content, created_at, user_id')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          // 댓글 작성자 정보 조회
          const commentsWithProfiles = await Promise.all(
            (comments || []).map(async (comment) => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('name, email')
                  .eq('id', comment.user_id)
                  .single();

                return {
                  ...comment,
                  profiles: profile || { name: '익명', email: '' }
                };
              } catch (profileErr) {
                return {
                  ...comment,
                  profiles: { name: '익명', email: '' }
                };
              }
            })
          );

          return {
            ...post,
            author: author || { name: '익명', email: '' },
            like_count: likes?.length || 0,
            comment_count: comments?.length || 0,
            trend_comments: commentsWithProfiles
          };
        } catch (enrichErr) {
          return {
            ...post,
            author: { name: '익명', email: '' },
            like_count: 0,
            comment_count: 0,
            trend_comments: []
          };
        }
      })
    );

    // 인기순 정렬인 경우 좋아요 수로 정렬
    if (sortBy === 'popular') {
      enrichedPosts.sort((a, b) => b.like_count - a.like_count);
    }

    return { data: enrichedPosts, error: null };
  } catch (error) {
    console.error('트렌드 포스트 조회 오류:', error);
    return { data: [], error };
  }
};

// 특정 트렌드 포스트 조회
export const getTrendPost = async (postId) => {
  try {
    const { data: post, error } = await supabase
      .from('trend_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    // 작성자 정보 조회
    const { data: author } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', post.created_by)
      .single();

    // 좋아요 수 조회
    const { data: likes } = await supabase
      .from('trend_likes')
      .select('id')
      .eq('post_id', postId);

    // 댓글들 조회
    const { data: rawComments } = await supabase
      .from('trend_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    // 각 댓글에 대해 사용자 정보를 별도로 조회
    const comments = await Promise.all(
      (rawComments || []).map(async (comment) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', comment.user_id)
            .single();
          
          return {
            ...comment,
            profiles: profile || { name: '익명', email: '' }
          };
        } catch (profileErr) {
          return {
            ...comment,
            profiles: { name: '익명', email: '' }
          };
        }
      })
    );

    return {
      data: {
        ...post,
        author: author || { name: '익명', email: '' },
        like_count: likes?.length || 0,
        comments: comments || []
      },
      error: null
    };
  } catch (error) {
    console.error('트렌드 포스트 상세 조회 오류:', error);
    return { data: null, error };
  }
};

// 트렌드 포스트 생성
export const createTrendPost = async (postData) => {
  try {
    const { data, error } = await supabase
      .from('trend_posts')
      .insert({
        title: postData.title,
        content: postData.content,
        category: postData.category,
        url: postData.url || null,
        thumbnail_url: postData.thumbnail_url || null,
        tags: postData.tags || [],
        created_by: postData.created_by
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('트렌드 포스트 생성 오류:', error);
    return { data: null, error };
  }
};

// 트렌드 포스트 수정
export const updateTrendPost = async (postId, postData) => {
  try {
    const { data, error } = await supabase
      .from('trend_posts')
      .update({
        title: postData.title,
        content: postData.content,
        category: postData.category,
        url: postData.url,
        thumbnail_url: postData.thumbnail_url,
        tags: postData.tags
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('트렌드 포스트 수정 오류:', error);
    return { data: null, error };
  }
};

// 트렌드 포스트 삭제
export const deleteTrendPost = async (postId) => {
  try {
    const { error } = await supabase
      .from('trend_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('트렌드 포스트 삭제 오류:', error);
    return { error };
  }
};

// 좋아요 토글
export const toggleLike = async (postId, userId) => {
  try {
    // 이미 좋아요했는지 확인
    const { data: existingLike } = await supabase
      .from('trend_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // 좋아요 취소
      const { error } = await supabase
        .from('trend_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return { data: { liked: false }, error: null };
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('trend_likes')
        .insert({
          post_id: postId,
          user_id: userId
        });

      if (error) throw error;
      return { data: { liked: true }, error: null };
    }
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    return { data: null, error };
  }
};

// 사용자가 특정 포스트에 좋아요했는지 확인
export const checkUserLike = async (postId, userId) => {
  try {
    const { data, error } = await supabase
      .from('trend_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: !!data, error: null };
  } catch (error) {
    console.error('좋아요 확인 오류:', error);
    return { data: false, error };
  }
};

// 댓글 생성
export const createComment = async (commentData) => {
  try {
    const { data, error } = await supabase
      .from('trend_comments')
      .insert({
        post_id: commentData.post_id,
        user_id: commentData.user_id,
        content: commentData.content
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('댓글 생성 오류:', error);
    return { data: null, error };
  }
};

// 댓글 수정
export const updateComment = async (commentId, userId, content) => {
  try {
    const { data, error } = await supabase
      .from('trend_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId) // 본인 댓글만 수정 가능
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    return { data: null, error };
  }
};

// 댓글 삭제
export const deleteComment = async (commentId, userId) => {
  try {
    const { error } = await supabase
      .from('trend_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // 본인 댓글만 삭제 가능

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return { error };
  }
};

// 검색
export const searchTrendPosts = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('trend_posts')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('트렌드 포스트 검색 오류:', error);
    return { data: [], error };
  }
};

// 카테고리 목록
export const getTrendCategories = () => {
  return [
    { value: 'ai_info', label: 'AI 정보', icon: '🤖' },
    { value: 'certification_info', label: '자격 정보', icon: '📜' }
  ];
};

// URL에서 썸네일 추출 (YouTube, 일반 웹페이지)
export const extractThumbnail = async (url) => {
  try {
    // YouTube URL 처리
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    // 일반적인 경우는 클라이언트에서 처리하거나 외부 서비스 사용
    return null;
  } catch (error) {
    console.error('썸네일 추출 오류:', error);
    return null;
  }
};