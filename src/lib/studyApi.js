import { supabase } from './supabase';

// 스터디 관련 API 함수들

// 모든 스터디 세션 조회
export const getStudySessions = async () => {
  try {
    // 먼저 세션들을 가져옴
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .order('session_date', { ascending: false });

    if (sessionsError) throw sessionsError;

    // 각 세션에 대해 참석 정보, 댓글, 좋아요를 별도로 조회
    const enrichedSessions = await Promise.all(
      (sessions || []).map(async (session) => {
        try {
          // 참석 정보 조회
          const { data: attendance } = await supabase
            .from('session_attendance')
            .select('id, user_id, status')
            .eq('session_id', session.id);

          // 참석자들의 프로필 정보 조회
          const attendanceWithProfiles = await Promise.all(
            (attendance || []).map(async (att) => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('name, email')
                  .eq('id', att.user_id)
                  .single();

                return {
                  ...att,
                  profiles: profile || { name: '익명', email: '' }
                };
              } catch (profileErr) {
                return {
                  ...att,
                  profiles: { name: '익명', email: '' }
                };
              }
            })
          );

          // 댓글 정보 조회
          const { data: comments } = await supabase
            .from('session_comments')
            .select('id, user_id, content, created_at')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });

          // 댓글 작성자들의 프로필 정보 조회
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

          // 좋아요 정보 조회
          const { data: likes } = await supabase
            .from('session_likes')
            .select('id, user_id, created_at')
            .eq('session_id', session.id);

          return {
            ...session,
            session_attendance: attendanceWithProfiles,
            session_comments: commentsWithProfiles,
            session_likes: likes || []
          };
        } catch (enrichErr) {
          return {
            ...session,
            session_attendance: [],
            session_comments: [],
            session_likes: []
          };
        }
      })
    );

    return { data: enrichedSessions, error: null };
  } catch (error) {
    console.error('스터디 세션 조회 오류:', error);
    return { data: [], error };
  }
};

// 스터디 세션 생성
export const createStudySession = async (sessionData) => {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        title: sessionData.title,
        presenter: sessionData.presenter,
        topic: sessionData.topic,
        description: sessionData.description,
        session_date: sessionData.session_date,
        location: sessionData.location || '온라인',
        created_by: sessionData.created_by
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('스터디 세션 생성 오류:', error);
    return { data: null, error };
  }
};

