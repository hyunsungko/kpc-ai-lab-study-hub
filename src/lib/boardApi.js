import { supabase } from './supabase';

// 게시판 관련 API 함수들

// 모든 게시글 조회
export const getBoardPosts = async (sortBy = 'latest') => {
  try {
    let query = supabase
      .from('board_posts')
      .select('*');

    // 정렬
    if (sortBy === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'popular') {
      query = query.order('view_count', { ascending: false });
    } else if (sortBy === 'pinned') {
      query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // 각 게시글에 대해 추가 정보 조회 (작성자, 좋아요 수, 댓글 수)
    const enrichedPosts = await Promise.all(
      (posts || []).map(async (post) => {
        try {
          // 작성자 정보 조회
          const { data: author } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', post.author_id)
            .single();

          // 좋아요 수 조회
          const { data: likes } = await supabase
            .from('board_likes')
            .select('id')
            .eq('post_id', post.id);

          // 댓글 수 조회
          const { data: comments } = await supabase
            .from('board_comments')
            .select('id')
            .eq('post_id', post.id);

          return {
            ...post,
            author: author || { name: '익명', email: '' },
            like_count: likes?.length || 0,
            comment_count: comments?.length || 0
          };
        } catch (enrichErr) {
          return {
            ...post,
            author: { name: '익명', email: '' },
            like_count: 0,
            comment_count: 0
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
    console.error('게시글 조회 오류:', error);
    return { data: [], error };
  }
};

// 특정 게시글 조회 (상세보기)
export const getBoardPost = async (postId) => {
  try {
    // 조회수 증가 - 먼저 현재 조회수를 가져온 후 1 증가
    const { data: currentPost } = await supabase
      .from('board_posts')
      .select('view_count')
      .eq('id', postId)
      .single();

    if (currentPost) {
      const { error: viewError } = await supabase
        .from('board_posts')
        .update({ view_count: (currentPost.view_count || 0) + 1 })
        .eq('id', postId);

      if (viewError) console.error('조회수 업데이트 오류:', viewError);
    }

    const { data: post, error } = await supabase
      .from('board_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    // 작성자 정보 조회
    const { data: author } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', post.author_id)
      .single();

    // 좋아요 수 조회
    const { data: likes } = await supabase
      .from('board_likes')
      .select('id')
      .eq('post_id', postId);

    // 댓글들 조회
    const { data: rawComments } = await supabase
      .from('board_comments')
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
            author: profile || { name: '익명', email: '' }
          };
        } catch (profileErr) {
          return {
            ...comment,
            author: { name: '익명', email: '' }
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
    console.error('게시글 상세 조회 오류:', error);
    return { data: null, error };
  }
};

// 게시글 생성
export const createBoardPost = async (postData) => {
  try {
    const { data, error } = await supabase
      .from('board_posts')
      .insert({
        title: postData.title,
        content: postData.content,
        author_id: postData.author_id,
        is_pinned: postData.is_pinned || false
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('게시글 생성 오류:', error);
    return { data: null, error };
  }
};

// 게시글 수정
export const updateBoardPost = async (postId, postData, userId) => {
  try {
    const { data, error } = await supabase
      .from('board_posts')
      .update({
        title: postData.title,
        content: postData.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('author_id', userId) // 본인 글만 수정 가능
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    return { data: null, error };
  }
};


// 게시글 삭제
export const deleteBoardPost = async (postId) => {
  try {
    const { error } = await supabase
      .from('board_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    return { error };
  }
};

// 좋아요 토글
export const toggleBoardLike = async (postId, userId) => {
  try {
    // 이미 좋아요했는지 확인
    const { data: existingLike } = await supabase
      .from('board_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // 좋아요 취소
      const { error } = await supabase
        .from('board_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return { data: { liked: false }, error: null };
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('board_likes')
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

// 사용자가 특정 게시글에 좋아요했는지 확인
export const checkBoardUserLike = async (postId, userId) => {
  try {
    const { data, error } = await supabase
      .from('board_likes')
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
export const createBoardComment = async (commentData) => {
  try {
    const { data, error } = await supabase
      .from('board_comments')
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

// 댓글 삭제
export const deleteBoardComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('board_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return { error };
  }
};

// 게시글 검색
export const searchBoardPosts = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('board_posts')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('게시글 검색 오류:', error);
    return { data: [], error };
  }
};