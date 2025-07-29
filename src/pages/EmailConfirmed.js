import React, { useEffect } from 'react';

const EmailConfirmed = () => {
  useEffect(() => {
    // 5초 후 자동으로 로그인 페이지로 이동
    const timer = setTimeout(() => {
      // 현재 도메인으로 이동 (localhost:3000 문제 해결)
      const currentOrigin = window.location.origin;
      window.location.href = currentOrigin;
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleLoginNow = () => {
    // 현재 도메인으로 이동
    const currentOrigin = window.location.origin;
    window.location.href = currentOrigin;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 성공 아이콘 */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* 제목 */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            이메일 확인 완료! 🎉
          </h2>
          
          {/* 설명 */}
          <p className="text-lg text-gray-600 mb-6">
            축하합니다! 이메일 인증이 성공적으로 완료되었습니다.
          </p>

          {/* 안내 메시지 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800">
                이제 Mars-Q 스터디 플랫폼에 로그인하실 수 있습니다!
              </p>
            </div>
          </div>

          {/* 다음 단계 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">다음 단계:</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>✅ 이메일 인증 완료</li>
              <li>➡️ 로그인 페이지로 이동</li>
              <li>🏠 대시보드에서 스터디 활동 시작</li>
            </ul>
          </div>

          {/* 자동 이동 알림 */}
          <p className="text-sm text-gray-500 mb-6">
            5초 후 자동으로 로그인 페이지로 이동합니다...
          </p>

          {/* 버튼들 */}
          <div className="space-y-3">
            <button
              onClick={handleLoginNow}
              className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              지금 로그인하기
            </button>
            
            <button
              onClick={() => {
                const currentOrigin = window.location.origin;
                window.location.href = currentOrigin;
              }}
              className="w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              홈으로 이동
            </button>
          </div>

          {/* 추가 안내 */}
          <div className="mt-8 text-xs text-gray-500">
            <p>문제가 있으신가요? 관리자에게 문의해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmed;