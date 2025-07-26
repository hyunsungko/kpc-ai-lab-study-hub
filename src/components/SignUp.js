import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SignUp = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    bio: '',
    interests: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 2단계 가입
  const [success, setSuccess] = useState(false); // 성공 상태 추가
  const [needEmailVerification, setNeedEmailVerification] = useState(false); // 이메일 확인 필요
  const { signUp } = useAuth();


  const aiInterests = [
    'ChatGPT/LLM',
    '이미지 생성 AI',
    '코드 생성 AI',
    '문서 자동화',
    '데이터 분석',
    '업무 자동화',
    '교육 콘텐츠 제작',
    '시험 문제 생성'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError('');

    // 1단계 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        {
          name: formData.name,
          bio: formData.bio,
          interests: formData.interests
        }
      );

      if (error) {
        setError(error.message === 'User already registered' 
          ? '이미 등록된 이메일입니다.' 
          : error.message);
        setStep(1); // 에러 시 1단계로 돌아가기
        return;
      }

      // 회원가입 성공 처리
      if (data && data.user && !data.session) {
        // 이메일 확인이 필요한 경우
        setNeedEmailVerification(true);
        console.log('이메일 확인이 필요합니다:', data.user.email);
      } else {
        // 즉시 로그인 가능한 경우
        setSuccess(true);
        setTimeout(() => {
          onToggleMode();
        }, 3000);
      }
    } catch (error) {
      setError('회원가입 중 오류가 발생했습니다.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* 헤더 */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              KPC AI Lab 가입
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Step 1: 기본 정보 입력
            </p>
          </div>

          {/* 1단계 폼 */}
          <form className="mt-8 space-y-6" onSubmit={handleStep1Submit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  이메일 *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@kpc.or.kr"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  비밀번호 *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="최소 6자 이상"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  비밀번호 확인 *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  이름 *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="실명을 입력하세요"
                />
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* 다음 단계 버튼 */}
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              다음 단계
            </button>

            {/* 로그인 링크 */}
            <div className="text-center">
              <button
                type="button"
                onClick={onToggleMode}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                이미 계정이 있으신가요? 로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 이메일 확인 안내 페이지
  if (needEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              이메일을 확인해주세요! 📧
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              회원가입이 완료되었습니다.
            </p>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>{formData.email}</strong>로 확인 이메일을 보냈습니다.
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                이메일 받은편지함을 확인하고 <strong>"이메일 확인"</strong> 버튼을 클릭해주세요.
              </p>
            </div>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📌 <strong>중요:</strong> 스팸 메일함도 확인해보세요!
              </p>
              <p className="text-sm text-blue-800 mt-1">
                이메일 확인 후 로그인이 가능합니다.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.open('https://mail.google.com', '_blank')}
              className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Gmail 열기
            </button>
            <button
              onClick={onToggleMode}
              className="w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 성공 페이지 (이메일 확인 불필요한 경우)
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              가입 완료! 🎉
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              KPC AI Lab 가입이 완료되었습니다.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              이메일을 확인하시고 인증을 완료해주세요.
            </p>
            <p className="mt-4 text-sm text-blue-600">
              3초 후 자동으로 로그인 페이지로 이동합니다...
            </p>
          </div>
          
          <div className="text-center">
            <button
              onClick={onToggleMode}
              className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              지금 로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            KPC AI Lab 가입
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Step 2: 프로필 정보 입력
          </p>
        </div>

        {/* 2단계 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleFinalSubmit}>
          <div className="space-y-4">

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                간단한 소개
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="AI 학습에 대한 관심사나 목표를 간단히 적어주세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관심 AI 분야 (선택)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {aiInterests.map(interest => (
                  <label key={interest} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              이전
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '가입 중...' : '가입 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp; 