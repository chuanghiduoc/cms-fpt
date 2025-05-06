'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { FiArrowLeft, FiSave, FiTrash, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamic import for the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/posts/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="border rounded-lg p-4 min-h-[300px] animate-pulse bg-gray-100"></div>
});

interface Department {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  isPublic: boolean;
  status: string;
  tags: string[];
  authorId: string;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  department: {
    id: string;
    name: string;
  } | null;
}

export default function EditPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        fetchPost();
        fetchDepartments();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${id}`);
      
      if (response.status === 404) {
        toast.error('Không tìm thấy bài viết');
        router.push('/admin/content-review');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const postData = await response.json();
      setPost(postData);
      
      // Set form values
      setTitle(postData.title);
      setContent(postData.content);
      setCoverImageUrl(postData.coverImageUrl);
      setIsPublic(postData.isPublic);
      setTags(postData.tags || []);
      setDepartmentId(postData.departmentId || '');
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Đã xảy ra lỗi khi tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      
      const departmentsData = await response.json();
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách phòng ban');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          coverImageUrl,
          isPublic,
          tags,
          departmentId: departmentId || null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      
      toast.success('Cập nhật bài viết thành công');
      router.push(`/admin/content-review/posts/view/${id}`);
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      toast.success('Xóa bài viết thành công');
      router.push('/admin/content-review');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Đã xảy ra lỗi khi xóa bài viết');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      toast.loading('Đang tải ảnh lên...');
      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      setCoverImageUrl(data.file.fileUrl);
      toast.dismiss();
      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.dismiss();
      toast.error('Đã xảy ra lỗi khi tải ảnh lên');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div>
          <div className="inline-flex h-10 w-40 rounded-md bg-gray-200 animate-pulse"></div>
        </div>

        {/* Form skeleton */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            {/* Title skeleton */}
            <div className="h-8 w-3/4 bg-gray-200 rounded-md mb-6 animate-pulse"></div>
            
            <div className="space-y-6">
              {/* Title input skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              
              {/* Department select skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              
              {/* Cover image skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 h-64">
                  <div className="animate-pulse flex flex-col items-center text-center">
                    <div className="mb-3 p-3 rounded-full h-16 w-16 bg-gray-200"></div>
                    <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="mt-1 h-4 w-64 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="mt-2 h-3 w-40 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Content editor skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="h-64 w-full border rounded-lg bg-gray-100 animate-pulse"></div>
              </div>
              
              {/* Tags input skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="flex">
                  <div className="flex-1 h-10 bg-gray-200 rounded-l-md animate-pulse"></div>
                  <div className="h-10 w-20 bg-gray-200 rounded-r-md animate-pulse"></div>
                </div>
              </div>
              
              {/* Public checkbox skeleton */}
              <div>
                <div className="flex items-start">
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="ml-3">
                    <div className="h-5 w-1/4 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="mt-1 h-4 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Buttons skeleton */}
              <div className="flex justify-end pt-5 space-x-3">
                <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Không tìm thấy bài viết</h2>
        <p className="mt-2 text-gray-600">Bài viết không tồn tại hoặc đã bị xóa.</p>
        <div className="mt-6">
          <Link
            href="/admin/content-review"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
          >
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Quay lại danh sách nội dung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/admin/content-review/posts/view/${post.id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
        >
          <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Quay lại xem bài viết
        </Link>
      </div>

      {/* Edit form */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa bài viết</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 cursor-text"
                required
              />
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Phòng ban
              </label>
              <select
                id="department"
                name="department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
              >
                <option value="">Không có phòng ban</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh bìa
              </label>
              <div className="mt-1">
                {coverImageUrl ? (
                  <div className="relative group">
                    <img
                      src={coverImageUrl}
                      alt="Cover"
                      className="w-full h-64 object-cover rounded-lg shadow-sm transition-all duration-300 hover:opacity-90"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl(null)}
                        className="p-2 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 transition-colors"
                        title="Xóa ảnh"
                      >
                        <FiTrash size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/80 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                      Đã tải lên
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer h-64"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageUpload(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-3 p-3 bg-orange-100 rounded-full text-orange-600">
                        <FiImage size={24} />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Tải ảnh bìa lên</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Kéo và thả ảnh vào đây hoặc nhấp để chọn từ máy tính
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        PNG, JPG, GIF lên đến 5MB
                      </p>
                    </div>
                    <input
                      id="cover-upload"
                      name="cover-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <RichTextEditor value={content} onChange={setContent} />
              </div>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Thẻ
              </label>
              <div className="mt-1">
                <div className="flex">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 cursor-text"
                    placeholder="Thêm thẻ và nhấn Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Thêm
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-orange-400 hover:bg-orange-200 hover:text-orange-500 focus:outline-none"
                        >
                          <span className="sr-only">Remove tag</span>
                          <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isPublic"
                    name="isPublic"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isPublic" className="font-medium text-gray-700">
                    Công khai
                  </label>
                  <p className="text-gray-500">
                    Nếu bật, bài viết sẽ hiển thị công khai trên trang sau khi được duyệt.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-5 space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
              >
                <FiTrash className="-ml-1 mr-2 h-5 w-5" />
                Xóa bài viết
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <FiSave className="-ml-1 mr-2 h-5 w-5" />
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xóa bài viết
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 