import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getResources,
  getResourceCategories,
  createResource,
  deleteResource,
  updateResource,
  uploadFile,
  deleteFile,
  getFileIcon,
  formatFileSize,
  incrementDownloadCount
} from '../lib/resourceApi';
import { PageLoadingSkeleton } from '../components/LoadingSkeleton';

const ResourcePage = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    category_id: '',
    file: null
  });
  const [editResource, setEditResource] = useState({
    title: '',
    description: '',
    category_id: ''
  });

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const [resourcesResult, categoriesResult] = await Promise.all([
        getResources(),
        getResourceCategories()
      ]);

      if (!resourcesResult.error) setResources(resourcesResult.data);
      if (!categoriesResult.error) setCategories(categoriesResult.data);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 파일 업로드 처리
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!user || !newResource.file) return;

    setUploading(true);
    try {
      // 파일을 Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await uploadFile(newResource.file);
      
      if (uploadError) {
        console.error('파일 업로드 실패:', uploadError);
        alert('파일 업로드에 실패했습니다.');
        setUploading(false);
        return;
      }

      // 자료 메타데이터를 데이터베이스에 저장
      const resourceData = {
        title: newResource.title,
        description: newResource.description,
        file_name: newResource.file.name,
        file_url: uploadData.publicUrl,
        file_size: newResource.file.size,
        file_type: newResource.file.type,
        category_id: newResource.category_id || null,
        uploaded_by: user.id
      };

      const { error: createError } = await createResource(resourceData);
      
      if (createError) {
        console.error('자료 생성 실패:', createError);
        alert('자료 등록에 실패했습니다.');
        // 업로드된 파일 삭제
        await deleteFile(uploadData.path);
      } else {
        setNewResource({
          title: '',
          description: '',
          category_id: '',
          file: null
        });
        setIsUploadModalOpen(false);
        loadData();
      }
    } catch (error) {
      console.error('업로드 처리 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    }
    setUploading(false);
  };

  // 파일 선택 처리
  const handleFileSelect = (files) => {
    if (files && files[0]) {
      const file = files[0];
      setNewResource({
        ...newResource,
        file: file,
        title: newResource.title || file.name.split('.')[0]
      });
    }
  };

  // 드래그 앤 드롭 처리
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // 자료 삭제
  const handleDeleteResource = async (resource) => {
    if (!window.confirm('정말로 이 자료를 삭제하시겠습니까?')) return;

    try {
      // 데이터베이스에서 삭제
      const { error } = await deleteResource(resource.id);
      if (error) {
        console.error('자료 삭제 실패:', error);
        alert('자료 삭제에 실패했습니다.');
        return;
      }

      // Storage에서 파일 삭제 (URL에서 경로 추출)
      const url = new URL(resource.file_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(3).join('/'); // bucket 이후 경로
      await deleteFile(filePath);

      loadData();
    } catch (error) {
      console.error('삭제 처리 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 자료 수정 시작
  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setEditResource({
      title: resource.title,
      description: resource.description || '',
      category_id: resource.category_id || ''
    });
    setIsEditModalOpen(true);
  };

  // 자료 수정 제출
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingResource) return;

    try {
      const { error } = await updateResource(editingResource.id, editResource);
      if (error) {
        console.error('자료 수정 실패:', error);
        alert('자료 수정에 실패했습니다.');
        return;
      }

      setIsEditModalOpen(false);
      setEditingResource(null);
      setEditResource({ title: '', description: '', category_id: '' });
      loadData();
    } catch (error) {
      console.error('자료 수정 오류:', error);
      alert('자료 수정 중 오류가 발생했습니다.');
    }
  };

  // 파일 다운로드
  const handleDownload = async (resource) => {
    try {
      // 다운로드 수 증가
      await incrementDownloadCount(resource.id);
      
      // 파일 다운로드
      const link = document.createElement('a');
      link.href = resource.file_url;
      link.download = resource.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 카운트 업데이트를 위해 데이터 새로고침
      loadData();
    } catch (error) {
      console.error('다운로드 오류:', error);
    }
  };

  // 필터링된 자료 목록
  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category_id === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              <h1 className="text-3xl font-bold text-gray-900">자료실</h1>
              <p className="mt-2 text-gray-600">스터디 관련 자료를 공유하고 다운로드하세요</p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>자료 업로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">카테고리:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="자료 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">
                {filteredResources.length}개 자료
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resources List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredResources.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">자료가 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 자료를 업로드해보세요!</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              자료 업로드하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 relative">
                  {/* 수정/삭제 버튼을 카드 우상단으로 이동 */}
                  {user && resource.uploaded_by === user.id && (
                    <div className="absolute top-3 right-3 flex space-x-1">
                      <button
                        onClick={() => handleEditResource(resource)}
                        className="p-1.5 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        title="수정"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource)}
                        className="p-1.5 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 transition-colors"
                        title="삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mb-4 pr-16">
                    <div className="text-3xl">
                      {getFileIcon(resource.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {resource.file_name}
                      </p>
                    </div>
                  </div>

                  {resource.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>크기: {formatFileSize(resource.file_size)}</span>
                      <span>다운로드: {resource.download_count}회</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>업로드: {formatDate(resource.created_at)}</span>
                      <span>업로더: {resource.uploader?.name || '익명'}</span>
                    </div>
                    {resource.category && (
                      <div className="text-xs">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {resource.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(resource)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3" />
                    </svg>
                    <span>다운로드</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">자료 업로드</h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                {/* File Drop Zone */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">파일 선택</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {newResource.file ? (
                      <div className="space-y-2">
                        <p className="text-green-600 font-medium">✓ {newResource.file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(newResource.file.size)}</p>
                        <button
                          type="button"
                          onClick={() => setNewResource({ ...newResource, file: null })}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          파일 제거
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-600">파일을 여기에 드래그하거나</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          클릭하여 선택하세요
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="자료 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                  <textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="자료에 대한 설명을 입력하세요 (선택사항)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={newResource.category_id}
                    onChange={(e) => setNewResource({ ...newResource, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">카테고리 선택 (선택사항)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={uploading}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={uploading || !newResource.file}
                  >
                    {uploading ? '업로드 중...' : '업로드'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">자료 수정</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={editResource.title}
                    onChange={(e) => setEditResource({ ...editResource, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="자료 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                  <textarea
                    value={editResource.description}
                    onChange={(e) => setEditResource({ ...editResource, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="자료에 대한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={editResource.category_id}
                    onChange={(e) => setEditResource({ ...editResource, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 현재 파일 정보 표시 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">현재 파일</label>
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl">
                      {getFileIcon(editingResource.file_type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{editingResource.file_name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(editingResource.file_size)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    * 파일 자체는 수정할 수 없습니다. 파일을 바꾸려면 삭제 후 새로 업로드하세요.
                  </p>
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

export default ResourcePage;