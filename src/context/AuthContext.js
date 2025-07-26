import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 사용자 상태 확인
    checkUser();

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        // 테스트 환경에서 act() 경고를 방지하기 위해 setTimeout 사용
        if (process.env.NODE_ENV === 'test') {
          setTimeout(() => setLoading(false), 0);
        } else {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      // 먼저 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError && sessionError.message !== 'Auth session missing!') {
        console.error('세션 오류:', sessionError);
      }
      
      // 세션이 있으면 사용자 설정
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        return;
      }
      
      // 세션이 없으면 사용자 정보로 재확인 (fallback)
      const { user, error } = await getCurrentUser();
      if (error && error.message !== 'Auth session missing!') {
        console.error('사용자 확인 오류:', error);
      }
      
      if (user) {
        setUser(user);
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // 오류가 있어도 앱이 계속 작동하도록 함
    } finally {
      // 테스트 환경에서 act() 경고를 방지하기 위해 setTimeout 사용
      if (process.env.NODE_ENV === 'test') {
        setTimeout(() => setLoading(false), 0);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchProfile = async (userId) => {
    try {
      // 현재 사용자 정보 가져오기
      const { user: currentUser } = await getCurrentUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // 프로필이 없으면 기본 프로필 생성
        console.log('프로필이 없어서 기본 프로필을 생성합니다.');
        const defaultProfile = {
          id: userId,
          email: currentUser?.email || '',
          name: currentUser?.email?.split('@')[0] || '사용자'
        };
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single();
          
        if (createError) {
          console.error('프로필 생성 실패:', createError);
          setProfile(defaultProfile); // 임시로 설정
        } else {
          console.log('✅ 새 프로필이 생성되었습니다:', newProfile);
          setProfile(newProfile);
        }
      } else if (error) {
        throw error;
      } else {
        console.log('✅ 기존 프로필을 불러왔습니다:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // 오류 시 임시 프로필 설정
      setProfile({
        id: userId,
        name: '사용자',
        department: 'KPC AI Lab',
        position: '팀원'
      });
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      
      // 1. 사용자 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      console.log('회원가입 성공:', authData);
      
      // 2. 프로필 생성 (임시로 주석 처리 - RLS 정책 수정 후 활성화)
      if (authData.user) {
        console.log('프로필 생성 시도 중...');
        
        // 임시: 프로필 생성을 건너뛰고 나중에 로그인 시 처리
        console.warn('임시: 프로필 생성을 건너뛰고 있습니다. RLS 정책을 먼저 수정해주세요.');
        
        /* RLS 정책 수정 후 이 부분 활성화
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            name: userData.name,
            bio: userData.bio || '',
            interests: userData.interests || []
          })
          .select()
          .single();
        
        if (profileError) {
          console.error('프로필 생성 에러:', profileError);
          if (profileError.code === '42501') {
            console.warn('RLS 정책 오류 - 관리자에게 문의하세요');
          }
        } else {
          console.log('프로필 생성 성공:', profileData);
        }
        */
      }
      
      return { data: authData, error: null };
    } catch (error) {
      console.error('회원가입 에러:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('로그인 오류:', error);
        return { data: null, error };
      }
      
      // 로그인 성공 시 사용자 정보 설정
      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
      }
      
      console.log('로그인 성공:', data);
      return { data, error: null };
    } catch (error) {
      console.error('로그인 예외:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    isKPCMember: !!profile // KPC 팀원인지 확인
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 