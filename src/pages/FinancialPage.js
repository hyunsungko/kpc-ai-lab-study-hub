import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFinancialRecords,
  createFinancialRecord,
  updateFinancialRecord,
  deleteFinancialRecord,
  getFinancialSummary,
  getMonthlyFinancialStats,
  getAbsentFeeStats
} from '../lib/financialApi';
import { TableSkeleton } from '../components/LoadingSkeleton';

const FinancialPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [absentFeeStats, setAbsentFeeStats] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: ''
  });
  const [editRecord, setEditRecord] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: ''
  });

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const [recordsResult, summaryResult, monthlyResult, absentResult] = await Promise.all([
        getFinancialRecords(),
        getFinancialSummary(),
        getMonthlyFinancialStats(),
        getAbsentFeeStats()
      ]);

      if (!recordsResult.error) setRecords(recordsResult.data);
      if (!summaryResult.error) setSummary(summaryResult.data);
      if (!monthlyResult.error) setMonthlyStats(monthlyResult.data);
      if (!absentResult.error) setAbsentFeeStats(absentResult.data);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 새 기록 생성
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!user) return;

    const recordData = {
      ...newRecord,
      amount: parseFloat(newRecord.amount),
      recorded_by: user.id
    };

    const { error } = await createFinancialRecord(recordData);
    if (error) {
      console.error('기록 생성 실패:', error);
      alert('기록 생성에 실패했습니다.');
    } else {
      setNewRecord({
        type: 'expense',
        amount: '',
        description: '',
        category: ''
      });
      setIsCreateModalOpen(false);
      loadData();
    }
  };

  // 기록 수정 시작
  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setEditRecord({
      type: record.type,
      amount: record.amount.toString(),
      description: record.description,
      category: record.category
    });
    setIsEditModalOpen(true);
  };

  // 기록 수정 제출
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    const recordData = {
      ...editRecord,
      amount: parseFloat(editRecord.amount)
    };

    const { error } = await updateFinancialRecord(editingRecord.id, recordData);
    if (error) {
      console.error('기록 수정 실패:', error);
      alert('기록 수정에 실패했습니다.');
    } else {
      setEditRecord({
        type: 'expense',
        amount: '',
        description: '',
        category: ''
      });
      setIsEditModalOpen(false);
      setEditingRecord(null);
      loadData();
    }
  };

  // 기록 삭제
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('정말로 이 기록을 삭제하시겠습니까?')) return;

    const { error } = await deleteFinancialRecord(recordId);
    if (error) {
      console.error('기록 삭제 실패:', error);
      alert('기록 삭제에 실패했습니다.');
    } else {
      loadData();
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">장부관리</h1>
              <p className="mt-2 text-gray-600">스터디 그룹의 재정을 관리하세요</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>새 기록 추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              대시보드
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              수입/지출 내역
            </button>
            <button
              onClick={() => setActiveTab('absence')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'absence'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              결석비 관리
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* 재정 요약 카드 */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">총 수입</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">총 지출</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${summary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">현재 잔액</p>
                      <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(summary.balance)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">총 기록 수</p>
                      <p className="text-2xl font-bold text-purple-600">{summary.recordCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 결석비 통계 */}
            {absentFeeStats && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">결석비 통계</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">총 결석비</span>
                      <span className="text-lg font-bold text-orange-600">
                        {formatCurrency(absentFeeStats.totalAbsentFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">총 결석 횟수</span>
                      <span className="text-lg font-bold text-gray-900">{absentFeeStats.absentCount}회</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">멤버별 결석 현황</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(absentFeeStats.memberStats).map(([name, stats]) => (
                        <div key={name} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{name}</span>
                          <span className="text-gray-600">
                            {stats.absentCount}회 / {formatCurrency(stats.totalFee)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 최근 거래 내역 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">최근 거래 내역</h3>
              </div>
              <div className="p-6">
                {records.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">아직 거래 기록이 없습니다.</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      첫 번째 기록 추가하기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {records.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${
                            record.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {record.type === 'income' ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{record.description}</p>
                            <p className="text-sm text-gray-600">
                              {record.category} • {formatDate(record.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            record.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {record.profiles?.name || '익명'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {records.length > 5 && (
                      <div className="text-center">
                        <button
                          onClick={() => setActiveTab('records')}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          모든 기록 보기 ({records.length}개)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">수입/지출 내역</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내용</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.type === 'income' ? '수입' : '지출'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{record.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{record.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.profiles?.name || '익명'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex space-x-2">
                          {user && record.recorded_by === user.id && (
                            <button
                              onClick={() => handleEditRecord(record)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              수정
                            </button>
                          )}
                          {user && record.recorded_by === user.id && (
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'absence' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">결석비 관리</h2>
            <p className="text-gray-600">곧 구현될 예정입니다.</p>
          </div>
        )}
      </main>

      {/* Create Record Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">새 거래 기록</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateRecord} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">구분</label>
                  <select
                    value={newRecord.type}
                    onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="income">수입</option>
                    <option value="expense">지출</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
                  <input
                    type="number"
                    value={newRecord.amount}
                    onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="금액을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <input
                    type="text"
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="거래 내용을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <input
                    type="text"
                    value={newRecord.category}
                    onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 도서비, 간식비, 결석비 등"
                    required
                  />
                </div>


                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    추가
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">거래 기록 수정</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">구분</label>
                  <select
                    value={editRecord.type}
                    onChange={(e) => setEditRecord({ ...editRecord, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="income">수입</option>
                    <option value="expense">지출</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">금액</label>
                  <input
                    type="number"
                    value={editRecord.amount}
                    onChange={(e) => setEditRecord({ ...editRecord, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="금액을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <input
                    type="text"
                    value={editRecord.description}
                    onChange={(e) => setEditRecord({ ...editRecord, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="거래 내용을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <input
                    type="text"
                    value={editRecord.category}
                    onChange={(e) => setEditRecord({ ...editRecord, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 도서비, 간식비, 결석비 등"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    수정
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialPage;