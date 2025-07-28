import { createClient } from '@supabase/supabase-js';

// 환경변수에서 Supabase 설정 가져오기 (fallback으로 하드코딩된 값 사용)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dalznnfyyzbuoiwriajd.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhbHpubmZ5eXpidW9pd3JpYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzkxMTcsImV4cCI6MjA2ODI1NTExN30.NZEvfz21B4sjEla1zYY-UuhrhxVQnvT5khQK8fmCe-c';

// 디바이스별 고유 세션 키 생성
const generateDeviceSessionKey = () => {
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'server';
  const screenInfo = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown';
  const timestamp = typeof window !== 'undefined' ? window.sessionStorage.getItem('kpc-device-id') : null;
  
  if (!timestamp && typeof window !== 'undefined') {
    const deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    window.sessionStorage.setItem('kpc-device-id', deviceId);
    return `kpc-session-${deviceId}`;
  }
  
  return `kpc-session-${timestamp || 'fallback'}`;
};

// Supabase 클라이언트 생성 (다중 디바이스 세션 지원)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    storageKey: generateDeviceSessionKey(),
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'kpc-ai-lab-study-hub',
      'x-device-session': generateDeviceSessionKey(),
      'Cache-Control': 'no-cache'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    console.log('🔗 Supabase 연결 테스트 중...');
    console.log('URL:', supabaseUrl);
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase 연결 오류:', error);
      return { success: false, error };
    }
    
    console.log('✅ Supabase 연결 성공');
    return { success: true, data };
  } catch (err) {
    console.error('❌ Supabase 연결 실패:', err);
    return { success: false, error: err };
  }
};

// Auth Helper Functions
export const signUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      console.error('회원가입 오류:', error);
    }
    return { data, error };
  } catch (err) {
    console.error('회원가입 네트워크 오류:', err);
    return { data: null, error: err };
  }
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('로그인 오류:', error);
    }
    return { data, error };
  } catch (err) {
    console.error('로그인 네트워크 오류:', err);
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('로그아웃 오류:', error);
    }
    return { error };
  } catch (err) {
    console.error('로그아웃 네트워크 오류:', err);
    return { error: err };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('사용자 정보 조회 오류:', error);
    }
    return { user, error };
  } catch (err) {
    console.error('사용자 정보 조회 네트워크 오류:', err);
    return { user: null, error: err };
  }
}; 