// 참석 상태 업데이트
export const updateAttendanceStatus = async (sessionId, userId, status) => {
  try {
    // 기존 참석 기록이 있는지 확인
    const { data: existingAttendance } = await supabase
      .from('session_attendance')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (existingAttendance) {
      // 기존 기록 업데이트
      const { data, error } = await supabase
        .from('session_attendance')
        .update({ status })
        .eq('id', existingAttendance.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } else {
      // 새 기록 생성
      const { data, error } = await supabase
        .from('session_attendance')
        .insert({
          session_id: sessionId,
          user_id: userId,
          status
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error('참석 상태 업데이트 오류:', error);
    return { data: null, error };
  }
};

// 세션 댓글 추가
export const addSessionComment = async (sessionId, userId, content) => {
  try {
    const { data, error } = await supabase
      .from('session_comments')
      .insert({
        session_id: sessionId,
        user_id: userId, // 전달받은 userId 그대로 사용
        content: content.trim()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('댓글 추가 오류:', error);
    return { data: null, error };
  }
};

// 세션 댓글 수정
export const updateSessionComment = async (commentId, userId, content) => {
  try {
    const { data, error } = await supabase
      .from('session_comments')
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

// 세션 댓글 삭제
export const deleteSessionComment = async (commentId, userId) => {
  try {
    const { error } = await supabase
      .from('session_comments')
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

// 세션 좋아요 토글
export const toggleSessionLike = async (sessionId, userId) => {
  try {
    // 기존 좋아요가 있는지 확인
    const { data: existingLike } = await supabase
      .from('session_likes')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // 좋아요가 있으면 제거
      const { error } = await supabase
        .from('session_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return { data: { liked: false }, error: null };
    } else {
      // 좋아요가 없으면 추가
      const { data, error } = await supabase
        .from('session_likes')
        .insert({
          session_id: sessionId,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return { data: { liked: true }, error: null };
    }
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    return { data: null, error };
  }
};

// 스터디 세션 수정
export const updateStudySession = async (sessionId, sessionData) => {
  try {
    const { data, error } = await supabase
      .from('study_sessions')
      .update({
        title: sessionData.title,
        presenter: sessionData.presenter,
        topic: sessionData.topic,
        description: sessionData.description,
        session_date: sessionData.session_date,
        location: sessionData.location || '온라인'
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('스터디 세션 수정 오류:', error);
    return { data: null, error };
  }
};

// 스터디 세션 삭제
export const deleteStudySession = async (sessionId) => {
  try {
    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('스터디 세션 삭제 오류:', error);
    return { error };
  }
};

// 스터디 노트 관련 API 함수들

// 스터디 세션의 노트 조회
export const getStudyNotes = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('study_notes')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116은 "not found" 에러
    return { data: data || null, error: null };
  } catch (error) {
    console.error('스터디 노트 조회 오류:', error);
    return { data: null, error };
  }
};

// 스터디 노트 저장/업데이트
export const saveStudyNotes = async (sessionId, userId, content) => {
  try {
    console.log('스터디 노트 저장 시도:', { sessionId, userId, content: content.substring(0, 50) + '...' });
    
    // 먼저 기존 노트가 있는지 확인
    const { data: existingNote, error: fetchError } = await supabase
      .from('study_notes')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    let data, error;

    if (existingNote) {
      // 기존 노트가 있으면 업데이트
      console.log('기존 노트 업데이트');
      const result = await supabase
        .from('study_notes')
        .update({
          content: content,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // 새 노트 생성
      console.log('새 노트 생성');
      const result = await supabase
        .from('study_notes')
        .insert({
          session_id: sessionId,
          content: content,
          updated_by: userId
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase 에러 상세:', error);
      throw error;
    }
    
    console.log('스터디 노트 저장 성공:', data);
    return { data, error: null };
  } catch (error) {
    console.error('스터디 노트 저장 오류:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return { data: null, error };
  }
};

// 스터디 노트 삭제
export const deleteStudyNotes = async (sessionId) => {
  try {
    const { error } = await supabase
      .from('study_notes')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('스터디 노트 삭제 오류:', error);
    return { error };
  }
};

// 퀴즈 관련 API 함수들

// 스터디 세션의 퀴즈 조회
export const getStudyQuizzes = async (sessionId) => {
  try {
    console.log('퀴즈 조회 시도:', sessionId);
    
    // 먼저 퀴즈 기본 정보를 가져옴
    const { data: quizzes, error: quizzesError } = await supabase
      .from('study_quizzes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (quizzesError) throw quizzesError;

    if (!quizzes || quizzes.length === 0) {
      return { data: [], error: null };
    }

    // 각 퀴즈에 대해 작성자 프로필 정보를 별도로 조회
    const enrichedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', quiz.created_by)
            .single();
          
          return {
            ...quiz,
            profiles: profile || { name: '익명', email: '' }
          };
        } catch (profileErr) {
          return {
            ...quiz,
            profiles: { name: '익명', email: '' }
          };
        }
      })
    );

    console.log('퀴즈 조회 성공:', enrichedQuizzes);
    return { data: enrichedQuizzes, error: null };
  } catch (error) {
    console.error('스터디 퀴즈 조회 오류:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return { data: [], error };
  }
};

// 퀴즈 생성
export const createStudyQuiz = async (quizData) => {
  try {
    console.log('퀴즈 생성 시도:', quizData);
    
    const { data, error } = await supabase
      .from('study_quizzes')
      .insert({
        session_id: quizData.sessionId,
        question: quizData.question,
        options: quizData.options,
        correct_answer: quizData.correctAnswer,
        explanation: quizData.explanation,
        created_by: quizData.createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase 에러 상세:', error);
      throw error;
    }
    
    console.log('퀴즈 생성 성공:', data);
    return { data, error: null };
  } catch (error) {
    console.error('퀴즈 생성 오류:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return { data: null, error };
  }
};

// 퀴즈 수정
export const updateStudyQuiz = async (quizId, quizData) => {
  try {
    console.log('퀴즈 수정 시도:', { quizId, quizData });
    
    const { data, error } = await supabase
      .from('study_quizzes')
      .update({
        question: quizData.question,
        options: quizData.options,
        correct_answer: quizData.correctAnswer,
        explanation: quizData.explanation,
        updated_at: new Date().toISOString()
      })
      .eq('id', quizId)
      .select()
      .single();

    if (error) {
      console.error('Supabase 에러 상세:', error);
      throw error;
    }
    
    console.log('퀴즈 수정 성공:', data);
    return { data, error: null };
  } catch (error) {
    console.error('퀴즈 수정 오류:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return { data: null, error };
  }
};

// 퀴즈 삭제
export const deleteStudyQuiz = async (quizId) => {
  try {
    const { error } = await supabase
      .from('study_quizzes')
      .delete()
      .eq('id', quizId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('퀴즈 삭제 오류:', error);
    return { error };
  }
};