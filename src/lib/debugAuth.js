import { supabase } from './supabase';

// 현재 인증 상태 디버깅 함수
export const debugAuthState = async () => {
  console.log('🔍 인증 상태 디버깅 시작...');
  
  try {
    // 1. 현재 세션 확인
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('📋 현재 세션:', sessionData);
    if (sessionError) console.error('❌ 세션 오류:', sessionError);
    
    // 2. 현재 사용자 확인
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('👤 현재 사용자:', userData);
    if (userError) console.error('❌ 사용자 오류:', userError);
    
    // 3. 사용자 프로필 확인
    if (userData?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      
      console.log('👨‍💼 사용자 프로필:', profileData);
      if (profileError) console.error('❌ 프로필 오류:', profileError);
    }
    
    // 4. auth.uid() 함수 테스트
    const { data: authTest, error: authTestError } = await supabase
      .from('study_sessions')
      .select('id, title, created_by')
      .limit(1);
    
    console.log('🔑 auth.uid() 테스트 (study_sessions 조회):', authTest);
    if (authTestError) console.error('❌ auth.uid() 테스트 오류:', authTestError);
    
    // 5. RLS 정책 테스트 - 댓글 테이블
    const { data: commentTest, error: commentTestError } = await supabase
      .from('session_comments')
      .select('*')
      .limit(1);
    
    console.log('💬 댓글 테이블 조회 테스트:', commentTest);
    if (commentTestError) console.error('❌ 댓글 테이블 오류:', commentTestError);
    
    // 6. RLS 정책 테스트 - 좋아요 테이블
    const { data: likeTest, error: likeTestError } = await supabase
      .from('session_likes')
      .select('*')
      .limit(1);
    
    console.log('❤️ 좋아요 테이블 조회 테스트:', likeTest);
    if (likeTestError) console.error('❌ 좋아요 테이블 오류:', likeTestError);
    
    console.log('✅ 인증 상태 디버깅 완료');
    
    return {
      session: sessionData,
      user: userData,
      canAccessStudySessions: !authTestError,
      canAccessComments: !commentTestError,
      canAccessLikes: !likeTestError
    };
    
  } catch (error) {
    console.error('🚨 디버깅 중 예외 발생:', error);
    return { error };
  }
};

// 권한 문제 해결 시도
export const attemptPermissionFix = async () => {
  console.log('🔧 권한 문제 해결 시도...');
  
  try {
    // 현재 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ 로그인된 사용자가 없습니다.');
      return { success: false, error: 'No authenticated user' };
    }
    
    console.log('👤 현재 사용자 ID:', user.id);
    
    // 프로필 테이블에 사용자가 존재하는지 확인
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileCheckError && profileCheckError.code === 'PGRST116') {
      // 프로필이 없으면 생성
      console.log('🆕 프로필 생성 중...');
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0],
          created_at: new Date().toISOString()
        });
      
      if (createProfileError) {
        console.error('❌ 프로필 생성 실패:', createProfileError);
      } else {
        console.log('✅ 프로필 생성 성공');
      }
    } else if (existingProfile) {
      console.log('✅ 기존 프로필 확인:', existingProfile);
    }
    
    // 토큰 갱신 시도
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error('❌ 토큰 갱신 실패:', refreshError);
    } else {
      console.log('🔄 토큰 갱신 성공');
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('🚨 권한 수정 중 오류:', error);
    return { success: false, error };
  }
};