import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 세션 스토리지 키
const SESSION_KEY = 'kpc-auth-session';
const PROFILE_KEY = 'kpc-auth-profile';

// 최적화된 인증 상태
const AUTH_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated'
};

export const AuthProvider = ({ children }) => {
  const [status, setStatus] = useState(AUTH_STATUS.LOADING);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  
  // 제어 플래그들
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);
  const authListenerRef = useRef(null);

  // 유틸리티 함수들
  const isLoading = status === AUTH_STATUS.LOADING;
  const isAuthenticated = status === AUTH_STATUS.AUTHENTICATED;

  // 안전한 상태 업데이트
  const safeUpdate = useCallback((updater) => {
    if (mountedRef.current) {
      updater();
    }
  }, []);

  // 세션 저장소 관리
  const saveToStorage = useCallback((key, data) => {
    try {
      if (data) {
        sessionStorage.setItem(key, JSON.stringify(data));
      } else {
        sessionStorage.removeItem(key);
      }
    } catch (err) {
      console.warn('Storage save failed:', err);
    }
  }, []);

  const getFromStorage = useCallback((key) => {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn('Storage read failed:', err);
      return null;
    }
  }, []);

  // 기본 프로필 생성
  const createDefaultProfile = useCallback((userData) => ({
    id: userData.id,
    email: userData.email,
    name: userData.email?.split('@')[0] || '사용자',
    department: 'KPC AI Lab',
    position: '팀원',
    avatar_url: null,
    bio: null,
    interests: []
  }), []);

  // 프로필 로드 (백그라운드, 실패 무시)
  const loadProfile = useCallback(async (userId) => {
    try {
      console.log('👤 Loading profile:', userId);
      
      // 스토리지에서 캐시된 프로필 먼저 체크
      const cached = getFromStorage(PROFILE_KEY);
      if (cached && cached.id === userId) {
        console.log('📦 Using cached profile');
        return cached;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // 프로필 없음 - 기본값 생성 및 저장 시도
        const userInfo = user || await getCurrentUser().then(res => res.user);
        const defaultProfile = createDefaultProfile({ id: userId, email: userInfo?.email });
        
        try {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert(defaultProfile)
            .select()
            .single();
          
          if (newProfile) {
            saveToStorage(PROFILE_KEY, newProfile);
            return newProfile;
          }
        } catch (createError) {
          console.warn('Profile creation failed, using default:', createError);
        }
        
        return defaultProfile;
      } else if (error) {
        console.error('Profile query error:', error);
        const userInfo = user || await getCurrentUser().then(res => res.user).catch(() => null);
        return createDefaultProfile({ id: userId, email: userInfo?.email });
      }

      // 성공한 프로필 캐시
      saveToStorage(PROFILE_KEY, data);
      return data;
    } catch (err) {
      console.error('Profile load exception:', err);
      const userInfo = user || await getCurrentUser().then(res => res.user).catch(() => null);
      return createDefaultProfile({ id: userId, email: userInfo?.email });
    }
  }, [user, createDefaultProfile, getFromStorage, saveToStorage]);

  // 핵심 인증 초기화 - 단순하고 빠르게
  const initializeAuth = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      console.log('🚀 Quick auth initialization...');

      // 1. 스토리지에서 세션 체크 (즉시)
      const cachedSession = getFromStorage(SESSION_KEY);
      const cachedProfile = getFromStorage(PROFILE_KEY);

      // 2. Supabase 세션 체크 (병렬)
      const sessionPromise = supabase.auth.getSession();
      
      // 캐시가 있으면 즉시 UI 표시
      if (cachedSession && cachedProfile) {
        console.log('⚡ Using cached session for instant UI');
        safeUpdate(() => {
          setUser(cachedSession);
          setProfile(cachedProfile);
          setStatus(AUTH_STATUS.AUTHENTICATED);
        });
      }

      // 실제 세션 검증
      const { data: { session }, error } = await sessionPromise;

      if (error) {
        console.error('Session check error:', error);
        throw error;
      }

      if (!session?.user) {
        console.log('No active session');
        // 캐시 클리어
        saveToStorage(SESSION_KEY, null);
        saveToStorage(PROFILE_KEY, null);
        
        safeUpdate(() => {
          setUser(null);
          setProfile(null);
          setStatus(AUTH_STATUS.UNAUTHENTICATED);
        });
        return;
      }

      // 세션 유효 - 사용자 정보 업데이트
      console.log('✅ Valid session:', session.user.email);
      saveToStorage(SESSION_KEY, session.user);
      
      safeUpdate(() => {
        setUser(session.user);
        setStatus(AUTH_STATUS.AUTHENTICATED);
        
        // 캐시된 프로필이 있으면 사용, 없으면 기본값으로 즉시 설정
        if (cachedProfile && cachedProfile.id === session.user.id) {
          setProfile(cachedProfile);
        } else {
          setProfile(createDefaultProfile(session.user));
        }
      });

      // 백그라운드에서 프로필 로드 (실패해도 기본 프로필로 진행)
      if (!cachedProfile || cachedProfile.id !== session.user.id) {
        loadProfile(session.user.id)
          .then(userProfile => {
            safeUpdate(() => setProfile(userProfile));
          })
          .catch(err => {
            console.warn('Profile load failed, keeping default:', err);
            // 기본 프로필 유지, 인증 상태는 그대로
          });
      }

    } catch (err) {
      console.error('Auth initialization failed:', err);
      
      // 오류 시 로그인 화면
      saveToStorage(SESSION_KEY, null);
      saveToStorage(PROFILE_KEY, null);
      
      safeUpdate(() => {
        setUser(null);
        setProfile(null);
        setStatus(AUTH_STATUS.UNAUTHENTICATED);
        setError(err.message);
      });
    }
  }, [getFromStorage, saveToStorage, safeUpdate, createDefaultProfile, loadProfile]);

  // Auth 상태 변화 리스너 (다중 세션 지원)
  const setupAuthListener = useCallback(() => {
    if (authListenerRef.current) return;

    console.log('🎧 Setting up auth listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        console.log('🔄 Auth event:', event, session?.user?.email || 'no-session');

        // 로컬 로그아웃만 처리 (다른 디바이스에서의 로그아웃은 무시)
        if (event === 'SIGNED_OUT') {
          console.log('👋 Local sign out detected');
          
          // 현재 브라우저/탭에서만 로그아웃 처리
          saveToStorage(SESSION_KEY, null);
          saveToStorage(PROFILE_KEY, null);
          
          safeUpdate(() => {
            setUser(null);
            setProfile(null);
            setStatus(AUTH_STATUS.UNAUTHENTICATED);
          });
          return;
        }

        // 로그인 이벤트 - 즉시 인증 상태로 전환
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 User signed in:', session.user.email);
          
          saveToStorage(SESSION_KEY, session.user);
          
          safeUpdate(() => {
            setUser(session.user);
            setStatus(AUTH_STATUS.AUTHENTICATED);
            // 기본 프로필로 즉시 설정 (로딩 상태 해제)
            setProfile(createDefaultProfile(session.user));
          });

          // 백그라운드에서 실제 프로필 로드
          loadProfile(session.user.id).then(userProfile => {
            safeUpdate(() => setProfile(userProfile));
          }).catch(err => {
            console.warn('Profile load failed, using default:', err);
          });
          return;
        }

        // 토큰 갱신만 처리
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed for:', session.user.email);
          
          const currentUser = getFromStorage(SESSION_KEY);
          if (currentUser && currentUser.id === session.user.id) {
            saveToStorage(SESSION_KEY, session.user);
            safeUpdate(() => {
              setUser(session.user);
            });
          }
        }
      }
    );

    authListenerRef.current = subscription;
    return subscription;
  }, [saveToStorage, safeUpdate, profile, loadProfile, getFromStorage]);

  // 컴포넌트 마운트
  useEffect(() => {
    console.log('🎬 AuthProvider mounting');
    
    // 즉시 초기화
    initializeAuth();
    
    // 리스너 설정
    const subscription = setupAuthListener();
    
    // 5초 안전 타임아웃 (더 짧게)
    const timeout = setTimeout(() => {
      if (mountedRef.current && status === AUTH_STATUS.LOADING) {
        console.log('⏰ Initialization timeout - showing login');
        safeUpdate(() => {
          setStatus(AUTH_STATUS.UNAUTHENTICATED);
        });
      }
    }, 5000);

    return () => {
      console.log('👋 AuthProvider unmounting');
      mountedRef.current = false;
      clearTimeout(timeout);
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, []); // 빈 의존성 배열

  // 로그인
  const signIn = useCallback(async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    }
  }, []);

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, []);

  // 회원가입
  const signUp = useCallback(async (email, password, userData) => {
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
  }, []);

  // 프로필 업데이트
  const updateProfile = useCallback(async (updates) => {
    try {
      if (!user) throw new Error('사용자가 로그인되어 있지 않습니다.');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // 캐시 업데이트
      saveToStorage(PROFILE_KEY, data);
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [user, saveToStorage]);

  const value = {
    // 상태
    user,
    profile,
    loading: isLoading,
    isAuthenticated,
    error,
    status,
    
    // 함수
    signIn,
    signOut,
    signUp,
    updateProfile,
    
    // 레거시 호환
    isKPCMember: !!profile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};