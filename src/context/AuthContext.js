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
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // 초기 사용자 상태 확인
    const initAuth = async () => {
      await checkUser();
      if (mounted) {
        setInitialCheckComplete(true);
      }
    };
    
    initAuth();

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;
        
        try {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        } finally {
          if (mounted && initialCheckComplete) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialCheckComplete]);

  const checkUser = async () => {
    try {
      console.log('🔍 Checking user session...');
      
      // 세션 확인 시 타임아웃 설정
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 10000)
      );
      
      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]);
      
      if (sessionError && sessionError.message !== 'Auth session missing!') {
        console.error('세션 오류:', sessionError);
      }
      
      // 세션이 있으면 사용자 설정
      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        setUser(session.user);
        await fetchProfile(session.user.id);
        return;
      }
      
      console.log('❌ No session found');
      // 세션이 없으면 로그아웃 상태로 설정
      setUser(null);
      setProfile(null);
      
    } catch (error) {
      console.error('⚠️ Error checking user:', error);
      // 타임아웃이나 네트워크 오류 시에도 로딩 해제
      setUser(null);
      setProfile(null);
    } finally {
      // 초기 체크가 완료되면 로딩 해제
      console.log('🏁 Initial user check complete');
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      console.log('👤 Fetching profile for:', userId);
      
      // 프로필 조회 시 타임아웃 설정
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
      );
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);
      
      if (error && error.code === 'PGRST116') {
        // 프로필이 없으면 기본 프로필 생성
        console.log('📝 Creating default profile...');
        const { user: currentUser } = await getCurrentUser();
        const defaultProfile = {
          id: userId,
          email: currentUser?.email || '',
          name: currentUser?.email?.split('@')[0] || '사용자',
          department: 'KPC AI Lab'
        };
        
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(defaultProfile)
            .select()
            .single();
            
          if (createError) {
            console.error('❌ 프로필 생성 실패:', createError);
            setProfile(defaultProfile);
          } else {
            console.log('✅ 새 프로필 생성 성공:', newProfile);
            setProfile(newProfile);
          }
        } catch (createErr) {
          console.error('❌ 프로필 생성 중 예외:', createErr);
          setProfile(defaultProfile);
        }
      } else if (error) {
        console.error('❌ 프로필 조회 오류:', error);
        // 오류 시 기본 프로필 설정
        const { user: currentUser } = await getCurrentUser().catch(() => ({ user: null }));
        setProfile({
          id: userId,
          email: currentUser?.email || '',
          name: currentUser?.email?.split('@')[0] || '사용자',
          department: 'KPC AI Lab'
        });
      } else {
        console.log('✅ 프로필 조회 성공:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('⚠️ 프로필 fetch 예외:', error);
      // 타임아웃이나 네트워크 오류 시 기본 프로필 설정
      const { user: fallbackUser } = await getCurrentUser().catch(() => ({ user: null }));
      setProfile({
        id: userId,
        email: fallbackUser?.email || '',
        name: fallbackUser?.email?.split('@')[0] || '사용자',
        department: 'KPC AI Lab'
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
      if (!user) throw new Error('사용자가 로그인되어 있지 않습니다.');
      
      console.log('프로필 업데이트 시도:', updates);
      console.log('현재 사용자 ID:', user.id);
      
      // 프로필이 존재하지 않으면 먼저 생성
      if (!profile) {
        console.log('프로필이 없어서 새로 생성합니다.');
        const newProfile = {
          id: user.id,
          email: user.email,
          name: updates.name || user.email?.split('@')[0] || '사용자',
          department: updates.department || 'KPC AI Lab'
        };
        
        const { data: createData, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
          
        if (createError) {
          console.error('프로필 생성 실패:', createError);
          throw createError;
        }
        
        console.log('새 프로필 생성 성공:', createData);
        setProfile(createData);
        return { data: createData, error: null };
      }
      
      // 기존 프로필 업데이트
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('프로필 업데이트 실패:', error);
        throw error;
      }
      
      console.log('프로필 업데이트 성공:', data);
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('프로필 업데이트 에러:', error);
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