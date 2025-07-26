import { supabase } from './supabase';

// 자료실 관련 API 함수들

// 모든 자료 조회
export const getResources = async () => {
  try {
    const { data: resources, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 각 자료에 대해 카테고리와 업로더 정보를 별도로 조회
    const enrichedResources = await Promise.all(
      (resources || []).map(async (resource) => {
        try {
          // 카테고리 정보 조회
          let category = null;
          if (resource.category_id) {
            const { data: categoryData } = await supabase
              .from('resource_categories')
              .select('name')
              .eq('id', resource.category_id)
              .single();
            category = categoryData;
          }

          // 업로더 정보 조회
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', resource.uploaded_by)
            .single();
          
          return {
            ...resource,
            category: category,
            uploader: profile
          };
        } catch (enrichErr) {
          return {
            ...resource,
            category: null,
            uploader: { name: '익명' }
          };
        }
      })
    );

    return { data: enrichedResources, error: null };
  } catch (error) {
    console.error('자료 조회 오류:', error);
    return { data: [], error };
  }
};

// 카테고리별 자료 조회
export const getResourcesByCategory = async (categoryId) => {
  try {
    const { data: resources, error } = await supabase
      .from('resources')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: resources || [], error: null };
  } catch (error) {
    console.error('카테고리별 자료 조회 오류:', error);
    return { data: [], error };
  }
};

// 모든 카테고리 조회
export const getResourceCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('resource_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    return { data: [], error };
  }
};

// 자료 업로드 (메타데이터만 저장, 실제 파일은 Supabase Storage 사용)
export const createResource = async (resourceData) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: resourceData.title,
        description: resourceData.description,
        file_name: resourceData.file_name,
        file_url: resourceData.file_url,
        file_size: resourceData.file_size,
        file_type: resourceData.file_type,
        category_id: resourceData.category_id,
        uploaded_by: resourceData.uploaded_by
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('자료 생성 오류:', error);
    return { data: null, error };
  }
};

// 자료 삭제
export const deleteResource = async (resourceId) => {
  try {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('자료 삭제 오류:', error);
    return { error };
  }
};

// 자료 수정
export const updateResource = async (resourceId, resourceData) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .update({
        title: resourceData.title,
        description: resourceData.description,
        category_id: resourceData.category_id
      })
      .eq('id', resourceId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('자료 수정 오류:', error);
    return { data: null, error };
  }
};

// 다운로드 수 증가
export const incrementDownloadCount = async (resourceId) => {
  try {
    const { error } = await supabase
      .rpc('increment_download_count', { resource_id: resourceId });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('다운로드 수 증가 오류:', error);
    return { error };
  }
};

// 파일 업로드 (Supabase Storage)
export const uploadFile = async (file, bucket = 'resources') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    // 업로드된 파일의 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { 
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: publicUrl
      }, 
      error: null 
    };
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return { data: null, error };
  }
};

// 파일 삭제 (Supabase Storage)
export const deleteFile = async (filePath, bucket = 'resources') => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    return { error };
  }
};

// 파일 타입별 아이콘 가져오기
export const getFileIcon = (fileType) => {
  if (!fileType) return '📄';
  
  const type = fileType.toLowerCase();
  
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎥';
  if (type.includes('audio')) return '🎵';
  if (type.includes('pdf')) return '📕';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return '🗜️';
  if (type.includes('text')) return '📄';
  
  return '📄';
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};