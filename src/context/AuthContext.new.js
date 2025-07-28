import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 인증 상태 열거형
const AUTH_STATES = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated', 
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
};

export const AuthProvider = ({ children }) => {
  // 핵심 상태
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  
  // 제어 변수
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const maxRetryRef = useRef(3);

  // 상태 계산
  const loading = authState === AUTH_STATES.LOADING;
  const isAuthenticated = authState === AUTH_STATES.AUTHENTICATED;

  // 안전한 상태 업데이트 함수
  const safeSetState = (stateFn) => {
    if (mountedRef.current) {
      stateFn();
    }
  };

  // 기본 프로필 생성
  const createDefaultProfile = (userData) => ({
    id: userData.id,
    email: userData.email,
    name: userData.email?.split('@')[0] || '사용자',
    department: 'KPC AI Lab',
    position: '팀원'
  });

  // 프로필 로딩 (비동기, 실패해도 진행)
  const loadProfile = async (userId) => {
    console.log('👤 Loading profile for:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // 프로필이 없으면 생성 시도
        console.log('📝 Creating new profile...');
        const defaultProfile = createDefaultProfile({ id: userId, email: user?.email });
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single();
          
        if (!createError && newProfile) {
          console.log('✅ Profile created:', newProfile);
          return newProfile;
        } else {
          console.warn('⚠️ Profile creation failed, using default');
          return defaultProfile;
        }
      } else if (error) {
        console.error('❌ Profile query error:', error);
        return createDefaultProfile({ id: userId, email: user?.email });
      } else {
        console.log('✅ Profile loaded:', data);
        return data;
      }
    } catch (error) {
      console.error('❌ Profile loading exception:', error);
      return createDefaultProfile({ id: userId, email: user?.email });
    }
  };

  // 메인 초기화 함수 (단순화)
  const initializeAuth = async () => {
    if (initializingRef.current) {
      console.log('⏸️ Already initializing, skipping...');
      return;
    }
    
    initializingRef.current = true;
    console.log('🚀 Initializing auth...');
    
    try {
      // 1단계: 세션 확인 (즉시 실패 시 로그인 화면)
      console.log('1️⃣ Checking session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }

      if (!session?.user) {
        console.log('ℹ️ No session found');
        safeSetState(() => {
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setUser(null);
          setProfile(null);
        });
        return;
      }

      // 2단계: 사용자 인증 완료
      console.log('2️⃣ Session found:', session.user.email);
      safeSetState(() => {
        setUser(session.user);
        setAuthState(AUTH_STATES.AUTHENTICATED);
        // 기본 프로필로 일단 시작
        setProfile(createDefaultProfile(session.user));
      });

      // 3단계: 프로필 비동기 로딩 (백그라운드)
      console.log('3️⃣ Loading profile in background...');
      const userProfile = await loadProfile(session.user.id);
      
      safeSetState(() => {
        setProfile(userProfile);
      });
      
      console.log('✅ Auth initialization complete');
      
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      safeSetState(() => {
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
        setUser(null);
        setProfile(null);
        setError(error.message);
      });
    } finally {
      initializingRef.current = false;
    }
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log('🎬 AuthProvider mounted');
    
    // 즉시 초기화 시작
    initializeAuth();
    
    // Auth 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth change:', event, session?.user?.email);
        
        if (!mountedRef.current) return;
        
        // 로그아웃 이벤트
        if (event === 'SIGNED_OUT' || !session) {
          safeSetState(() => {
            setAuthState(AUTH_STATES.UNAUTHENTICATED);
            setUser(null);
            setProfile(null);
          });
          return;
        }
        
        // 로그인 이벤트 (재초기화)
        if (event === 'SIGNED_IN' && session?.user) {
          await initializeAuth();
        }
      }
    );

    // 15초 강제 타임아웃 (최종 안전장치)
    const forceComplete = setTimeout(() => {
      if (mountedRef.current && authState === AUTH_STATES.LOADING) {
        console.log('⏰ Force timeout - showing login');
        safeSetState(() => {
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
          setUser(null);
          setProfile(null);
        });
      }
    }, 15000);

    return () => {
      console.log('👋 AuthProvider unmounting');
      mountedRef.current = false;
      clearTimeout(forceComplete);
      subscription.unsubscribe();
    };
  }, []);

  // 로그인 함수
  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // onAuthStateChange에서 처리됨
      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    }
  };

  // 로그아웃 함수  
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // onAuthStateChange에서 처리됨
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // 회원가입 함수
  const signUp = async (email, password, userData) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    }
  };

  // 프로필 업데이트 함수
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('사용자가 로그인되어 있지 않습니다.');
      
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
    // 상태
    user,
    profile,
    loading,
    isAuthenticated,
    error,
    authState,
    
    // 함수
    signIn,
    signOut,
    signUp,
    updateProfile,
    
    // 레거시 호환성
    isKPCMember: !!profile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};